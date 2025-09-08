const express = require('express');
const { testApiKey, generateContent, startChatSession, sendMessageInSession, generateQuizForSession, generateStory } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/test', testApiKey);
router.post('/generate', generateContent);
router.post('/chat/start', startChatSession);
router.post('/chat/message', sendMessageInSession);
router.post('/chat/generate-quiz', generateQuizForSession);
router.post('/generate-story', generateStory);

module.exports = router;