const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const { 
    getAllAppliedModifiers,
    createAppliedModifier,
    updateAppliedModifier,
    deleteAppliedModifiers,
    applyModifier,
    bulkApplyModifier
} = require('../controllers/appliedModifiers.controller');

const router = express.Router();

// --- Generic CRUD for managing applied modifiers ---
router.get('/', asyncMiddleware(getAllAppliedModifiers));
router.post('/', asyncMiddleware(createAppliedModifier));
router.put('/:id', asyncMiddleware(updateAppliedModifier));
router.delete('/', asyncMiddleware(deleteAppliedModifiers));

// --- Actions ---
router.post('/apply', asyncMiddleware(applyModifier));
router.post('/bulk-apply', asyncMiddleware(bulkApplyModifier));

module.exports = router;