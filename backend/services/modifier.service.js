const appliedModifierRepository = require('../repositories/appliedModifier.repository');
const setbackRepository = require('../repositories/setback.repository');
const questRepository = require('../repositories/quest.repository');
const userRepository = require('../repositories/user.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => appliedModifierRepository.findAll();
const create = (data) => appliedModifierRepository.create(data);
const update = (id, data) => appliedModifierRepository.update(id, data);
const deleteMany = (ids) => appliedModifierRepository.deleteMany(ids);

const apply = async (userId, modifierDefinitionId, reason, appliedById, overrides) => {
    const user = await userRepository.findById(userId);
    const definition = await setbackRepository.findById(modifierDefinitionId);
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
        const redemptionQuestTemplate = await questRepository.findById(redemptionQuestId);
        if (redemptionQuestTemplate) {
            const newQuestData = {
                ...redemptionQuestTemplate,
                id: undefined, // Let the repo create a new ID
                title: `${redemptionQuestTemplate.title} (Redemption)`,
                assignedUserIds: [userId],
                isActive: true,
            };
            newRedemptionQuest = await questRepository.create(newQuestData);
            newAppliedModifierData.redemptionQuestId = newRedemptionQuest.id;
        }
    }
    
    const savedModifier = await appliedModifierRepository.create(newAppliedModifierData);
    
    // TODO: Apply immediate effects like reward deduction
    
    const updatedUser = await userRepository.findById(userId); // Re-fetch to be safe
    updateEmitter.emit('update');
    return { updatedUser, newAppliedModifier: savedModifier, newRedemptionQuest };
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    apply,
};