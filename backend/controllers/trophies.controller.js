const trophyService = require('../services/trophy.service');

const getAllTrophies = async (req, res) => {
    const trophies = await trophyService.getAll();
    res.json(trophies);
};

const createTrophy = async (req, res) => {
    const savedTrophy = await trophyService.create(req.body);
    res.status(201).json(savedTrophy);
};

const updateTrophy = async (req, res) => {
    const updatedTrophy = await trophyService.update(req.params.id, req.body);
    if (!updatedTrophy) return res.status(404).send('Trophy not found');
    res.json(updatedTrophy);
};

const cloneTrophy = async (req, res) => {
    const clonedTrophy = await trophyService.clone(req.params.id);
    if (!clonedTrophy) return res.status(404).send('Trophy not found');
    res.status(201).json(clonedTrophy);
};

const deleteTrophies = async (req, res) => {
    await trophyService.deleteMany(req.body.ids);
    res.status(204).send();
};

module.exports = {
    getAllTrophies,
    createTrophy,
    updateTrophy,
    cloneTrophy,
    deleteTrophies,
};