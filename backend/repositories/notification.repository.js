const { dataSource } = require('../data-source');
const { SystemNotificationEntity } = require('../entities');
const { In } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(SystemNotificationEntity);

const findAll = () => repo.find();

const create = (data) => {
    const newItem = repo.create({
        ...data,
        id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    return repo.save(updateTimestamps(newItem, true));
};

const deleteMany = (ids) => repo.delete(ids);

const markAsRead = async (ids, userId) => {
    const notifications = await repo.findBy({ id: In(ids) });
    for (const notification of notifications) {
        if (!notification.readByUserIds.includes(userId)) {
            notification.readByUserIds.push(userId);
            updateTimestamps(notification);
        }
    }
    await repo.save(notifications);
};

module.exports = {
    findAll,
    create,
    deleteMany,
    markAsRead,
};