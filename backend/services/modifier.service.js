const appliedModifierRepository = require('../repositories/appliedModifier.repository');
const setbackRepository = require('../repositories/setback.repository');
const questRepository = require('../repositories/quest.repository');
const userRepository = require('../repositories/user.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { ChronicleEventEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');


const getAll = () => appliedModifierRepository.findAll();
const create = (data) => appliedModifierRepository.create(data);
const update = (id, data) => appliedModifierRepository.update(id, data);
const deleteMany = (ids) => appliedModifierRepository.deleteMany(ids);

const apply = async (userId, modifierDefinitionId, reason, appliedById, overrides) => {
    return await dataSource.transaction(async (manager) => {
        const user = await manager.getRepository('User').findOneBy({ id: userId });
        const definition = await manager.getRepository('ModifierDefinition').findOneBy({ id: modifierDefinitionId });
        if (!user || !definition) return null;

        const newAppliedModifierData = {
            userId, modifierDefinitionId, reason, appliedById,
            appliedAt: new Date().toISOString(),
            status: 'Active',
            overrides: Object.keys(overrides || {}).length > 0 ? overrides : undefined,
        };
        
        let newRedemptionQuest = null;
        const redemptionQuestId = overrides?.defaultRedemptionQuestId || definition.defaultRedemptionQuestId;
        if (definition.category === 'Trial' && redemptionQuestId) {
            const redemptionQuestTemplate = await manager.getRepository('Quest').findOneBy({ id: redemptionQuestId });
            if (redemptionQuestTemplate) {
                const newQuestData = {
                    ...redemptionQuestTemplate,
                    id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    title: `${redemptionQuestTemplate.title} (Redemption for ${definition.name})`,
                    assignedUserIds: [userId],
                    isActive: true,
                };
                // This create function needs to be transactional
                newRedemptionQuest = await questRepository.create(newQuestData);
                newAppliedModifierData.redemptionQuestId = newRedemptionQuest.id;
            }
        }
        
        const savedModifier = await manager.getRepository('AppliedModifier').save(updateTimestamps({
            id: `am-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...newAppliedModifierData,
        }, true));
        
        const finalDefinition = { ...definition, ...(overrides || {}) };

        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const eventData = {
            id: `chron-modifier-${savedModifier.id}`,
            originalId: savedModifier.id,
            date: savedModifier.appliedAt,
            type: finalDefinition.category,
            title: `Applied "${finalDefinition.name}"`,
            note: reason,
            status: finalDefinition.category,
            icon: finalDefinition.icon,
            color: finalDefinition.category === 'Triumph' ? '#22c55e' : '#ef4444',
            userId: userId,
            userName: user.gameName,
            actorId: appliedById,
            actorName: (await manager.getRepository('User').findOneBy({ id: appliedById }))?.gameName || 'Admin',
        };
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));

        // TODO: Apply immediate effects like reward deduction
        
        const updatedUser = await manager.getRepository('User').findOneBy({ id: userId });
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