const settingService = require('../services/setting.service');

const getSettings = async (req, res) => {
    const settings = await settingService.get();
    res.json(settings);
};

const updateSettings = async (req, res) => {
    const savedSettings = await settingService.update(req.body);
    res.json(savedSettings);
};

module.exports = {
    getSettings,
    updateSettings,
};