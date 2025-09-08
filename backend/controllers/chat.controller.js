const chatService = require('../services/chat.service');

const getAllMessages = async (req, res) => {
    const messages = await chatService.getAll();
    res.json(messages);
};

const sendMessage = async (req, res) => {
    const savedMessage = await chatService.send(req.body);
    res.status(201).json(savedMessage);
};

const markMessagesAsRead = async (req, res) => {
    const { userId, partnerId, guildId } = req.body;
    const updatedMessages = await chatService.markAsRead(userId, partnerId, guildId);
    res.json({ updatedMessages });
};

module.exports = {
    getAllMessages,
    sendMessage,
    markMessagesAsRead,
};
