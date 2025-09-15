

const minigameService = require('../services/minigame.service');

const getAllMinigames = async (req, res) => {
    const games = await minigameService.getAll();
    res.json(games);
};

const updateMinigame = async (req, res) => {
    const updatedGame = await minigameService.update(req.params.gameId, req.body);
    if (!updatedGame) return res.status(404).send('Minigame not found');
    res.json(updatedGame);
};

const getAllScores = async (req, res) => {
    const scores = await minigameService.getAllScores();
    res.json(scores);
};

const playMinigame = async (req, res) => {
    const { gameId } = req.params;
    const { userId } = req.body;
    const result = await minigameService.play(gameId, userId);
    if (!result) {
        return res.status(400).json({ error: "Could not process 'play' action. Check Game Token balance." });
    }
    res.json(result);
};

const submitScore = async (req, res) => {
    const { gameId, userId, score } = req.body;
    const newScore = await minigameService.submitScore(gameId, userId, score);
    res.status(201).json(newScore);
};

const resetAllScoresForGame = async (req, res) => {
    await minigameService.resetAllScores(req.params.gameId);
    res.status(204).send();
};

const resetScoresForUsers = async (req, res) => {
    const { userIds } = req.body;
    await minigameService.resetScoresForUsers(req.params.gameId, userIds);
    res.status(204).send();
};


const deleteMinigame = async (req, res) => {
    // This is a placeholder for future admin functionality.
    // Core games should not be deletable by users.
    res.status(403).json({ error: 'Core minigames cannot be deleted.' });
};

module.exports = {
    getAllMinigames,
    updateMinigame,
    getAllScores,
    playMinigame,
    submitScore,
    resetAllScoresForGame,
    resetScoresForUsers,
    deleteMinigame,
};
