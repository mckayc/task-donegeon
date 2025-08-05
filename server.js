
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'reflect-metadata';
import { AppDataSource } from './src/data/data-source.js';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection on server start
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });

// API endpoint to get connection statuses
app.get('/api/status', async (req, res) => {
    const statuses = {
        db: AppDataSource.isInitialized ? 'CONNECTED' : 'ERROR',
        gemini: process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall' ? 'CONNECTED' : 'NOT_CONFIGURED',
        jwt: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'insecure_default_secret_for_testing_only' ? 'CONFIGURED' : 'NOT_CONFIGURED'
    };
    res.json(statuses);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});