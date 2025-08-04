
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const http = require('http');
const WebSocket = require('ws');

// --- Environment Variable Checks ---
const requiredEnv = ['STORAGE_PROVIDER'];
for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: ${envVar} environment variable is not set.`);
        process.exit(1);
    }
}

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === WebSocket Logic ===
wss.on('connection', ws => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// === Middleware ===
const allowedOrigins = ['https://taskdonegeon.mckayc.com', 'http://localhost:3000', 'http://localhost:3002'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));


// === Gemini AI Client ===
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set. AI features will be disabled.");
}

// === Multer Configuration for File Uploads ===
const UPLOADS_DIR = path.resolve('/app', 'uploads');
const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        const finalDir = path.join(UPLOADS_DIR, sanitizedCategory);
        try {
            await fs.mkdir(finalDir, { recursive: true });
            cb(null, finalDir);
        } catch (err) {
            cb(err);
        }
      },
      filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
      }
    });

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// === Backup Configuration ===
const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');

// === Database Connection and Initialization ===
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'taskdonegeon.db');
let db;

// Promisify sqlite3 functions to use async/await
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const initializeDatabase = async () => {
    try {
        await fs.mkdir(DB_DIR, { recursive: true });
        console.log(`Data directory is ready at: ${DB_DIR}`);

        db = new sqlite3.Database(DB_PATH, async (err) => {
            if (err) {
                console.error("Fatal error connecting to SQLite database:", err.message);
                process.exit(1);
            }
            console.log('Connected to the SQLite database.');

            try {
                await dbRun(`
                    CREATE TABLE IF NOT EXISTS app_data (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );
                `);
                console.log("Table 'app_data' is ready.");
                await fs.mkdir(BACKUP_DIR, { recursive: true });
                console.log(`Backup directory is ready at: ${BACKUP_DIR}`);
            } catch (initErr) {
                console.error("Fatal error initializing database table:", initErr.message);
                process.exit(1);
            }
        });
    } catch (dirErr) {
        console.error("Fatal error creating data directory:", dirErr.message);
        process.exit(1);
    }
};

initializeDatabase().catch(err => {
    console.error("Critical error during database initialization:", err);
    process.exit(1);
});

// === API ROUTES ===

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.get('/api/metadata', async (req, res, next) => {
    try {
        const metadataPath = path.join(__dirname, '..', 'metadata.json');
        const data = await fs.readFile(metadataPath, 'utf8');
        res.status(200).json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading metadata.json:', err);
        next(err);
    }
});

app.get('/api/data/load', async (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Received GET /api/data/load`);
    try {
        const row = await dbGet('SELECT value FROM app_data WHERE key = ?', ['app_state']);
        const data = row ? JSON.parse(row.value) : {};
        console.log(`[${new Date().toISOString()}] Loading data success.`);
        res.status(200).json(data);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ERROR in GET /api/data/load:`, err);
        next(err);
    }
});

app.post('/api/data/save', async (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Received POST /api/data/save`);
    try {
        const dataToSave = req.body;
        if (!dataToSave || typeof dataToSave !== 'object') {
            return res.status(400).json({ error: 'Invalid data format. Expected a JSON object.' });
        }
        const dataString = JSON.stringify(dataToSave);
        await dbRun(`INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?);`, ['app_state', dataString]);
        console.log(`[${new Date().toISOString()}] Save data success.`);
        broadcast({ type: 'DATA_UPDATED' });
        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ERROR in POST /api/data/save:`, err);
        next(err);
    }
});

app.get('/api/backups', async (req, res, next) => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupDetails = await Promise.all(
            files.filter(file => file.endsWith('.json')).map(async file => {
                const stats = await fs.stat(path.join(BACKUP_DIR, file));
                return { filename: file, createdAt: stats.birthtime, size: stats.size, isAuto: file.startsWith('auto_backup_') };
            })
        );
        res.json(backupDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
        if (err.code === 'ENOENT') return res.json([]);
        next(err);
    }
});

app.post('/api/backups', async (req, res, next) => {
    try {
        const dataToBackup = JSON.stringify(req.body, null, 2);
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const filename = `manual_backup_${timestamp}.json`;
        await fs.writeFile(path.join(BACKUP_DIR, filename), dataToBackup);
        res.status(201).json({ message: 'Manual backup created successfully.' });
    } catch (err) {
        next(err);
    }
});

app.get('/api/backups/:filename', (req, res, next) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(BACKUP_DIR, filename);
    res.download(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") return res.status(404).json({ error: "File not found." });
            next(err);
        }
    });
});

app.delete('/api/backups/:filename', async (req, res, next) => {
    try {
        const filename = path.basename(req.params.filename);
        await fs.unlink(path.join(BACKUP_DIR, filename));
        res.status(200).json({ message: 'Backup deleted successfully.' });
    } catch (err) {
        if (err.code === "ENOENT") return res.status(404).json({ error: "File not found." });
        next(err);
    }
});

app.post('/api/media/upload', upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    try {
        const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
        const fileUrl = `/uploads/${relativePath}`;
        res.status(201).json({ url: fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size });
    } catch (err) {
        next(err);
    }
});

app.get('/api/media/local-gallery', async (req, res, next) => {
    const walk = async (dir, parentCategory = null) => {
        let dirents;
        try {
            dirents = await fs.readdir(dir, { withFileTypes: true });
        } catch (e) {
            if (e.code === 'ENOENT') {
                await fs.mkdir(dir, { recursive: true });
                return [];
            }
            throw e;
        }
        let imageFiles = [];
        for (const dirent of dirents) {
            const fullPath = path.join(dir, dirent.name);
            if (dirent.isDirectory()) {
                imageFiles.push(...await walk(fullPath, dirent.name));
            } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(dirent.name)) {
                const relativePath = path.relative(UPLOADS_DIR, fullPath).replace(/\\/g, '/');
                imageFiles.push({
                    url: `/uploads/${relativePath}`,
                    category: parentCategory ? (parentCategory.charAt(0).toUpperCase() + parentCategory.slice(1)) : 'Miscellaneous',
                    name: dirent.name.replace(/\.[^/.]+$/, ""),
                });
            }
        }
        return imageFiles;
    };
    try {
        res.status(200).json(await walk(UPLOADS_DIR));
    } catch (err) {
        next(err);
    }
});

app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!ai }));

app.post('/api/ai/test', async (req, res) => {
    if (!ai) return res.status(400).json({ success: false, error: "AI features are not configured on the server." });
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        if (response && response.text) res.json({ success: true });
        else throw new Error("Invalid response from API.");
    } catch (error) {
        res.status(400).json({ success: false, error: 'API key is invalid or permissions are insufficient.' });
    }
});

app.post('/api/ai/generate', async (req, res, next) => {
    if (!ai) return res.status(503).json({ error: "AI features are not configured on the server." });
    const { model, prompt, generationConfig } = req.body;
    try {
        const response = await ai.models.generateContent({ model, contents: prompt, config: generationConfig });
        res.json({ text: response.text });
    } catch (err) {
        next(err);
    }
});

const GITHUB_REPO = 'mckayc/task-donegeon';
const GITHUB_BRANCH = 'master';
const IMAGE_PACK_ROOT = 'image-packs';

const getLocalFileBasenames = async (dir) => {
    let basenames = new Set();
    try {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            if (dirent.isDirectory()) {
                (await getLocalFileBasenames(path.resolve(dir, dirent.name))).forEach(b => basenames.add(b));
            } else {
                basenames.add(dirent.name);
            }
        }
    } catch (err) {
        if (err.code !== 'ENOENT') console.error("Error reading local gallery:", err);
    }
    return basenames;
};

app.get('/api/image-packs', async (req, res, next) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${IMAGE_PACK_ROOT}?ref=${GITHUB_BRANCH}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        const packsData = await response.json();
        if (!Array.isArray(packsData)) return res.json([]);
        const packPromises = packsData.filter(item => item.type === 'dir').map(async (packDir) => {
            const contentsResponse = await fetch(packDir.url);
            const contentsData = await contentsResponse.json();
            if (!Array.isArray(contentsData)) return null;
            const sampleImage = contentsData.find(item => item.type === 'file' && item.name.toLowerCase().startsWith('sample.'));
            return sampleImage ? { name: packDir.name, sampleImageUrl: sampleImage.download_url } : null;
        });
        res.status(200).json((await Promise.all(packPromises)).filter(Boolean));
    } catch (err) {
        next(err);
    }
});

app.get('/api/image-packs/:packName', async (req, res, next) => {
    try {
        const localBasenames = await getLocalFileBasenames(UPLOADS_DIR);
        const packUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${IMAGE_PACK_ROOT}/${path.basename(req.params.packName)}?ref=${GITHUB_BRANCH}`;
        const packResponse = await fetch(packUrl);
        if (!packResponse.ok) throw new Error(`Could not find pack.`);
        const packContents = await packResponse.json();
        let filesToCompare = [];
        for (const item of packContents) {
            if (item.type === 'dir') {
                const categoryContents = await (await fetch(item.url)).json();
                for (const file of categoryContents) {
                    if (file.type === 'file') filesToCompare.push({ category: item.name, name: file.name, url: file.download_url, exists: localBasenames.has(file.name) });
                }
            } else if (item.type === 'file') {
                filesToCompare.push({ category: 'Miscellaneous', name: item.name, url: item.download_url, exists: localBasenames.has(item.name) });
            }
        }
        res.json(filesToCompare);
    } catch (err) {
        next(err);
    }
});

app.post('/api/image-packs/import', async (req, res, next) => {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'No files specified.' });
    try {
        let importedCount = 0;
        for (const file of files) {
            const { category, name, url } = file;
            if (!category || !name || !url) continue;
            const categoryDir = path.join(UPLOADS_DIR, category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim());
            await fs.mkdir(categoryDir, { recursive: true });
            const imageResponse = await fetch(url);
            if (!imageResponse.ok) continue;
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            await fs.writeFile(path.join(categoryDir, name.replace(/[^a-zA-Z0-9-._]/g, '_')), imageBuffer);
            importedCount++;
        }
        res.status(200).json({ message: `${importedCount} images imported.` });
    } catch (err) {
        next(err);
    }
});

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.use((err, req, res, next) => {
    console.error('An error occurred:', err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

server.listen(port, () => {
    console.log(`Task Donegeon backend listening at http://localhost:${port}`);
});

module.exports = app;
