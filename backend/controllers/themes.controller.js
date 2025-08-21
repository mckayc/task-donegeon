const themeService = require('../services/theme.service');

const getAllThemes = async (req, res) => {
    const themes = await themeService.getAll();
    res.json(themes);
};

const createTheme = async (req, res) => {
    const savedTheme = await themeService.create(req.body);
    res.status(201).json(savedTheme);
};

const updateTheme = async (req, res) => {
    const updatedTheme = await themeService.update(req.params.id, req.body);
    if (!updatedTheme) return res.status(404).send('Theme not found');
    res.json(updatedTheme);
};

const deleteThemes = async (req, res) => {
    await themeService.deleteMany(req.body.ids);
    res.status(204).send();
};

module.exports = {
    getAllThemes,
    createTheme,
    updateTheme,
    deleteThemes,
};