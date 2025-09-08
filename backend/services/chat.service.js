const chatRepository = require('../repositories/chat.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => chatRepository.findAll();

const send = async (messageData) => {
    const newMessage = {
        ...messageData,
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        readBy: [messageData.senderId],
    };
    const saved = await chatRepository.create(newMessage);
    updateEmitter.emit('update');
    return saved;
};

const markAsRead = async (userId, partnerId, guildId) => {
    const updatedMessages = await chatRepository.markAsRead(userId, partnerId, guildId);
    if (updatedMessages.length > 0) {
        updateEmitter.emit('update');
    }
    return updatedMessages;
};


module.exports = {
    getAll,
    send,
    markAsRead,
};
