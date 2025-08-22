

const express = require('express');
const { getSystemStatus, startServerLogging, injectChronicleEvent } = require('../controllers/system.controller');
const { asyncMiddleware } = require('../utils/helpers');

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/log-activity', asyncMiddleware(startServerLogging));
router.post('/inject-chronicle', asyncMiddleware(injectChronicleEvent));

module.exports = router;