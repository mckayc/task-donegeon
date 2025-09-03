
const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllMinigames,
    getAllScores,
    playMinigame,
    submitScore,
    deleteMinigame,
} = require('../controllers/minigames.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllMinigames));
router.get('/scores', asyncMiddleware(getAllScores));
router.post('/:gameId/play', asyncMiddleware(playMinigame));
router.post('/score', asyncMiddleware(submitScore));
router.delete('/:gameId', asyncMiddleware(deleteMinigame));

module.exports = router;
