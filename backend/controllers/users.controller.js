
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

const updateUser = async (req, res, next) => {
    try {
        const updatedUser = await userService.update(req.params.id, req.body);
        if (!updatedUser) {
            // This can be a 404 Not Found or a 409 Conflict. The service now returns null for either.
            return res.status(409).json({ error: 'Update failed. User not found or username/email may be taken.' });
        }
        // Explicitly setting status 200 to prevent any potential middleware issues
        // causing an undefined status code before this point.
        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error(`[CONTROLLER_ERROR] updateUser failed for user ${req.params.id}:`, error);
        // Pass the error to the next middleware (Express's default error handler)
        next(error);
    }
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

const getPendingItemsForUser = async (req, res) => {
    const { userId } = req.params;
    const items = await userService.getPendingItems(userId);
    res.json(items);
};

const generateRewardToken = async (req, res) => {
    const token = await userService.generateRewardToken(req.body);
    res.status(201).json({ token });
};

const claimRewardToken = async (req, res) => {
    const { token } = req.body;
    const result = await userService.claimRewardToken(token);
    res.status(200).json(result);
};

const depositToVault = async (req, res) => {
    const { userId, amounts } = req.body;
    const result = await userService.depositToVault(userId, amounts);
    res.json(result);
};

const withdrawFromVault = async (req, res) => {
    const { userId, amounts } = req.body;
    const result = await userService.withdrawFromVault(userId, amounts);
    res.json(result);
};

const accrueInterest = async (req, res) => {
    const { userId } = req.body;
    const result = await userService.accrueInterestForUser(userId);
    res.json(result);
};

module.exports = {
    getAllUsers,
    createUser,
    cloneUser,
    updateUser,
    deleteUsers,
    applyManualAdjustment,
    getPendingItemsForUser,
    generateRewardToken,
    claimRewardToken,
    depositToVault,
    withdrawFromVault,
    accrueInterest,
};