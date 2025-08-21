const { dataSource } = require('../data-source');
const { isAiConfigured } = require('./ai.controller');

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

module.exports = {
    getSystemStatus
};
