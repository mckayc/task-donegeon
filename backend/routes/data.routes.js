const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    handleSse,
    syncData,
    firstRun,
    applyUpdates,
    clearHistory,
    resetPlayers,
    deleteContent,
    factoryReset,
    resetSettings,
    importAssets,
} = require('../controllers/data.controller');

const router = express.Router();

router.get('/events', handleSse);
router.get('/sync', asyncMiddleware(syncData));
router.post('/first-run', asyncMiddleware(firstRun));
router.post('/apply-updates', asyncMiddleware(applyUpdates));
router.post('/clear-history', asyncMiddleware(clearHistory));
router.post('/reset-players', asyncMiddleware(resetPlayers));
router.post('/delete-content', asyncMiddleware(deleteContent));
router.post('/factory-reset', asyncMiddleware(factoryReset));
router.post('/reset-settings', asyncMiddleware(resetSettings));
router.post('/import-assets', asyncMiddleware(importAssets));

module.exports = router;
