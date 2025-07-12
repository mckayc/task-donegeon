import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 3001;

// === Middleware ===
app.use(cors());
// Increase limit for potentially large state saves from the client
app.use(express.json({ limit: '10mb' }));

// === Supabase Client ===
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// === API ROUTES ===

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('app_data').select('*').limit(1); // Example query to check connection
    if (error) {
      throw new Error(error.message);
    }
    res.status(200).json({ status: 'ok', message: 'Backend is healthy and Supabase connection is successful.' });
  } catch (err) {
    err.message = `Supabase health check failed: ${err.message}`;
    next(err);
  }
});

// Load all application data
app.get('/api/data/load', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('app_data').select('*');
    if (error) {
      throw new Error(error.message);
    }
    const dataObject = data.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
    res.status(200).json(dataObject);
  } catch (err) {
    err.message = `Failed to load data from Supabase: ${err.message}`;
    next(err);
  }
});

// Save all application data from a single state object
app.post('/api/data/save', async (req, res, next) => {
    const dataToSave = req.body;
    if (typeof dataToSave !== 'object' || dataToSave === null) {
        return res.status(400).json({ error: 'Invalid data format. Expected a JSON object.' });
    }

    try {
        for (const key in dataToSave) {
            if (Object.prototype.hasOwnProperty.call(dataToSave, key)) {
                const value = JSON.stringify(dataToSave[key]);
                const { error } = await supabase.from('app_data').upsert({ key, value });
                if (error) {
                    throw new Error(error.message);
                }
            }
        }

        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (err) {
        err.message = `Failed to save data to Supabase: ${err.message}`;
        next(err);
    }
});

// === Error Handling Middleware ===
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
});
