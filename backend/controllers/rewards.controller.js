const rewardService = require('../services/reward.service');

const getAllRewardTypes = async (req, res) => {
    const rewards = await rewardService.getAll();
    res.json(rewards);
};

const createRewardType = async (req, res) => {
    const savedReward = await rewardService.create(req.body);
    res.status(201).json(savedReward);
};

const updateRewardType = async (req, res) => {
    const updatedReward = await rewardService.update(req.params.id, req.body);
    if (!updatedReward) return res.status(404).send('Reward type not found');
    res.json(updatedReward);
};

const cloneRewardType = async (req, res) => {
    const clonedReward = await rewardService.clone(req.params.id);
    if (!clonedReward) return res.status(404).send('Reward type not found');
    res.status(201).json(clonedReward);
};

const deleteRewardTypes = async (req, res) => {
    await rewardService.deleteMany(req.body.ids);
    res.status(204).send();
};


module.exports = {
    getAllRewardTypes,
    createRewardType,
    updateRewardType,
    cloneRewardType,
    deleteRewardTypes,
};