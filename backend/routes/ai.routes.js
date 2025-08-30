const express = require('express');
const { testApiKey, generateContent, startChatSession, sendMessageInSession } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/test', testApiKey);
router.post('/generate', generateContent);
router.post('/chat/start', startChatSession);
router.post('/chat/message', sendMessageInSession);

module.exports = router;