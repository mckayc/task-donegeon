const setbackService = require('../services/setback.service');

const getAllDefinitions = async (req, res) => {
    const items = await setbackService.getAll();
    res.json(items);
};

const createDefinition = async (req, res) => {
    const savedItem = await setbackService.create(req.body);
    res.status(201).json(savedItem);
};

const updateDefinition = async (req, res) => {
    const savedItem = await setbackService.update(req.params.id, req.body);
    if (!savedItem) return res.status(404).send('Modifier definition not found');
    res.json(savedItem);
};

const deleteDefinitions = async (req, res) => {
    await setbackService.deleteMany(req.body.ids);
    res.status(204).send();
};


module.exports = {
    getAllDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinitions,
};
