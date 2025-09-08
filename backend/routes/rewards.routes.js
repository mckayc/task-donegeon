const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllRewardTypes,
    createRewardType,
    updateRewardType,
    cloneRewardType,
    deleteRewardTypes,
} = require('../controllers/rewards.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllRewardTypes));
router.post('/', asyncMiddleware(createRewardType));
router.put('/:id', asyncMiddleware(updateRewardType));
router.post('/clone/:id', asyncMiddleware(cloneRewardType));
router.delete('/', asyncMiddleware(deleteRewardTypes));

module.exports = router;
