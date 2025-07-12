
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// === Middleware ===
app.use(cors()); 
// Increase limit for potentially large state saves from the client
app.use(express.json({ limit: '10mb' }));

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
            // Wait before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};


// === API ROUTES ===

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()'); 
      res.status(200).json({ 
        status: 'ok', 
        message: 'Backend is healthy and database connection is successful.' 
      });
    } finally {
      client.release();
    }
  } catch (err) {
    err.message = `Database health check failed: ${err.message}`;
    next(err); 
  }
});

// Load all application data
app.get('/api/data/load', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT key, value FROM app_data');
        const data = result.rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        res.status(200).json(data);
    } catch (err) {
        err.message = `Failed to load data from database: ${err.message}`;
        next(err);
    }
});

// Save all application data from a single state object
app.post('/api/data/save', async (req, res, next) => {
    const dataToSave = req.body;
    if (typeof dataToSave !== 'object' || dataToSave === null) {
        return res.status(400).json({ error: 'Invalid data format. Expected a JSON object.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transaction

        for (const key in dataToSave) {
            if (Object.prototype.hasOwnProperty.call(dataToSave, key)) {
                const value = JSON.stringify(dataToSave[key]);
                const query = {
                    text: `
                        INSERT INTO app_data (key, value)
                        VALUES ($1, $2)
                        ON CONFLICT (key) DO UPDATE
                        SET value = $2;
                    `,
                    values: [key, value],
                };
                await client.query(query);
            }
        }
        
        await client.query('COMMIT'); // Commit transaction
        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on error
        err.message = `Failed to save data to database: ${err.message}`;
        next(err);
    } finally {
        client.release();
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
  await initializeDatabase();
});
