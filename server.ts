import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin
async function initFirebase() {
  if (admin.apps.length > 0) {
    await Promise.all(admin.apps.map(app => app?.delete()));
  }
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Firebase Admin initialized with Project ID:", firebaseConfig.projectId);
}

initFirebase().catch(err => console.error("Firebase Init Error:", err));

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Global Error Handler for API
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global API Error:", err);
    res.status(500).json({ 
      error: "Erro interno no servidor de API", 
      details: err.message || err 
    });
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
  });
}

startServer();
