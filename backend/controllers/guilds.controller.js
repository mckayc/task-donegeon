
const guildService = require('../services/guild.service');

const getAllGuilds = async (req, res) => {
    const guilds = await guildService.getAll();
    res.json(guilds);
};

const createGuild = async (req, res) => {
    const savedGuild = await guildService.create(req.body);
    res.status(201).json(savedGuild);
};

const updateGuild = async (req, res) => {
    const updatedGuild = await guildService.update(req.params.id, req.body);
    if (!updatedGuild) return res.status(404).send('Guild not found');
    res.json(updatedGuild);
};

const deleteGuild = async (req, res) => {
    const { ids, actorId } = req.body;
    await guildService.remove(ids, actorId);
    res.status(204).send();
};

module.exports = {
    getAllGuilds,
    createGuild,
    updateGuild,
    deleteGuild,
};
