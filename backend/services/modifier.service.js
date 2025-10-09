const { dataSource } = require('../data-source');
const { UserEntity, ModifierDefinitionEntity, QuestEntity, AppliedModifierEntity, RewardTypeDefinitionEntity, ChronicleEventEntity, SystemNotificationEntity } = require('../entities');
const { In } = require("typeorm");
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

const apply = async (userIds, modifierDefinitionId, reason, appliedById, overrides) => {
    return await dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(UserEntity);
        const definitionRepo = manager.getRepository(ModifierDefinitionEntity);
        const questRepo = manager.getRepository(QuestEntity);

        const users = await userRepo.findBy({ id: In(userIds) });
        const definition = await definitionRepo.findOneBy({ id: modifierDefinitionId });
        const appliedBy = await userRepo.findOneBy({ id: appliedById });

        if (users.length === 0 || !definition || !appliedBy) {
            console.error('[Modifier Service] Apply failed: Users not found, or definition/applier not found.', { userIds, modifierDefinitionId, appliedById });
            return null;
        }

        const results = {
            updatedUsers: [],
            newAppliedModifiers: [],
            newRedemptionQuests: [],
            newNotifications: [],
            newChronicleEvents: [],
        };
        
        const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();

        for (const user of users) {
            const finalDefinition = { ...definition, ...(overrides || {}) };
            const now = new Date();
            
            const durationEffects = finalDefinition.effects.filter(e => 'durationHours' in e && e.durationHours > 0);
            const instantEffects = finalDefinition.effects.filter(e => !('durationHours' in e) || e.durationHours <= 0);

            let savedModifier = null;
            let newRedemptionQuest = null;

            // 1. Handle duration-based effects
            if (durationEffects.length > 0) {
                const maxDuration = Math.max(...durationEffects.map(e => e.durationHours || 0));
                const expiresAt = new Date(now.getTime() + maxDuration * 60 * 60 * 1000).toISOString();
                
                const newAppliedModifierData = {
                    id: `am-${now.getTime()}-${user.id.slice(0, 4)}`,
                    userId: user.id,
                    modifierDefinitionId, reason, appliedById,
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
                            id: `quest-${now.getTime()}-${user.id.slice(0,4)}`,
                            title: `${redemptionQuestTemplate.title} (Redemption for ${definition.name})`,
                            assignedUsers: [user],
                            isActive: true,
                        });
                        newRedemptionQuest = await manager.save(updateTimestamps(newQuest, true));
                        newAppliedModifierData.redemptionQuestId = newRedemptionQuest.id;
                        results.newRedemptionQuests.push(newRedemptionQuest);
                    }
                }
                savedModifier = await manager.getRepository(AppliedModifierEntity).save(updateTimestamps(newAppliedModifierData, true));
                results.newAppliedModifiers.push(savedModifier);
            }

            // 2. Handle instantaneous effects
            if (instantEffects.length > 0) {
                const balances = { purse: { ...user.personalPurse }, experience: { ...user.personalExperience } };

                instantEffects.forEach(effect => {
                    if (effect.type === 'GRANT_REWARDS' || effect.type === 'DEDUCT_REWARDS') {
                        effect.rewards.forEach(reward => {
                            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                            if (rewardDef) {
                                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                                const currentAmount = target[reward.rewardTypeId] || 0;
                                const changeAmount = effect.type === 'GRANT_REWARDS' ? reward.amount : -reward.amount;
                                
                                if (effect.type === 'DEDUCT_REWARDS' && (overrides as any)?.allowSubstitution && (currentAmount + changeAmount < 0)) {
                                    let deficitInPrimaryUnit = Math.abs(currentAmount + changeAmount);
                                    target[reward.rewardTypeId] = 0;

                                    const valueToCover = deficitInPrimaryUnit * (rewardDef.baseValue || 0);
                                    if (valueToCover > 0) {
                                        const substitutableRewards = rewardTypes.filter(rt => rt.id !== reward.rewardTypeId && rt.baseValue > 0 && rt.isExchangeable !== false);
                                        substitutableRewards.sort((a,b) => a.baseValue - b.baseValue);

                                        let remainingValueToCover = valueToCover;
                                        for (const subReward of substitutableRewards) {
                                            if (remainingValueToCover <= 0) break;
                                            const subTarget = subReward.category === 'Currency' ? balances.purse : balances.experience;
                                            const subBalance = subTarget[subReward.id] || 0;
                                            if (subBalance > 0) {
                                                const amountOfSubNeeded = Math.ceil(remainingValueToCover / subReward.baseValue);
                                                const amountToDeduct = Math.min(subBalance, amountOfSubNeeded);
                                                subTarget[subReward.id] = subBalance - amountToDeduct;
                                                remainingValueToCover -= amountToDeduct * subReward.baseValue;
                                            }
                                        }
                                    }
                                } else {
                                    target[reward.rewardTypeId] = Math.max(0, currentAmount + changeAmount);
                                }
                            }
                        });
                    }
                });
                
                user.personalPurse = balances.purse;
                user.personalExperience = balances.experience;
                await manager.save(UserEntity, updateTimestamps(user));
            }
            
            // 3. Create Chronicle entry
            const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
            const rewardsText = finalDefinition.effects.flatMap(effect => {
                if (effect.type === 'GRANT_REWARDS' || effect.type === 'DEDUCT_REWARDS') {
                    return effect.rewards.map(r => `${effect.type === 'GRANT_REWARDS' ? '+' : '-'}${r.amount}${getRewardInfo(r.rewardTypeId).icon}`);
                }
                return [];
            }).join(' ');

            const chronicleRepo = manager.getRepository(ChronicleEventEntity);
            const eventData = {
                id: `chron-modifier-${user.id}-${now.getTime()}`,
                originalId: savedModifier ? savedModifier.id : `instant-${modifierDefinitionId}-${now.getTime()}`,
                date: now.toISOString(),
                type: finalDefinition.category,
                title: `Applied "${finalDefinition.name}"`,
                note: reason,
                status: finalDefinition.category,
                icon: finalDefinition.icon,
                color: finalDefinition.category === 'Triumph' ? '#22c55e' : '#ef4444',
                userId: user.id,
                userName: user.gameName,
                actorId: appliedById,
                actorName: appliedBy.gameName,
                rewardsText: rewardsText || undefined,
            };
            const newEvent = chronicleRepo.create(eventData);
            results.newChronicleEvents.push(await manager.save(updateTimestamps(newEvent, true)));
            
            // 4. Create Notification
            const notificationRepo = manager.getRepository(SystemNotificationEntity);
            const notifType = finalDefinition.category === 'Triumph' ? 'TriumphApplied' : 'TrialApplied';
            const newNotification = notificationRepo.create({
                id: `sysnotif-mod-${user.id}-${now.getTime()}`,
                type: notifType,
                message: `${appliedBy.gameName} applied a ${finalDefinition.category.toLowerCase()}: "${finalDefinition.name}"`,
                recipientUserIds: [user.id],
                readByUserIds: [],
                senderId: appliedById,
                timestamp: now.toISOString(),
                link: 'Triumphs & Trials',
                icon: finalDefinition.icon,
                guildId: undefined,
            });
            results.newNotifications.push(await manager.save(updateTimestamps(newNotification, true)));

            const updatedUser = await userRepo.findOneBy({ id: user.id });
            results.updatedUsers.push(updatedUser);
        }

        updateEmitter.emit('update');
        return results;
    });
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    apply,
};