import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.sqlite');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    entryTime TEXT NOT NULL,
    exitTime TEXT NOT NULL,
    calculatedHours REAL NOT NULL,
    percentage REAL NOT NULL,
    calculatedValue REAL NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/entries', (req, res) => {
    try {
      const entries = db.prepare('SELECT * FROM entries ORDER BY date DESC, entryTime DESC').all();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
  });

  app.post('/api/entries', (req, res) => {
    try {
      const entry = req.body;
      const stmt = db.prepare(`
        INSERT INTO entries (id, type, date, entryTime, exitTime, calculatedHours, percentage, calculatedValue, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        entry.id,
        entry.type,
        entry.date,
        entry.entryTime,
        entry.exitTime,
        entry.calculatedHours,
        entry.percentage,
        entry.calculatedValue,
        entry.createdAt
      );
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create entry' });
    }
  });

  app.put('/api/entries/:id', (req, res) => {
    try {
      const { id } = req.params;
      const entry = req.body;
      const stmt = db.prepare(`
        UPDATE entries 
        SET type = ?, date = ?, entryTime = ?, exitTime = ?, calculatedHours = ?, percentage = ?, calculatedValue = ?
        WHERE id = ?
      `);
      stmt.run(
        entry.type,
        entry.date,
        entry.entryTime,
        entry.exitTime,
        entry.calculatedHours,
        entry.percentage,
        entry.calculatedValue,
        id
      );
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entry' });
    }
  });

  app.delete('/api/entries/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM entries WHERE id = ?').run(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  });

  app.delete('/api/entries', (req, res) => {
    try {
      db.prepare('DELETE FROM entries').run();
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear entries' });
    }
  });

  app.get('/api/settings', (req, res) => {
    try {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('app_settings');
      if (row) {
        res.json(JSON.parse(row.value));
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', (req, res) => {
    try {
      const settings = req.body;
      console.log('Saving settings:', JSON.stringify(settings));
      const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      const result = stmt.run('app_settings', JSON.stringify(settings));
      console.log('Save result:', result);
      res.json(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
