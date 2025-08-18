
const express = require('express');
const { dataSource } = require('../data-source');
const { In } = require("typeorm");
const { 
    UserEntity, QuestEntity, QuestCompletionEntity, PurchaseRequestEntity, AdminAdjustmentEntity,
    GameAssetEntity, GuildEntity, UserTrophyEntity, SystemNotificationEntity, ThemeDefinitionEntity,
    AppliedSetbackEntity, TradeOfferEntity, GiftEntity
} = require('../entities');

// Helper to update timestamps
const updateTimestamps = (entity, isNew = false) => {
    const now = new Date().toISOString();
    if (isNew) entity.createdAt = now;
    entity.updatedAt = now;
    return entity;
};

module.exports = (updateEmitter, checkAndAwardTrophies) => {
    const router = express.Router();
    
    // All actions will be wrapped in a transaction to ensure data integrity
    const performAction = async (res, action) => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const result = await action(queryRunner.manager);
            await queryRunner.commitTransaction();
            updateEmitter.emit('update');
            res.json(result || {});
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Action failed:', error);
            res.status(500).json({ error: error.message });
        } finally {
            await queryRunner.release();
        }
    };
    
    router.post('/complete-quest', (req, res) => performAction(res, async (manager) => {
        const { completionData } = req.body;
        const newCompletion = manager.create(QuestCompletionEntity, { ...completionData, id: `qc-${Date.now()}` });
        updateTimestamps(newCompletion, true);

        await manager.save(newCompletion);
        
        const user = await manager.findOneBy(UserEntity, { id: completionData.userId });
        const quest = await manager.findOneBy(QuestEntity, { id: completionData.questId });

        // Auto-approve if not required
        if (completionData.status === 'Approved' && user && quest) {
            for (const reward of quest.rewards) {
                const rewardDef = await manager.findOneBy('RewardTypeDefinition', { id: reward.rewardTypeId });
                if (!rewardDef) continue;

                const balanceKey = rewardDef.category === 'Currency' ? 'purse' : 'experience';
                const scope = quest.guildId ? user.guildBalances[quest.guildId] || { purse: {}, experience: {} } : user;
                const scopeBalance = quest.guildId ? scope[balanceKey] : user[balanceKey === 'purse' ? 'personalPurse' : 'personalExperience'];
                
                scopeBalance[reward.rewardTypeId] = (scopeBalance[reward.rewardTypeId] || 0) + reward.amount;
                
                if (quest.guildId) {
                    user.guildBalances[quest.guildId] = scope;
                }
            }
            await manager.save(UserEntity, user);
        }
        
        return { newCompletion, updatedUser: user };
    }));

    router.post('/approve-quest/:id', (req, res) => performAction(res, async (manager) => {
        const { id } = req.params;
        const { note } = req.body;
        const completion = await manager.findOneBy(QuestCompletionEntity, { id });
        if (!completion) throw new Error('Completion not found');

        completion.status = 'Approved';
        if (note) completion.note = note;
        updateTimestamps(completion);

        const user = await manager.findOneBy(UserEntity, { id: completion.userId });
        const quest = await manager.findOneBy(QuestEntity, { id: completion.questId });
        if (!user || !quest) throw new Error('User or Quest not found');

        for (const reward of quest.rewards) {
             const rewardDef = await manager.findOneBy('RewardTypeDefinition', { id: reward.rewardTypeId });
             if (!rewardDef) continue;
             const balanceKey = rewardDef.category === 'Currency' ? 'purse' : 'experience';
             const scope = quest.guildId ? user.guildBalances[quest.guildId] || { purse: {}, experience: {} } : user;
             const scopeBalance = quest.guildId ? scope[balanceKey] : user[balanceKey === 'purse' ? 'personalPurse' : 'personalExperience'];
             scopeBalance[reward.rewardTypeId] = (scopeBalance[reward.rewardTypeId] || 0) + reward.amount;
             if (quest.guildId) user.guildBalances[quest.guildId] = scope;
        }

        await manager.save(QuestCompletionEntity, completion);
        await manager.save(UserEntity, user);
        
        const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, quest.guildId);

        return { updatedCompletion: completion, updatedUser: user, newUserTrophies, newNotifications };
    }));

    router.post('/reject-quest/:id', (req, res) => performAction(res, async (manager) => {
        const completion = await manager.findOneBy(QuestCompletionEntity, { id: req.params.id });
        if (!completion) throw new Error('Completion not found');
        completion.status = 'Rejected';
        if (req.body.note) completion.note = req.body.note;
        updateTimestamps(completion);
        const updatedCompletion = await manager.save(completion);
        return { updatedCompletion };
    }));

    router.post('/purchase-item', (req, res) => performAction(res, async (manager) => {
        // This is a complex action that would involve checking balances, creating purchase requests, etc.
        // For now, we'll just log it. A full implementation is needed for real functionality.
        console.log("Purchase item request received:", req.body);
        return {};
    }));

    router.post('/approve-purchase/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/reject-purchase/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/cancel-purchase/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/execute-exchange', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/donate-to-guild', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/manual-adjustment', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/mark-todo', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/unmark-todo', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/use-item/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/craft-item/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/apply-setback', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/trades/propose', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.put('/trades/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/trades/accept/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/trades/resolve/:id', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));
    router.post('/gifts/send', (req, res) => performAction(res, async (manager) => { /* Stub */ return {}; }));

    return router;
};
