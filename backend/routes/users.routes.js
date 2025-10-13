

const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllUsers,
    createUser,
    cloneUser,
    updateUser,
    deleteUsers,
    applyManualAdjustment,
    getPendingItemsForUser,
    generateRewardToken,
    claimRewardToken,
    depositToVault,
    withdrawFromVault,
    accrueInterest,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllUsers));
router.post('/', asyncMiddleware(createUser));
router.post('/clone/:id', asyncMiddleware(cloneUser));
router.put('/:id', asyncMiddleware(updateUser));
router.delete('/', asyncMiddleware(deleteUsers));
router.get('/:userId/pending-items', asyncMiddleware(getPendingItemsForUser));

// --- Actions ---
router.post('/adjust', asyncMiddleware(applyManualAdjustment));
router.post('/generate-reward-token', asyncMiddleware(generateRewardToken));
router.post('/claim-reward-token', asyncMiddleware(claimRewardToken));

// --- Enchanted Vault ---
router.post('/vault/deposit', asyncMiddleware(depositToVault));
router.post('/vault/withdraw', asyncMiddleware(withdrawFromVault));
router.post('/vault/accrue-interest', asyncMiddleware(accrueInterest));


module.exports = router;