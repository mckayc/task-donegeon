const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllTrophies,
    createTrophy,
    updateTrophy,
    cloneTrophy,
    deleteTrophies,
} = require('../controllers/trophies.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllTrophies));
router.post('/', asyncMiddleware(createTrophy));
router.put('/:id', asyncMiddleware(updateTrophy));
router.post('/clone/:id', asyncMiddleware(cloneTrophy));
router.delete('/', asyncMiddleware(deleteTrophies));

module.exports = router;
