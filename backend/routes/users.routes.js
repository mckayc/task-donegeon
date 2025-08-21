const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllUsers,
    createUser,
    cloneUser,
    updateUser,
    deleteUsers,
    applyManualAdjustment,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllUsers));
router.post('/', asyncMiddleware(createUser));
router.post('/clone/:id', asyncMiddleware(cloneUser));
router.put('/:id', asyncMiddleware(updateUser));
router.delete('/', asyncMiddleware(deleteUsers));

// --- Actions ---
router.post('/adjust', asyncMiddleware(applyManualAdjustment));

module.exports = router;
