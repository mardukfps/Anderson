import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');

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

// Pre-prepare statements for performance
const insertEntryStmt = db.prepare(`
  INSERT INTO entries (id, type, date, entryTime, exitTime, calculatedHours, percentage, calculatedValue, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const deleteEntriesStmt = db.prepare('DELETE FROM entries');
const deleteSettingsStmt = db.prepare('DELETE FROM settings');
const insertSettingsStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
const fetchEntriesStmt = db.prepare('SELECT * FROM entries ORDER BY date DESC, entryTime DESC');
const fetchAllEntriesStmt = db.prepare('SELECT * FROM entries');
const fetchSettingsStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const deleteEntryByIdStmt = db.prepare('DELETE FROM entries WHERE id = ?');
const updateEntryStmt = db.prepare(`
  UPDATE entries 
  SET type = ?, date = ?, entryTime = ?, exitTime = ?, calculatedHours = ?, percentage = ?, calculatedValue = ?
  WHERE id = ?
`);

// Optimized Import Transaction
const importTransaction = db.transaction((backupData) => {
  if (!backupData || !backupData.data) return;

  deleteEntriesStmt.run();
  deleteSettingsStmt.run();

  const entries = backupData.data.entries;
  if (entries && Array.isArray(entries)) {
    for (const entry of entries) {
      insertEntryStmt.run(
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
    }
  }

  if (backupData.data?.settings) {
    insertSettingsStmt.run('app_settings', JSON.stringify(backupData.data.settings));
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // API Routes
  app.get('/api/entries', (req, res) => {
    try {
      const entries = fetchEntriesStmt.all();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
  });

  app.post('/api/entries', (req, res) => {
    try {
      const entry = req.body;
      insertEntryStmt.run(
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
      updateEntryStmt.run(
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
      deleteEntryByIdStmt.run(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  });

  app.delete('/api/entries', (req, res) => {
    try {
      deleteEntriesStmt.run();
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear entries' });
    }
  });

  app.get('/api/settings', (req, res) => {
    try {
      const row = fetchSettingsStmt.get('app_settings') as { value: string } | undefined;
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
      insertSettingsStmt.run('app_settings', JSON.stringify(settings));
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Backup & Restore
  app.get('/api/backup', (req, res) => {
    try {
      const entries = fetchAllEntriesStmt.all();
      const settingsRow = fetchSettingsStmt.get('app_settings') as { value: string } | undefined;
      const settings = settingsRow ? JSON.parse(settingsRow.value) : null;
      
      res.json({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          entries,
          settings
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate backup' });
    }
  });

  app.post('/api/backup/import', (req, res) => {
    console.log('Received backup import request');
    try {
      if (!req.body || !req.body.data) {
        console.error('Invalid backup data received:', req.body);
        return res.status(400).json({ error: 'Invalid backup data' });
      }
      
      console.log('Starting import transaction...');
      importTransaction(req.body);
      console.log('Import transaction completed successfully');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Import failed:', error);
      res.status(500).json({ error: 'Failed to import backup' });
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
