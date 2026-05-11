import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment, PreApprovalPlan, PreApproval } from "mercadopago";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Firebase Admin initialized with explicit projectId:", firebaseConfig.projectId);
}

// Auth Middleware
async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Sessão expirada ou inválida. Por favor, faça login novamente." });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mercado Pago Configuration
  const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  let mpClient: MercadoPagoConfig | null = null;
  
  if (mpAccessToken) {
    mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
  }

  app.post("/api/create-payment", authenticate, async (req, res) => {
    if (!mpClient) {
       return res.status(500).json({ error: "O Mercado Pago não está configurado. Por favor, adicione o token de acesso." });
    }

    const { planType } = req.body;
    const user = (req as any).user;
    const userId = user.uid;
    const userEmail = user.email;

    const host = req.get("host");
    const protocol = "https"; 

    try {
      if (planType === "lifetime" || planType === "monthly") {
        const isLifetime = planType === "lifetime";
        const price = isLifetime ? 14.99 : 5.99;
        const title = isLifetime ? "Jornada+ Premium - Vitalício" : "Jornada+ Premium - Mensal";
        
        const preference = new Preference(mpClient);
        const result = await preference.create({
          body: {
            items: [
              {
                id: `${planType}-plan`,
                title: title,
                quantity: 1,
                unit_price: price,
                currency_id: "BRL",
              }
            ],
            payer: { email: userEmail },
            external_reference: userId,
            back_urls: {
              success: `${protocol}://${host}/settings?payment=success&plan=${planType}`,
              failure: `${protocol}://${host}/settings?payment=failure`,
              pending: `${protocol}://${host}/settings?payment=pending`,
            },
            auto_return: "approved",
          }
        });
        return res.json({ init_point: result.init_point || result.sandbox_init_point });
      } else {
        return res.status(400).json({ error: "Plano inválido" });
      }
    } catch (error: any) {
      console.error("Error creating MP payment:", error);
      
      let details = error.message || error;
      if (error.response && typeof error.response === 'object') {
        details = (error as any).response.body || (error as any).response.data || error.response;
      }

      res.status(500).json({ 
        error: "Erro ao processar pagamento no Mercado Pago", 
        details: details
      });
    }
  });

  app.post("/api/subscription/create-plan", authenticate, async (req, res) => {
    if (!mpClient) {
      return res.status(500).json({ error: "O Mercado Pago não está configurado." });
    }

    const { reason, amount } = req.body;

    try {
      const plan = new PreApprovalPlan(mpClient);
      const result = await plan.create({
        body: {
          reason: reason || "Jornada+ Premium",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            billing_day: 1,
            billing_day_proportional: true,
            transaction_amount: amount || 5.99,
            currency_id: "BRL"
          },
          back_url: "https://www.google.com", 
        }
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Erro ao criar plano de assinatura", details: error.message });
    }
  });

  app.post("/api/subscription/subscribe", authenticate, async (req, res) => {
    if (!mpClient) {
      return res.status(500).json({ error: "O Mercado Pago não está configurado." });
    }

    let { planId, cardTokenId, payerEmail, reason } = req.body;

    try {
      const plan = new PreApprovalPlan(mpClient);
      const preApproval = new PreApproval(mpClient);

      // If planId is "monthly", try to find if we already have one or create a new one
      if (planId === "monthly") {
        try {
          // This is a simplified plan resolution. 
          // In a real app we'd store the plan ID.
          const planResult = await plan.create({
            body: {
              reason: "Jornada+ Premium Mensal",
              auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                billing_day: 1,
                billing_day_proportional: true,
                transaction_amount: 5.99,
                currency_id: "BRL"
              },
              back_url: "https://www.google.com"
            }
          });
          planId = planResult.id;
        } catch (planError) {
          console.error("Plan creation error (might already exist or limit reached):", planError);
          // If creation fails, we might need to search, but for now we'll throw
          throw new Error("Não foi possível configurar o plano de assinatura.");
        }
      }

      const result = await preApproval.create({
        body: {
          preapproval_plan_id: planId,
          reason: reason || "Assinatura Jornada+",
          payer_email: payerEmail,
          card_token_id: cardTokenId,
          status: "authorized",
          back_url: "https://www.google.com"
        }
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Erro ao criar assinatura no Mercado Pago", details: error.message });
    }
  });

  // API Route: Mercado Pago Webhook
  app.post("/api/webhook", async (req, res) => {
    const { action, data } = req.body;
    console.log("Webhook received:", action, data);

    // In a real production app, we would verify the payment status here
    // using mpClient.payment.get(data.id) and then update Firestore.
    // For this prototype, we'll assume the frontend will also handle the success return.
    
    res.sendStatus(200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!mpAccessToken) {
      console.warn("⚠️ MERCADO_PAGO_ACCESS_TOKEN not set. Payments will fail.");
    }
  });
}

startServer();
