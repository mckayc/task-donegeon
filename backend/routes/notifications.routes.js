const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllNotifications,
    createNotification,
    markNotificationsAsRead,
} = require('../controllers/notifications.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllNotifications));
router.post('/', asyncMiddleware(createNotification));
router.post('/read', asyncMiddleware(markNotificationsAsRead));

module.exports = router;
