const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllGifts,
    createGift,
    updateGift,
    deleteGifts,
    sendGift,
} = require('../controllers/gifts.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllGifts));
router.post('/', asyncMiddleware(createGift));
router.put('/:id', asyncMiddleware(updateGift));
router.delete('/', asyncMiddleware(deleteGifts));

// --- Actions ---
router.post('/send', asyncMiddleware(sendGift));

module.exports = router;
