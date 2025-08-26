const userService = require('../services/user.service');

const getAllUsers = async (req, res) => {
    const { searchTerm, sortBy } = req.query;
    const users = await userService.getAll({ searchTerm, sortBy });
    res.json(users);
};

const createUser = async (req, res) => {
    const { actorId, ...userData } = req.body;
    const savedUser = await userService.create(userData, actorId);
    if (!savedUser) return res.status(409).json({ error: 'Username or email is already in use.' });
    res.status(201).json(savedUser);
};

const cloneUser = async (req, res) => {
    const clonedUser = await userService.clone(req.params.id);
    if (!clonedUser) return res.status(404).send('User not found');
    res.status(201).json(clonedUser);
};

const updateUser = async (req, res) => {
    const result = await userService.update(req.params.id, req.body);
    if (!result.success) {
        return res.status(result.status).json({ error: result.message });
    }
    res.json(result.user);
};

const deleteUsers = async (req, res) => {
    const { ids, actorId } = req.body;
    await userService.deleteMany(ids, actorId);
    res.status(204).send();
};

const applyManualAdjustment = async (req, res) => {
    const adjustmentData = req.body;
    const result = await userService.adjust(adjustmentData);
    if (!result) return res.status(404).json({ error: 'User not found.' });
    res.status(201).json(result);
};

module.exports = {
    getAllUsers,
    createUser,
    cloneUser,
    updateUser,
    deleteUsers,
    applyManualAdjustment,
};
