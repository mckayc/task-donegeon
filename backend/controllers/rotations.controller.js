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

const runRotation = async (req, res) => {
    const result = await rotationService.run(req.params.id);
    if (!result.success) {
        return res.status(400).json({ error: result.message });
    }
    res.status(200).json({ message: result.message });
};

module.exports = {
    getAllRotations,
    createRotation,
    updateRotation,
    deleteRotations,
    runRotation,
};