

const express = require('express');
const { testApiKey, generateContent, startTutorSession, sendMessageToTutor, generateFinalQuiz, generateStory, suggestHolidays } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/test', testApiKey);
router.post('/generate', generateContent);
router.post('/tutor/start', startTutorSession);
router.post('/tutor/message', sendMessageToTutor);
router.post('/tutor/generate-final-quiz', generateFinalQuiz);
router.post('/generate-story', generateStory);
router.post('/suggest-holidays', suggestHolidays);

module.exports = router;