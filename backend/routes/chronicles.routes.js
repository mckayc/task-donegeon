const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const { getChronicles } = require('../controllers/data.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getChronicles));

module.exports = router;
