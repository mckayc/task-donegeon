
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');

// --- Environment Variable Checks ---
const requiredEnv = ['DATABASE_URL', 'STORAGE_PROVIDER'];
if (process.env.STORAGE_PROVIDER === 'supabase') {
    requiredEnv.push('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
}
for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: ${envVar} environment variable is not set.`);
        process.exit(1);
    }
}

const app = express();
const port = process.env.PORT || 3001;

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// === Supabase Client (if applicable) ===
let supabase;
if (process.env.STORAGE_PROVIDER === 'supabase') {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// === Gemini AI Client ===
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set. AI features will be disabled.");
}

// === Multer Configuration for File Uploads ===
const UPLOADS_DIR = path.resolve('/app', 'uploads');
const storage = process.env.STORAGE_PROVIDER === 'supabase'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        // Sanitize category to prevent path traversal and invalid folder names
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
        // Sanitize filename
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

// === Database Connection Pool ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

// === Database Initialization ===
const initializeDatabase = async () => {
    let retries = 5;
    while (retries) {
        try {
            const client = await pool.connect();
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS app_data (
                        key TEXT PRIMARY KEY,
                        value JSONB NOT NULL
                    );
                `);
                console.log("Table 'app_data' is ready.");
                // Ensure backup directory exists
                await fs.mkdir(BACKUP_DIR, { recursive: true });
                console.log(`Backup directory is ready at: ${BACKUP_DIR}`);
                return; // Success
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Database initialization failed, retrying...', err.message);
            retries -= 1;
            if (retries === 0) {
                console.error('Could not connect to database after several retries. Exiting.');
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};


// === API ROUTES ===

// Health check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Get app metadata
app.get('/api/metadata', async (req, res, next) => {
    try {
        const metadataPath = path.join(__dirname, '..', 'metadata.json');
        const data = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(data);
        res.status(200).json(metadata);
    } catch (err) {
        console.error('Error reading metadata.json:', err);
        next(err);
    }
});

// Load data
app.get('/api/data/load', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT key, value FROM app_data');
        res.status(200).json(result.rows[0]?.value || {});
    } catch (err) { next(err); }
});

// Save data
app.post('/api/data/save', async (req, res, next) => {
    try {
        const dataToSave = JSON.stringify(req.body);
        await pool.query(
            `INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2;`,
            ['app_state', dataToSave]
        );
        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (err) { next(err); }
});

// --- Backup Endpoints ---

// List backups
app.get('/api/backups', async (req, res, next) => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupDetails = await Promise.all(
            files
                .filter(file => file.endsWith('.json'))
                .map(async file => {
                    const stats = await fs.stat(path.join(BACKUP_DIR, file));
                    return {
                        filename: file,
                        createdAt: stats.birthtime,
                        size: stats.size,
                        isAuto: file.startsWith('auto_backup_'),
                    };
                })
        );
        res.json(backupDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.json([]);
        }
        next(err);
    }
});

// Create a manual backup
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


// Download a backup
app.get('/api/backups/:filename', (req, res, next) => {
    const filename = path.basename(req.params.filename); // Sanitize to prevent path traversal
    const filePath = path.join(BACKUP_DIR, filename);

    res.download(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                return res.status(404).json({ error: "File not found." });
            }
            return next(err);
        }
    });
});

// Delete a backup
app.delete('/api/backups/:filename', async (req, res, next) => {
    try {
        const filename = path.basename(req.params.filename); // Sanitize
        await fs.unlink(path.join(BACKUP_DIR, filename));
        res.status(200).json({ message: 'Backup deleted successfully.' });
    } catch (err) {
        if (err.code === "ENOENT") {
            return res.status(404).json({ error: "File not found." });
        }
        next(err);
    }
});


// Media Upload
app.post('/api/media/upload', upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    try {
        let fileUrl;
        if (process.env.STORAGE_PROVIDER === 'supabase') {
            const category = req.body.category || 'Miscellaneous';
            const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
            const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
            const filePath = sanitizedCategory ? `${sanitizedCategory}/${Date.now()}-${sanitizedFilename}` : `${Date.now()}-${sanitizedFilename}`;

            const { data, error } = await supabase.storage
                .from('media-assets')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('media-assets').getPublicUrl(data.path);
            fileUrl = publicUrl;
        } else {
            // Construct URL based on the final path, including the category subfolder
            const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
            fileUrl = `/uploads/${relativePath}`;
        }
        res.status(201).json({ url: fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size });
    } catch (err) {
        next(err);
    }
});

// Local Image Gallery
app.get('/api/media/local-gallery', async (req, res, next) => {
    if (process.env.STORAGE_PROVIDER !== 'local') {
        return res.status(200).json([]); // Only for local storage
    }
    
    const walk = async (dir, parentCategory = null) => {
        let dirents;
        try {
            dirents = await fs.readdir(dir, { withFileTypes: true });
        } catch (e) {
            if (e.code === 'ENOENT') { // Directory doesn't exist yet
                await fs.mkdir(dir, { recursive: true });
                return [];
            }
            throw e; // Other errors
        }

        let imageFiles = [];
        for (const dirent of dirents) {
            const fullPath = path.join(dir, dirent.name);
            if (dirent.isDirectory()) {
                const nestedFiles = await walk(fullPath, dirent.name);
                imageFiles = imageFiles.concat(nestedFiles);
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
        const allImageFiles = await walk(UPLOADS_DIR);
        res.status(200).json(allImageFiles);
    } catch (err) {
        next(err);
    }
});


// --- AI Endpoints ---
app.get('/api/ai/status', (req, res) => {
  res.json({ isConfigured: !!ai });
});

app.post('/api/ai/test', async (req, res, next) => {
    if (!ai) {
        return res.status(400).json({ success: false, error: "AI features are not configured on the server." });
    }
    try {
        // Perform a simple, low-cost API call to validate the key
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        // Check if response is valid, though just not erroring is usually enough
        if (response && response.text) {
             res.json({ success: true });
        } else {
            throw new Error("Received an empty or invalid response from the API.");
        }
    } catch (error) {
        console.error("AI API Key Test Failed:", error.message);
        // Check for specific authentication-related errors if possible, otherwise send a generic message.
        // Google's API often returns a 400 or 403 with specific error messages in the body for bad keys.
        res.status(400).json({ success: false, error: 'API key is invalid or permissions are insufficient.' });
    }
});

app.post('/api/ai/generate', async (req, res, next) => {
    if (!ai) return res.status(503).json({ error: "AI features are not configured on the server." });
    
    const { model, prompt, generationConfig } = req.body;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: generationConfig,
        });
        res.json({ text: response.text });
    } catch (err) {
        next(err);
    }
});


// === Static File Serving ===
// Serve React app build files
app.use(express.static(path.join(__dirname, '../dist')));
// Serve local uploads if using local storage
if (process.env.STORAGE_PROVIDER === 'local') {
    app.use('/uploads', express.static(UPLOADS_DIR));
}


// === Final Catchall & Error Handling ===
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.use((err, req, res, next) => {
  console.error('An error occurred:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});


// === Automated Backup Logic ===
const runAutomatedBackup = async () => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT value FROM app_data WHERE key = $1', ['app_state']);
        const appState = result.rows[0]?.value;
        const settings = appState?.settings;

        if (!settings || !settings.automatedBackups || !settings.automatedBackups.enabled) {
            return; // Feature disabled
        }

        const files = await fs.readdir(BACKUP_DIR).catch(() => []);
        const autoBackups = files.filter(f => f.startsWith('auto_backup_')).sort().reverse();

        if (autoBackups.length > 0) {
            const latestBackupFilename = autoBackups[0];
            const timestampStr = latestBackupFilename.replace('auto_backup_', '').replace('.json', '');
            const lastBackupDate = new Date(timestampStr);
            const hoursSinceLast = (new Date() - lastBackupDate) / (1000 * 60 * 60);

            if (hoursSinceLast < settings.automatedBackups.frequencyHours) {
                return; // Not time yet
            }
        }
        
        // Time to create a new backup
        console.log(`[Automated Backup] Creating new backup at ${new Date().toLocaleString()}`);
        const dataToBackup = JSON.stringify(appState, null, 2);
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const newFilename = `auto_backup_${timestamp}.json`;
        await fs.writeFile(path.join(BACKUP_DIR, newFilename), dataToBackup);

        // Prune old backups
        const updatedAutoBackups = [newFilename, ...autoBackups];
        if (updatedAutoBackups.length > settings.automatedBackups.maxBackups) {
            const backupsToDelete = updatedAutoBackups.slice(settings.automatedBackups.maxBackups);
            console.log(`[Automated Backup] Pruning ${backupsToDelete.length} old backup(s).`);
            for (const filename of backupsToDelete) {
                await fs.unlink(path.join(BACKUP_DIR, filename)).catch(err => console.error(`Failed to delete old backup ${filename}`, err));
            }
        }

    } catch (err) {
        console.error('[Automated Backup] An error occurred:', err);
    } finally {
        if (client) client.release();
    }
};


// === Start Server ===
// This part is ignored by Vercel but used for local development
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(port, async () => {
        console.log(`Task Donegeon backend listening at http://localhost:${port}`);
        await initializeDatabase();
        // Start automated backup timer (checks every 30 minutes)
        setInterval(runAutomatedBackup, 30 * 60 * 1000);
    });
}


// Export the app for Vercel
module.exports = app;
