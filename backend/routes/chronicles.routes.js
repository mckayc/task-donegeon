const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const { getChronicles, getTutorSessionByCompletionId } = require('../controllers/chronicles.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getChronicles));
router.get('/tutor-session/:completionId', asyncMiddleware(getTutorSessionByCompletionId));

module.exports = router;
