const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getSettings,
    updateSettings,
} = require('../controllers/settings.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getSettings));
router.put('/', asyncMiddleware(updateSettings)); // Typically settings are a singleton, so PUT on the collection is fine.

module.exports = router;