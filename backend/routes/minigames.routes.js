

const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllMinigames,
    updateMinigame,
    getAllScores,
    playMinigame,
    submitScore,
    deleteMinigame,
    resetAllScoresForGame,
    resetScoresForUsers,
} = require('../controllers/minigames.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllMinigames));
router.put('/:gameId', asyncMiddleware(updateMinigame));
router.get('/scores', asyncMiddleware(getAllScores));
router.post('/:gameId/play', asyncMiddleware(playMinigame));
router.post('/score', asyncMiddleware(submitScore));
router.delete('/:gameId', asyncMiddleware(deleteMinigame));
router.post('/:gameId/reset-all-scores', asyncMiddleware(resetAllScoresForGame));
router.post('/:gameId/reset-user-scores', asyncMiddleware(resetScoresForUsers));

module.exports = router;