
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const http = require('http');
const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, '..', 'dist')));
// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// === DATABASE SETUP ===
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
} catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    // Fallback or exit if DB is essential
}

const initializeDb = async () => {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL
            );
        `);
        // Check if data exists
        const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
        if (res.rows.length === 0) {
            // Seed initial data if table is empty
            const { INITIAL_SETTINGS } = require('../data/initialData');
            const initialData = {
                users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
                purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
                adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
                themes: [], loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
            };
            await pool.query("INSERT INTO app_data (key, value) VALUES ('appState', $1)", [JSON.stringify(initialData)]);
            console.log("Database seeded with initial structure.");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
    }
};

const saveData = async (data) => {
    if (!pool) throw new Error("Database not connected.");
    // Exclude transient frontend state from being saved
    const { isAppUnlocked, isFirstRun, currentUser, activePage, appMode, notifications, isDataLoaded, activeMarketId, allTags, isSwitchingUser, isSharedViewActive, targetedUserForLogin, isAiConfigured, isSidebarCollapsed, syncStatus, syncError, isChatOpen, ...dataToSave } = data;
    await pool.query(
        "INSERT INTO app_data (key, value) VALUES ('appState', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [JSON.stringify(dataToSave)]
    );
};

const loadData = async () => {
    if (!pool) throw new Error("Database not connected.");
    const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
    if (res.rows.length === 0) {
        throw new Error("No data found in database.");
    }
    return res.rows[0].value;
};


// === WEBSOCKET SETUP ===
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});

const broadcast = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// === FILE UPLOAD (LOCAL) ===
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const categoryPath = path.join(UPLOAD_DIR, category);
        await fs.mkdir(categoryPath, { recursive: true });
        cb(null, categoryPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });


// === BACKUP SETUP ===
const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);

// === API ENDPOINTS ===

// Generic data sync
app.get('/api/data', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load data.' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        await saveData(req.body);
        broadcast(JSON.stringify({ type: 'FULL_STATE_UPDATE', payload: req.body }));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data.' });
    }
});

// Media upload endpoint
app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const category = req.body.category || 'Miscellaneous';
    const url = `/uploads/${category}/${req.file.filename}`;
    res.json({ url });
});

// Local media gallery
app.get('/api/media/local-gallery', async (req, res) => {
    try {
        const categories = await fs.readdir(UPLOAD_DIR);
        const allImages = [];
        for (const category of categories) {
            const categoryPath = path.join(UPLOAD_DIR, category);
            const stats = await fs.stat(categoryPath);
            if (stats.isDirectory()) {
                const files = await fs.readdir(categoryPath);
                files.forEach(file => {
                    allImages.push({
                        url: `/uploads/${category}/${file}`,
                        category,
                        name: file,
                    });
                });
            }
        }
        res.json(allImages);
    } catch (error) {
        console.error("Error reading local gallery:", error);
        res.status(500).json({ error: "Could not read image gallery." });
    }
});

// AI endpoints
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;
app.get('/api/ai/status', (req, res) => {
    res.json({ isConfigured: !!ai });
});
app.post('/api/ai/test', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'API key not configured on server.' });
    try {
        await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        res.json({ success: true, message: 'API key is valid.' });
    } catch (e) {
        res.status(500).json({ error: 'API key test failed. Key may be invalid or expired.' });
    }
});
app.post('/api/ai/generate', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI features not enabled on server.' });
    try {
        const { prompt, generationConfig, model } = req.body;
        const response = await ai.models.generateContent({
          model: model || 'gemini-2.5-flash',
          contents: prompt,
          config: generationConfig
        });
        res.json(response);
    } catch (e) {
        res.status(500).json({ error: `AI generation failed: ${e.message}` });
    }
});

// Backup endpoints
app.get('/api/backups', async (req, res) => {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        const files = await fs.readdir(BACKUP_DIR);
        const backupDetails = await Promise.all(
            files
                .filter(file => file.endsWith('.json'))
                .map(async file => {
                    const filePath = path.join(BACKUP_DIR, file);
                    const stats = await fs.stat(filePath);
                    return {
                        filename: file,
                        createdAt: stats.mtime.toISOString(),
                        size: stats.size,
                        isAuto: file.startsWith('auto_'),
                    };
                })
        );
        backupDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(backupDetails);
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ error: 'Could not list backups.' });
    }
});

app.get('/api/backups/:filename', (req, res) => {
    const { filename } = req.params;
    if (filename.includes('..')) return res.status(400).json({ error: 'Invalid filename.' });
    const filePath = path.join(BACKUP_DIR, filename);
    res.download(filePath, filename, (err) => {
        if (err && !res.headersSent) res.status(404).json({ error: 'File not found.' });
    });
});

app.post('/api/backups/create', async (req, res) => {
    try {
        const data = await loadData();
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const filename = `manual_backup_${timestamp}.json`;
        const filePath = path.join(BACKUP_DIR, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        res.json({ message: `Successfully created backup: ${filename}` });
    } catch (error) {
        console.error('Error creating manual backup:', error);
        res.status(500).json({ error: 'Failed to create manual backup.' });
    }
});

app.post('/api/backups/restore/:filename', async (req, res) => {
    const { filename } = req.params;
    if (filename.includes('..')) return res.status(400).json({ error: 'Invalid filename.' });
    const filePath = path.join(BACKUP_DIR, filename);

    try {
        const backupData = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(backupData);
        await saveData(data);
        broadcast(JSON.stringify({ type: 'FULL_STATE_UPDATE', payload: data }));
        res.json({ message: 'Restore successful. App is reloading.' });
    } catch (error) {
        console.error('Error restoring from backup:', error);
        res.status(500).json({ error: 'Failed to restore from backup.' });
    }
});

app.delete('/api/backups/:filename', async (req, res) => {
    const { filename } = req.params;
    if (filename.includes('..')) return res.status(400).json({ error: 'Invalid filename.' });
    const filePath = path.join(BACKUP_DIR, filename);
    try {
        await fs.unlink(filePath);
        res.json({ message: `Successfully deleted ${filename}.` });
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ error: 'Could not delete backup file.' });
    }
});


// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await initializeDb();
    console.log(`Server running on port ${PORT}`);
});
