import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'data', 'database.db');

let db;

async function initializeDatabase() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS calculators (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        history TEXT NOT NULL,
        sort_order INTEGER
      );
      CREATE TABLE IF NOT EXISTS window_states (
        id TEXT PRIMARY KEY,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        zIndex INTEGER NOT NULL,
        isOpen BOOLEAN NOT NULL,
        isScientific BOOLEAN NOT NULL,
        FOREIGN KEY (id) REFERENCES calculators(id) ON DELETE CASCADE
      );
    `);
    
    // Check if there is any data, if not, add a default calculator
    const count = await db.get('SELECT COUNT(*) as count FROM calculators');
    if (count.count === 0) {
        const newId = `calc-${Date.now()}`;
        await db.run('INSERT INTO calculators (id, title, history, sort_order) VALUES (?, ?, ?, ?)',
            newId, 'Calculator 1', 'Welcome to OpenCalcPad!\nType notes here.\nUse buttons or numpad for calculations.\nEnter once to carry result.\nEnter twice to clear.\n', 0
        );
        await db.run('INSERT INTO window_states (id, x, y, width, height, zIndex, isOpen, isScientific) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            newId, 50, 50, 380, 500, 10, 1, 0
        );
    }
    
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/state', async (req, res) => {
  try {
    const calculators = await db.all('SELECT * FROM calculators ORDER BY sort_order ASC');
    const windows = await db.all('SELECT * FROM window_states');
    res.json({ calculators, windows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

app.post('/api/calculators', async (req, res) => {
  try {
    const { newCalc, newWindow } = req.body;
    await db.run('INSERT INTO calculators (id, title, history, sort_order) VALUES (?, ?, ?, ?)',
        newCalc.id, newCalc.title, newCalc.history, newCalc.sortOrder
    );
    await db.run('INSERT INTO window_states (id, x, y, width, height, zIndex, isOpen, isScientific) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        newWindow.id, newWindow.x, newWindow.y, newWindow.width, newWindow.height, newWindow.zIndex, newWindow.isOpen, newWindow.isScientific
    );
    res.status(201).json({ id: newCalc.id });
  } catch(err) {
    res.status(500).json({ error: 'Failed to create calculator' });
  }
});

app.delete('/api/calculators/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM calculators WHERE id = ?', req.params.id);
        // ON DELETE CASCADE will handle deleting from window_states
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete calculator' });
    }
});

app.put('/api/calculators/:id', async (req, res) => {
    try {
        const { title, history } = req.body;
        // Only update fields that are provided
        if (title !== undefined) {
            await db.run('UPDATE calculators SET title = ? WHERE id = ?', title, req.params.id);
        }
        if (history !== undefined) {
             await db.run('UPDATE calculators SET history = ? WHERE id = ?', history, req.params.id);
        }
        res.status(200).json({ id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update calculator' });
    }
});

app.put('/api/windows/:id', async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        if(fields.length > 0){
             await db.run(`UPDATE window_states SET ${fields} WHERE id = ?`, [...values, req.params.id]);
        }
        res.status(200).json({ id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update window state' });
    }
});

app.post('/api/state/reorder', async (req, res) => {
    const { orderedIds } = req.body; // Expecting an array of calculator IDs in the new order
    try {
        await db.run('BEGIN TRANSACTION');
        for(let i=0; i < orderedIds.length; i++){
            await db.run('UPDATE calculators SET sort_order = ? WHERE id = ?', i, orderedIds[i]);
        }
        await db.run('COMMIT');
        res.status(200).send();
    } catch(err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: 'Failed to reorder calculators'});
    }
});

app.post('/api/state/import', async (req, res) => {
    const { calculators, windows } = req.body;
    if (!Array.isArray(calculators) || !Array.isArray(windows)) {
        return res.status(400).json({ error: 'Invalid import data format' });
    }
    try {
        await db.run('BEGIN TRANSACTION');
        await db.run('DELETE FROM calculators');
        await db.run('DELETE FROM window_states');

        for (const calc of calculators) {
            await db.run('INSERT INTO calculators (id, title, history, sort_order) VALUES (?, ?, ?, ?)', calc.id, calc.title, calc.history, calc.sort_order ?? 0);
        }
        for (const win of windows) {
            await db.run('INSERT INTO window_states (id, x, y, width, height, zIndex, isOpen, isScientific) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', win.id, win.x, win.y, win.width, win.height, win.zIndex, win.isOpen, win.isScientific);
        }

        await db.run('COMMIT');
        res.status(200).send();
    } catch(err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: 'Failed to import data' });
    }
});


// Serve static frontend
const frontendPath = path.join(__dirname, 'dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
