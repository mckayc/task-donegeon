
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
const storage = process.env.STORAGE_PROVIDER === 'supabase'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    });
const upload = multer({ storage });


// === Static File Serving ===
// Serve React app build files
app.use(express.static(path.join(__dirname, '../dist')));
// Serve local uploads if using local storage
if (process.env.STORAGE_PROVIDER === 'local') {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}


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
app.get('/api/metadata', (req, res, next) => {
    try {
        const metadataPath = path.join(__dirname, '..', 'metadata.json');
        fs.readFile(metadataPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading metadata.json:', err);
                return res.status(500).json({ error: 'Could not read metadata file.' });
            }
            const metadata = JSON.parse(data);
            // Overwrite the date with the current server time for accuracy
            metadata.lastChangeDate = new Date().toISOString();
            res.status(200).json(metadata);
        });
    } catch (err) {
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

// Media Upload
app.post('/api/media/upload', upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    try {
        let fileUrl;
        if (process.env.STORAGE_PROVIDER === 'supabase') {
            const { data, error } = await supabase.storage
                .from('media-assets')
                .upload(req.file.originalname, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true,
                });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('media-assets').getPublicUrl(data.path);
            fileUrl = publicUrl;
        } else {
            fileUrl = `/uploads/${req.file.filename}`;
        }
        res.status(201).json({ url: fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size });
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
        if (model.startsWith('imagen')) {
             const response = await ai.models.generateImages({
                model,
                prompt: prompt,
                config: generationConfig,
            });
            res.json({ generatedImages: response.generatedImages });
        } else {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: generationConfig,
            });
            res.json({ text: response.text });
        }
    } catch (err) {
        next(err);
    }
});


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


// === Start Server ===
// This part is ignored by Vercel but used for local development
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(port, async () => {
        console.log(`Task Donegeon backend listening at http://localhost:${port}`);
        await initializeDatabase();
    });
}


// Export the app for Vercel
module.exports = app;