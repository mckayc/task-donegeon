const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllTrades,
    createTrade,
    updateTrade,
    deleteTrades,
    proposeTrade,
    acceptTrade,
    cancelOrRejectTrade,
} = require('../controllers/trades.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllTrades));
router.post('/', asyncMiddleware(createTrade));
router.put('/:id', asyncMiddleware(updateTrade));
router.delete('/', asyncMiddleware(deleteTrades));

// --- Actions ---
router.post('/propose', asyncMiddleware(proposeTrade));
router.post('/accept/:id', asyncMiddleware(acceptTrade));
router.post('/resolve/:id', asyncMiddleware(cancelOrRejectTrade));

module.exports = router;
