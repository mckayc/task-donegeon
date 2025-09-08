const notificationService = require('../services/notification.service');

const getAllNotifications = async (req, res) => {
    const notifications = await notificationService.getAll();
    res.json(notifications);
};

const createNotification = async (req, res) => {
    const savedNotification = await notificationService.create(req.body);
    res.status(201).json(savedNotification);
};

const markNotificationsAsRead = async (req, res) => {
    const { ids, userId } = req.body;
    await notificationService.markAsRead(ids, userId);
    res.status(204).send();
};

module.exports = {
    getAllNotifications,
    createNotification,
    markNotificationsAsRead,
};
