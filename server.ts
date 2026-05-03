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
db.pragma('synchronous = NORMAL');

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
const fetchSettingsStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const deleteEntryByIdStmt = db.prepare('DELETE FROM entries WHERE id = ?');
const updateEntryStmt = db.prepare(`
  UPDATE entries 
  SET type = ?, date = ?, entryTime = ?, exitTime = ?, calculatedHours = ?, percentage = ?, calculatedValue = ?
  WHERE id = ?
`);

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
      console.error('Error fetching entries:', error);
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
  });

  app.post('/api/entries', (req, res) => {
    try {
      const entry = req.body;
      console.log('Adding entry:', entry);
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
      console.error('Error creating entry:', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  });

  app.put('/api/entries/:id', (req, res) => {
    try {
      const { id } = req.params;
      const entry = req.body;
      console.log('Updating entry:', id, entry);
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
      console.error('Error updating entry:', error);
      res.status(500).json({ error: 'Failed to update entry' });
    }
  });

  app.delete('/api/entries/:id', (req, res) => {
    try {
      const { id } = req.params;
      console.log('Deleting entry:', id);
      deleteEntryByIdStmt.run(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting entry:', error);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  });

  app.delete('/api/entries', (req, res) => {
    try {
      console.log('Clearing all entries');
      deleteEntriesStmt.run();
      res.status(204).end();
    } catch (error) {
      console.error('Error clearing entries:', error);
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
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', (req, res) => {
    try {
      const settings = req.body;
      console.log('API: SAVE SETTINGS - Payload:', JSON.stringify(settings));
      
      if (!settings || typeof settings !== 'object') {
        console.error('API Error: Invalid settings body type:', typeof settings);
        return res.status(400).json({ error: 'Dados de configuração inválidos.' });
      }

      // Check for basic structure
      if (!settings.theme || settings.baseHourlyRate === undefined) {
         console.warn('API Warning: settings payload might be incomplete', settings);
      }

      const settingsJson = JSON.stringify(settings);
      
      // Use a direct execution to avoid potential prepared statement state issues
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('app_settings', settingsJson);
      
      console.log('API Success: Settings saved successfully.');
      res.json(settings);
    } catch (error: any) {
      console.error('API Error saving settings:', error);
      res.status(500).json({ 
        error: 'Erro crítico ao salvar no banco de dados.',
        details: error.message 
      });
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
