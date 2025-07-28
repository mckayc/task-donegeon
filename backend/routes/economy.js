
const express = require('express');
const handleRequest = require('../utils/requestHandler');
const router = express.Router();

router.post('/economy/exchange', handleRequest((data, req) => {
    const { userId, payItem, receiveItem, guildId } = req.body;
    const user = data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    
    const payRewardType = data.rewardTypes.find(rt => rt.id === payItem.rewardTypeId);
    const receiveRewardType = data.rewardTypes.find(rt => rt.id === receiveItem.rewardTypeId);
    if (!payRewardType || !receiveRewardType) throw new Error('Reward type not found.');

    let payBalance, receiveBalance;

    if (guildId) {
        user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} };
        payBalance = payRewardType.category === 'Currency' ? user.guildBalances[guildId].purse : user.guildBalances[guildId].experience;
        receiveBalance = receiveRewardType.category === 'Currency' ? user.guildBalances[guildId].purse : user.guildBalances[guildId].experience;
    } else {
        payBalance = payRewardType.category === 'Currency' ? user.personalPurse : user.personalExperience;
        receiveBalance = receiveRewardType.category === 'Currency' ? user.personalPurse : user.personalExperience;
    }

    if ((payBalance[payItem.rewardTypeId] || 0) < payItem.amount) {
        throw new Error('Insufficient funds.');
    }
    
    payBalance[payItem.rewardTypeId] -= payItem.amount;
    receiveBalance[receiveItem.rewardTypeId] = (receiveBalance[receiveItem.rewardTypeId] || 0) + receiveItem.amount;
}));

module.exports = router;
