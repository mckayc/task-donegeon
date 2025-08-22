const express = require('express');
const { getSystemStatus, startServerLogging } = require('../controllers/system.controller');
const { asyncMiddleware } = require('../utils/helpers');

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/log-activity', asyncMiddleware(startServerLogging));

module.exports = router;