const express = require('express');
const { getSystemStatus } = require('../controllers/system.controller');

const router = express.Router();

router.get('/status', getSystemStatus);

module.exports = router;
