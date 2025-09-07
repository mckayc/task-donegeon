const modifierService = require('../services/modifier.service');

const getAllAppliedModifiers = async (req, res) => {
    const items = await modifierService.getAll();
    res.json(items);
};

const createAppliedModifier = async (req, res) => {
    const savedItem = await modifierService.create(req.body);
    res.status(201).json(savedItem);
};

const updateAppliedModifier = async (req, res) => {
    const savedItem = await modifierService.update(req.params.id, req.body);
    if (!savedItem) return res.status(404).send('Applied modifier not found');
    res.json(savedItem);
};

const deleteAppliedModifiers = async (req, res) => {
    await modifierService.deleteMany(req.body.ids);
    res.status(204).send();
};

const applyModifier = async (req, res) => {
    const { userId, modifierDefinitionId, reason, overrides } = req.body;
    // Assuming currentUser is available from some auth middleware in a real app
    const appliedById = req.body.appliedById || 'system'; 
    
    const result = await modifierService.apply(userId, modifierDefinitionId, reason, appliedById, overrides);
    if (!result) return res.status(404).json({ error: 'User or modifier definition not found.' });
    
    res.json(result);
};

const bulkApplyModifier = async (req, res) => {
    const { userIds, modifierDefinitionId, reason, appliedById } = req.body;
    const result = await modifierService.bulkApply(userIds, modifierDefinitionId, reason, appliedById);
    if (!result) return res.status(404).json({ error: 'Failed to apply modifiers. Check if users and definition exist.' });
    res.json(result);
};

module.exports = {
    getAllAppliedModifiers,
    createAppliedModifier,
    updateAppliedModifier,
    deleteAppliedModifiers,
    applyModifier,
    bulkApplyModifier,
};