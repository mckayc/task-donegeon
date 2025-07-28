
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');

const { initializeDb } = require('./db');
const { initWebSocket } = require('./websocket');

const app = express();
const server = http.createServer(app);

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize WebSocket Server
initWebSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Static files
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// API Routes
app.use('/api', require('./routes'));

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    try {
        await initializeDb();
        console.log(`Server listening on http://localhost:${PORT}`);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
});
