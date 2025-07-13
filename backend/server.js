
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Define the Type enum values, as they are not directly available in JS
const Type = {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
};


// --- Environment Variable Checks ---
const requiredEnv = ['DATABASE_URL', 'API_KEY', 'STORAGE_PROVIDER'];
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

// AI Asset Generation
app.post('/api/generate-assets', async (req, res, next) => {
    const { category, assetType } = req.body;
    if (!category || !assetType) {
        return res.status(400).json({ error: 'Category and assetType are required.' });
    }

    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const isQuest = assetType === 'Quest';

    const questSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, reward_type: { type: Type.STRING }, reward_amount: { type: Type.INTEGER }, requires_approval: { type: Type.BOOLEAN } } };
    const marketItemSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, cost_type: { type: Type.STRING }, cost_amount: { type: Type.INTEGER } } };

    const prompt = `Generate a list of 5 creative and engaging ${isQuest ? 'quests' : 'market items'} for a gamified to-do list app. The theme is "${category}". For each item, provide a title, a brief description, and the requested values.`;
    const schema = { type: Type.ARRAY, items: isQuest ? questSchema : marketItemSchema };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: schema },
        });
        const parsedAssets = JSON.parse(response.text);
        res.status(200).json(parsedAssets);
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
app.listen(port, async () => {
  console.log(`Task Donegeon backend listening at http://localhost:${port}`);
  await initializeDatabase();
});
