
const express = require('express');
const handleRequest = require('../utils/requestHandler');
const { broadcast } = require('../websocket');
const router = express.Router();

router.post('/chat/messages', handleRequest((data, req) => {
    const newMessage = { ...req.body, id: `msg-${Date.now()}`, timestamp: new Date().toISOString(), readBy: [req.body.senderId] };
    data.chatMessages.push(newMessage);
    broadcast({ type: 'NEW_CHAT_MESSAGE', payload: newMessage });
    return { status: 201, body: newMessage };
}));

router.post('/chat/read', handleRequest((data, req) => {
    const { userId, partnerId, guildId } = req.body;
    data.chatMessages.forEach(msg => {
        const isDmMatch = partnerId && (msg.senderId === partnerId && msg.recipientId === userId);
        const isGuildMatch = guildId && msg.guildId === guildId;
        if ((isDmMatch || isGuildMatch) && !msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
        }
    });
}));

router.post('/systemNotifications', handleRequest((data, req) => {
    const newNotif = { ...req.body, id: `sysnotif-${Date.now()}`, timestamp: new Date().toISOString(), readByUserIds: [] };
    data.systemNotifications.push(newNotif);
    return { status: 201, body: newNotif };
}));

router.post('/systemNotifications/read', handleRequest((data, req) => {
    const { notificationIds, userId } = req.body;
    data.systemNotifications.forEach(n => {
        if (notificationIds.includes(n.id) && !n.readByUserIds.includes(userId)) {
            n.readByUserIds.push(userId);
        }
    });
}));

module.exports = router;
