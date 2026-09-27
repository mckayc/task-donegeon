const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
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
    revertPurchaseRequest,
    executeExchange,
} = require('../controllers/markets.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllMarkets));
router.post('/', asyncMiddleware(createMarket));
router.post('/clone/:id', asyncMiddleware(cloneMarket));
router.delete('/', asyncMiddleware(deleteMarkets));
router.put('/bulk-status', asyncMiddleware(bulkUpdateMarketsStatus));
router.put('/:id', asyncMiddleware(updateMarket));

// --- Actions ---
router.post('/purchase', asyncMiddleware(purchaseMarketItem));
router.post('/approve-purchase/:id', asyncMiddleware(approvePurchaseRequest));
router.post('/reject-purchase/:id', asyncMiddleware(rejectPurchaseRequest));
router.post('/cancel-purchase/:id', asyncMiddleware(cancelPurchaseRequest));
router.post('/revert-purchase/:id', asyncMiddleware(revertPurchaseRequest));
router.post('/exchange', asyncMiddleware(executeExchange));

module.exports = router;