
const express = require('express');
const handleRequest = require('../utils/requestHandler');
const router = express.Router();

router.post('/quests/:id/actions', handleRequest((data, req) => {
    const quest = data.quests.find(q => q.id === req.params.id);
    if (!quest) throw new Error('Quest not found.');
    quest.todoUserIds = quest.todoUserIds || [];
    if (req.body.action === 'mark_todo') {
        if (!quest.todoUserIds.includes(req.body.userId)) quest.todoUserIds.push(req.body.userId);
    } else if (req.body.action === 'unmark_todo') {
        quest.todoUserIds = quest.todoUserIds.filter(id => id !== req.body.userId);
    }
}));

router.post('/quests/:id/complete', handleRequest((data, req) => {
    const { userId, note, completionDate } = req.body;
    const quest = data.quests.find(q => q.id === req.params.id);
    if (!quest) throw new Error('Quest not found.');
    const newCompletion = {
        id: `qc-${Date.now()}`, questId: req.params.id, userId,
        completedAt: completionDate || new Date().toISOString(),
        status: quest.requiresApproval ? 'Pending' : 'Approved',
        note, guildId: quest.guildId,
    };
    data.questCompletions.push(newCompletion);
    
    if (!quest.requiresApproval) {
        const user = data.users.find(u => u.id === userId);
        quest.rewards.forEach(reward => {
            const rewardType = data.rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (!rewardType) return;
            let balanceTarget;
            if (quest.guildId) {
                user.guildBalances[quest.guildId] = user.guildBalances[quest.guildId] || { purse: {}, experience: {} };
                balanceTarget = rewardType.category === 'Currency' ? user.guildBalances[quest.guildId].purse : user.guildBalances[quest.guildId].experience;
            } else {
                balanceTarget = rewardType.category === 'Currency' ? user.personalPurse : user.personalExperience;
            }
            balanceTarget[reward.rewardTypeId] = (balanceTarget[reward.rewardTypeId] || 0) + reward.amount;
        });
    }
}));

module.exports = router;
