const { dataSource } = require('../data-source');
const { UserEntity, ModifierDefinitionEntity, QuestEntity, AppliedModifierEntity, RewardTypeDefinitionEntity, ChronicleEventEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const appliedModifierRepository = dataSource.getRepository(AppliedModifierEntity);

const getAll = () => appliedModifierRepository.find();
const create = (data) => {
    const newMod = appliedModifierRepository.create(data);
    return appliedModifierRepository.save(updateTimestamps(newMod, true));
}
const update = async (id, data) => {
    const mod = await appliedModifierRepository.findOneBy({ id });
    if (!mod) return null;
    appliedModifierRepository.merge(mod, data);
    return appliedModifierRepository.save(updateTimestamps(mod));
};
const deleteMany = (ids) => appliedModifierRepository.delete(ids);

const apply = async (userId, modifierDefinitionId, reason, appliedById, overrides) => {
    return await dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(UserEntity);
        const definitionRepo = manager.getRepository(ModifierDefinitionEntity);
        const questRepo = manager.getRepository(QuestEntity);

        const user = await userRepo.findOneBy({ id: userId });
        const definition = await definitionRepo.findOneBy({ id: modifierDefinitionId });
        const appliedBy = await userRepo.findOneBy({ id: appliedById });

        if (!user || !definition || !appliedBy) return null;

        const finalDefinition = { ...definition, ...(overrides || {}) };
        const now = new Date();
        
        const durationEffects = finalDefinition.effects.filter(e => 'durationHours' in e && e.durationHours > 0);
        const instantEffects = finalDefinition.effects.filter(e => !('durationHours' in e) || e.durationHours <= 0);

        let savedModifier = null;
        let newRedemptionQuest = null;

        // 1. Handle duration-based effects by creating an AppliedModifier
        if (durationEffects.length > 0) {
            const maxDuration = Math.max(...durationEffects.map(e => e.durationHours || 0));
            const expiresAt = new Date(now.getTime() + maxDuration * 60 * 60 * 1000).toISOString();
            
            const newAppliedModifierData = {
                id: `am-${now.getTime()}-${Math.random().toString(36).substring(2, 9)}`,
                userId, modifierDefinitionId, reason, appliedById,
                appliedAt: now.toISOString(),
                status: 'Active',
                overrides: Object.keys(overrides || {}).length > 0 ? overrides : undefined,
                expiresAt,
            };

            const redemptionQuestId = overrides?.defaultRedemptionQuestId || definition.defaultRedemptionQuestId;
            if (definition.category === 'Trial' && redemptionQuestId) {
                const redemptionQuestTemplate = await questRepo.findOneBy({ id: redemptionQuestId });
                if (redemptionQuestTemplate) {
                    const { id: templateId, createdAt, updatedAt, assignedUsers, ...templateData } = redemptionQuestTemplate;
                    const newQuest = questRepo.create({
                        ...templateData,
                        id: `quest-${now.getTime()}-${Math.random().toString(36).substring(2, 9)}`,
                        title: `${redemptionQuestTemplate.title} (Redemption for ${definition.name})`,
                        assignedUsers: [user],
                        isActive: true,
                    });
                    newRedemptionQuest = await manager.save(updateTimestamps(newQuest, true));
                    newAppliedModifierData.redemptionQuestId = newRedemptionQuest.id;
                }
            }
            savedModifier = await manager.getRepository(AppliedModifierEntity).save(updateTimestamps(newAppliedModifierData, true));
        }

        // 2. Handle instantaneous effects by directly modifying user balances
        if (instantEffects.length > 0) {
            const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
            const balances = { purse: user.personalPurse, experience: user.personalExperience };

            instantEffects.forEach(effect => {
                if (effect.type === 'GRANT_REWARDS' || effect.type === 'DEDUCT_REWARDS') {
                    effect.rewards.forEach(reward => {
                        const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                        if (rewardDef) {
                            const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                            const currentAmount = target[reward.rewardTypeId] || 0;
                            const changeAmount = effect.type === 'GRANT_REWARDS' ? reward.amount : -reward.amount;
                            target[reward.rewardTypeId] = Math.max(0, currentAmount + changeAmount);
                        }
                    });
                }
            });
            
            user.personalPurse = balances.purse;
            user.personalExperience = balances.experience;
            await manager.save(UserEntity, updateTimestamps(user));
        }
        
        // 3. Create a single Chronicle entry for the entire event
        const allRewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
        const getRewardInfo = (id) => allRewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = finalDefinition.effects.flatMap(effect => {
            if (effect.type === 'GRANT_REWARDS' || effect.type === 'DEDUCT_REWARDS') {
                return effect.rewards.map(r => `${effect.type === 'GRANT_REWARDS' ? '+' : '-'}${r.amount}${getRewardInfo(r.rewardTypeId).icon}`);
            }
            return [];
        }).join(' ');

        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const eventData = {
            id: `chron-modifier-${userId}-${now.getTime()}`,
            originalId: savedModifier ? savedModifier.id : `instant-${modifierDefinitionId}-${now.getTime()}`,
            date: now.toISOString(),
            type: finalDefinition.category, // 'Triumph' or 'Trial'
            title: `Applied "${finalDefinition.name}"`,
            note: reason,
            status: finalDefinition.category,
            icon: finalDefinition.icon,
            color: finalDefinition.category === 'Triumph' ? '#22c55e' : '#ef4444',
            userId: userId,
            userName: user.gameName,
            actorId: appliedById,
            actorName: appliedBy.gameName,
            rewardsText: rewardsText || undefined,
        };
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));
        
        const updatedUser = await userRepo.findOneBy({ id: userId });
        updateEmitter.emit('update');
        return { updatedUser, newAppliedModifier: savedModifier, newRedemptionQuest };
    });
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    apply,
};