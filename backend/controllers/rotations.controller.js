

const rotationService = require('../services/rotation.service');

const getAllRotations = async (req, res) => {
    const rotations = await rotationService.getAll();
    res.json(rotations);
};

const createRotation = async (req, res) => {
    const savedRotation = await rotationService.create(req.body);
    res.status(201).json(savedRotation);
};

const updateRotation = async (req, res) => {
    const updatedRotation = await rotationService.update(req.params.id, req.body);
    if (!updatedRotation) return res.status(404).send('Rotation not found');
    res.json(updatedRotation);
};

const deleteRotations = async (req, res) => {
    await rotationService.deleteMany(req.body.ids);
    res.status(204).send();
};

const cloneRotation = async (req, res) => {
    const clonedRotation = await rotationService.clone(req.params.id);
    if (!clonedRotation) return res.status(404).send('Rotation not found');
    res.status(201).json(clonedRotation);
};

const runRotation = async (req, res) => {
    const result = await rotationService.run(req.params.id);
    if (!result) return res.status(404).send('Rotation not found or could not run.');
    res.status(200).json(result);
};

module.exports = {
    getAllRotations,
    createRotation,
    updateRotation,
    deleteRotations,
    cloneRotation,
    runRotation,
};