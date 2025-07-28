
const express = require('express');
const handleRequest = require('../utils/requestHandler');
const router = express.Router();

router.post('/users', handleRequest((data, req) => {
    const newUser = { ...req.body, id: `user-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
    data.users.push(newUser);
    return { status: 201, body: newUser };
}));

router.put('/users/:id', handleRequest((data, req) => {
    const index = data.users.findIndex(u => u.id === req.params.id);
    if (index === -1) throw new Error('User not found.');
    data.users[index] = { ...data.users[index], ...req.body };
}));

router.delete('/users/:id', handleRequest((data, req) => {
    data.users = data.users.filter(u => u.id !== req.params.id);
}));

module.exports = router;
