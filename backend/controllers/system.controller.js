

const { dataSource } = require('../data-source');
const { isAiConfigured } = require('./ai.controller');
const systemService = require('../services/system.service');

const getSystemStatus = (req, res) => {
    const geminiConnected = isAiConfigured();
    const isCustomDbPath = process.env.DATABASE_PATH && process.env.DATABASE_PATH !== '/app/data/database/database.sqlite';
    const isJwtSecretSet = process.env.JWT_SECRET && process.env.JWT_SECRET !== 'insecure_default_secret_for_testing_only';

    res.json({
        geminiConnected,
        database: {
            connected: dataSource.isInitialized,
            isCustomPath: isCustomDbPath
        },
        jwtSecretSet: isJwtSecretSet
    });
};

const startServerLogging = (req, res) => {
    const { userId, duration } = req.body;
    const { loggedUsers } = req; // Get the map from the request object

    if (!userId || !duration) {
        return res.status(400).json({ error: 'User ID and duration are required.' });
    }
    const durationMs = parseInt(duration, 10) * 1000;
    if (isNaN(durationMs) || durationMs <= 0) {
        return res.status(400).json({ error: 'Invalid duration.' });
    }

    const expiry = Date.now() + durationMs;
    loggedUsers.set(userId, expiry);
    console.log(`[Activity Log] Started logging for user ${userId} for ${duration} seconds. Expires at ${new Date(expiry).toLocaleString()}`);
    
    // Simple cleanup of old entries
    const now = Date.now();
    for (const [key, value] of loggedUsers.entries()) {
        if (value < now) {
            loggedUsers.delete(key);
        }
    }

    res.status(200).json({ message: `Server-side logging enabled for ${duration} seconds.` });
};

const injectChronicleEvent = async (req, res) => {
    await systemService.injectChronicleEvent(req, res);
};

module.exports = {
    getSystemStatus,
    startServerLogging,
    injectChronicleEvent,
};