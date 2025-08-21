const express = require('express');
const { testApiKey, generateContent } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/test', testApiKey);
router.post('/generate', generateContent);

module.exports = router;
