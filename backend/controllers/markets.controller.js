const marketService = require('../services/market.service');
const purchaseRequestService = require('../services/purchaseRequest.service');

const getAllMarkets = async (req, res) => {
    const markets = await marketService.getAll();
    res.json(markets);
};

const createMarket = async (req, res) => {
    const savedMarket = await marketService.create(req.body);
    res.status(201).json(savedMarket);
};

const updateMarket = async (req, res) => {
    const updatedMarket = await marketService.update(req.params.id, req.body);
    if (!updatedMarket) return res.status(404).send('Market not found');
    res.json(updatedMarket);
};

const deleteMarkets = async (req, res) => {
    await marketService.deleteMany(req.body.ids);
    res.status(204).send();
};

const cloneMarket = async (req, res) => {
    const clonedMarket = await marketService.clone(req.params.id);
    if (!clonedMarket) return res.status(404).send('Market not found');
    res.status(201).json(clonedMarket);
};

const bulkUpdateMarketsStatus = async (req, res) => {
    await marketService.bulkUpdateStatus(req.body.ids, req.body.statusType);
    res.status(204).send();
};

// --- Actions ---

const purchaseMarketItem = async (req, res) => {
    const { assetId, userId, costGroupIndex, guildId } = req.body;
    const result = await purchaseRequestService.create(assetId, userId, costGroupIndex, guildId);
    if (!result) return res.status(400).json({ error: 'Purchase request failed.' });
    res.json(result);
};

const approvePurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const { approverId } = req.body;
    const result = await purchaseRequestService.approve(id, approverId);
    if (!result) return res.status(404).json({ error: 'Request not found or not pending.' });
    res.json(result);
};

const rejectPurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const { rejecterId } = req.body;
    const result = await purchaseRequestService.reject(id, rejecterId);
    if (!result) return res.status(404).json({ error: 'Request not found or not pending.' });
    res.json(result);
};

const cancelPurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const result = await purchaseRequestService.cancel(id);
    if (!result) return res.status(404).json({ error: 'Request not found or not pending.' });
    res.json(result);
};

const executeExchange = async (req, res) => {
    const { userId, payItem, receiveItem, guildId } = req.body;
    const result = await marketService.exchange(userId, payItem, receiveItem, guildId);
    if (!result) return res.status(400).json({ error: 'Exchange failed.' });
    res.json(result);
};

module.exports = {
    getAllMarkets,
    createMarket,
    updateMarket,
    deleteMarkets,
    cloneMarket,
    bulkUpdateMarketsStatus,
    purchaseMarketItem,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    cancelPurchaseRequest,
    executeExchange,
};