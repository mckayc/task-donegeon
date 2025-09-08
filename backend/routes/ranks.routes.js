const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllRanks,
    createRank,
    updateRank,
    deleteRanks,
    bulkUpdateRanks,
} = require('../controllers/ranks.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllRanks));
router.post('/', asyncMiddleware(createRank));
router.put('/:id', asyncMiddleware(updateRank));
router.delete('/', asyncMiddleware(deleteRanks));
router.post('/bulk-update', asyncMiddleware(bulkUpdateRanks));

module.exports = router;
