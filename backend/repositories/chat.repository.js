const { dataSource } = require('../data-source');
const { ChatMessageEntity } = require('../entities');
const { In } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(ChatMessageEntity);

const findAll = () => repo.find();
const findById = (id) => repo.findOneBy({ id });

const create = (data) => {
    const newItem = repo.create(data);
    return repo.save(updateTimestamps(newItem, true));
};

const markAsRead = async (userId, partnerId, guildId) => {
    let whereClause = {};
    if (partnerId) {
        whereClause = [
            { senderId: partnerId, recipientId: userId },
        ];
    } else if (guildId) {
        whereClause = { guildId };
    } else {
        return [];
    }

    const messagesToUpdate = await repo.find({ where: whereClause });
    const updatedMessages = [];
    
    for (const msg of messagesToUpdate) {
        if (!msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
            updateTimestamps(msg);
            updatedMessages.push(msg);
        }
    }
    
    if (updatedMessages.length > 0) {
        await repo.save(updatedMessages);
    }
    
    return updatedMessages;
};

module.exports = {
    findAll,
    findById,
    create,
    markAsRead,
};