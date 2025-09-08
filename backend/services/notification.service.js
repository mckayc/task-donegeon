const notificationRepository = require('../repositories/notification.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => notificationRepository.findAll();

const create = async (data) => {
    const newNotification = {
        ...data,
        readByUserIds: [],
        timestamp: new Date().toISOString(),
    };
    const saved = await notificationRepository.create(newNotification);
    updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await notificationRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const markAsRead = async (ids, userId) => {
    await notificationRepository.markAsRead(ids, userId);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    deleteMany,
    markAsRead,
};
