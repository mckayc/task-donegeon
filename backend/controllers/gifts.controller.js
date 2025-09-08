const giftService = require('../services/gift.service');

const getAllGifts = async (req, res) => {
    const gifts = await giftService.getAll();
    res.json(gifts);
};

const createGift = async (req, res) => {
    const savedGift = await giftService.create(req.body);
    res.status(201).json(savedGift);
};

const updateGift = async (req, res) => {
    const updatedGift = await giftService.update(req.params.id, req.body);
    if (!updatedGift) return res.status(404).send('Gift not found');
    res.json(updatedGift);
};

const deleteGifts = async (req, res) => {
    await giftService.deleteMany(req.body.ids);
    res.status(204).send();
};

const sendGift = async (req, res) => {
    const { recipientId, assetId, guildId, senderId } = req.body;
    const result = await giftService.send(senderId, recipientId, assetId, guildId);
    if (!result) return res.status(400).json({ error: 'Failed to send gift.' });
    res.status(201).json({ message: 'Gift sent successfully.' });
};

module.exports = {
    getAllGifts,
    createGift,
    updateGift,
    deleteGifts,
    sendGift,
};