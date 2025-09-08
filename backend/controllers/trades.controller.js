const tradeService = require('../services/trade.service');

const getAllTrades = async (req, res) => {
    const trades = await tradeService.getAll();
    res.json(trades);
};

const createTrade = async (req, res) => {
    const savedTrade = await tradeService.create(req.body);
    res.status(201).json(savedTrade);
};

const updateTrade = async (req, res) => {
    const updatedTrade = await tradeService.update(req.params.id, req.body);
    if (!updatedTrade) return res.status(404).send('Trade not found');
    res.json(updatedTrade);
};

const deleteTrades = async (req, res) => {
    await tradeService.deleteMany(req.body.ids);
    res.status(204).send();
};

const proposeTrade = async (req, res) => {
    const { recipientId, guildId } = req.body;
    const initiatorId = req.body.initiatorId;
    const newTrade = await tradeService.propose(initiatorId, recipientId, guildId);
    res.status(201).json(newTrade);
};

const acceptTrade = async (req, res) => {
    const result = await tradeService.accept(req.params.id);
    if (!result) return res.status(400).json({ error: 'Trade could not be completed.' });
    res.json(result);
};

const cancelOrRejectTrade = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'cancelled' or 'rejected'
    const updatedTrade = await tradeService.resolve(id, action);
    if (!updatedTrade) return res.status(404).send('Trade not found');
    res.status(200).json(updatedTrade);
};

module.exports = {
    getAllTrades,
    createTrade,
    updateTrade,
    deleteTrades,
    proposeTrade,
    acceptTrade,
    cancelOrRejectTrade,
};