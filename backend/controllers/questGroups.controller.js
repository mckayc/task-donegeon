const questGroupService = require('../services/questGroup.service');

const getAllQuestGroups = async (req, res) => {
    const groups = await questGroupService.getAll();
    res.json(groups);
};

const createQuestGroup = async (req, res) => {
    const savedGroup = await questGroupService.create(req.body);
    res.status(201).json(savedGroup);
};

const updateQuestGroup = async (req, res) => {
    const updatedGroup = await questGroupService.update(req.params.id, req.body);
    if (!updatedGroup) return res.status(404).send('Quest Group not found');
    res.json(updatedGroup);
};

const deleteQuestGroups = async (req, res) => {
    await questGroupService.deleteMany(req.body.ids);
    res.status(204).send();
};

const assignQuestGroupToUsers = async (req, res) => {
    const { groupId, userIds } = req.body;
    await questGroupService.assignToUsers(groupId, userIds);
    res.status(204).send();
};

module.exports = {
    getAllQuestGroups,
    createQuestGroup,
    updateQuestGroup,
    deleteQuestGroups,
    assignQuestGroupToUsers,
};