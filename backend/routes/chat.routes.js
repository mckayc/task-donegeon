const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllMessages,
    sendMessage,
    markMessagesAsRead,
} = require('../controllers/chat.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllMessages));
router.post('/send', asyncMiddleware(sendMessage));
router.post('/read', asyncMiddleware(markMessagesAsRead));

module.exports = router;
