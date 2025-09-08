const rankService = require('../services/rank.service');

const getAllRanks = async (req, res) => {
    const ranks = await rankService.getAll();
    res.json(ranks);
};

const createRank = async (req, res) => {
    const savedRank = await rankService.create(req.body);
    res.status(201).json(savedRank);
};

const updateRank = async (req, res) => {
    const updatedRank = await rankService.update(req.params.id, req.body);
    if (!updatedRank) return res.status(404).send('Rank not found');
    res.json(updatedRank);
};

const deleteRanks = async (req, res) => {
    await rankService.deleteMany(req.body.ids);
    res.status(204).send();
};

const bulkUpdateRanks = async (req, res) => {
    await rankService.replaceAll(req.body.ranks);
    res.status(204).send();
};

module.exports = {
    getAllRanks,
    createRank,
    updateRank,
    deleteRanks,
    bulkUpdateRanks,
};