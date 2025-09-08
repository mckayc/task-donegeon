const express = require('express');
const { getSystemStatus, startServerLogging } = require('../controllers/system.controller');
const { deleteAssets } = require('../controllers/data.controller');
const { asyncMiddleware } = require('../utils/helpers');

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/log-activity', asyncMiddleware(startServerLogging));
router.post('/delete-assets', asyncMiddleware(deleteAssets));

module.exports = router;
