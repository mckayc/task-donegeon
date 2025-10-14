const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllAssets,
    createAsset,
    updateAsset,
    cloneAsset,
    deleteAssets,
    useItem,
    craftItem,
    bulkUpdateAvailability,
} = require('../controllers/assets.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllAssets));
router.post('/', asyncMiddleware(createAsset));
router.put('/:id', asyncMiddleware(updateAsset));
router.post('/clone/:id', asyncMiddleware(cloneAsset));
router.delete('/', asyncMiddleware(deleteAssets));
router.put('/bulk-availability', asyncMiddleware(bulkUpdateAvailability));


// --- Actions ---
router.post('/use/:id', asyncMiddleware(useItem));
router.post('/craft/:id', asyncMiddleware(craftItem));

module.exports = router;