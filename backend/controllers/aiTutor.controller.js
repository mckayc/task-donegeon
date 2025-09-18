const aiTutorService = require('../services/aiTutor.service');

const getAllAITutors = async (req, res) => {
    const tutors = await aiTutorService.getAll();
    res.json(tutors);
};

const createAITutor = async (req, res) => {
    const savedTutor = await aiTutorService.create(req.body);
    res.status(201).json(savedTutor);
};

const updateAITutor = async (req, res) => {
    const updatedTutor = await aiTutorService.update(req.params.id, req.body);
    if (!updatedTutor) return res.status(404).send('AI Tutor not found');
    res.json(updatedTutor);
};

const deleteAITutors = async (req, res) => {
    await aiTutorService.deleteMany(req.body.ids);
    res.status(204).send();
};

module.exports = {
    getAllAITutors,
    createAITutor,
    updateAITutor,
    deleteAITutors,
};
