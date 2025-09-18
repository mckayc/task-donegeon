const systemService = require('../services/system.service');
const chronicleService = require('../services/chronicle.service');

const getChronicles = async (req, res) => {
    const result = await systemService.getChronicles(req.query);
    res.json(result);
};

const getTutorSessionByCompletionId = async (req, res) => {
    const { completionId } = req.params;
    const sessionLog = await chronicleService.getTutorSessionLog(completionId);
    if (sessionLog) {
        res.json(sessionLog);
    } else {
        res.status(404).json({ error: 'Session log not found for this completion.' });
    }
};

module.exports = {
    getChronicles,
    getTutorSessionByCompletionId,
};
