const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinitions,
} = require('../controllers/setbacks.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllDefinitions));
router.post('/', asyncMiddleware(createDefinition));
router.put('/:id', asyncMiddleware(updateDefinition));
router.delete('/', asyncMiddleware(deleteDefinitions));

module.exports = router;