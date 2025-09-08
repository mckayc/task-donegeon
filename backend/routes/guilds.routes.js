const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllGuilds,
    createGuild,
    updateGuild,
    deleteGuild,
} = require('../controllers/guilds.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllGuilds));
router.post('/', asyncMiddleware(createGuild));
router.put('/:id', asyncMiddleware(updateGuild));
router.delete('/:id', asyncMiddleware(deleteGuild));

module.exports = router;
