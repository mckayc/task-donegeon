const questService = require('../services/quests.service');

const getAllQuests = async (req, res) => {
    const quests = await questService.getAll();
    res.json(quests);
};

const createQuest = async (req, res) => {
    const { actorId, ...questData } = req.body;
    const savedQuest = await questService.create(questData, actorId);
    res.status(201).json(savedQuest);
};

const cloneQuest = async (req, res) => {
    const clonedQuest = await questService.clone(req.params.id);
    if (!clonedQuest) return res.status(404).send('Quest not found');
    res.status(201).json(clonedQuest);
};

const updateQuest = async (req, res) => {
    const { actorId, ...questData } = req.body;
    const updatedQuest = await questService.update(req.params.id, questData, actorId);
    if (!updatedQuest) return res.status(404).send('Quest not found');
    res.json(updatedQuest);
};

const deleteQuests = async (req, res) => {
    const { ids, actorId } = req.body;
    await questService.deleteMany(ids, actorId);
    res.status(204).send();
};

const bulkUpdateQuestsStatus = async (req, res) => {
    await questService.bulkUpdateStatus(req.body.ids, req.body.isActive);
    res.status(204).send();
};

const bulkUpdateQuests = async (req, res) => {
    await questService.bulkUpdate(req.body.ids, req.body.updates);
    res.status(204).send();
};

const completeQuest = async (req, res) => {
    const { completionData } = req.body;
    const result = await questService.complete(completionData);
    res.status(201).json(result);
};

const approveQuestCompletion = async (req, res) => {
    const { id } = req.params;
    const { approverId, note } = req.body;
    try {
        const result = await questService.approveQuestCompletion(id, approverId, note);
        if (!result) return res.status(404).json({ error: 'Completion not found or not pending.' });
        res.json(result);
    } catch (error) {
        if (error.message.includes('Self-approval is disabled')) {
            return res.status(403).json({ error: error.message });
        }
        throw error;
    }
};

const rejectQuestCompletion = async (req, res) => {
    const { id } = req.params;
    const { rejecterId, note } = req.body;
    const result = await questService.rejectQuestCompletion(id, rejecterId, note);
    if (!result) return res.status(404).json({ error: 'Completion not found or not pending.' });
    res.json(result);
};

const markQuestAsTodo = async (req, res) => {
    const { questId, userId } = req.body;
    const updatedQuest = await questService.markAsTodo(questId, userId);
    if (!updatedQuest) return res.status(404).json({ error: 'Quest not found.' });
    res.json(updatedQuest);
};

const unmarkQuestAsTodo = async (req, res) => {
    const { questId, userId } = req.body;
    const updatedQuest = await questService.unmarkAsTodo(questId, userId);
    if (!updatedQuest) return res.status(404).json({ error: 'Quest not found.' });
    res.json(updatedQuest);
};

const completeCheckpoint = async (req, res) => {
    const { questId, userId } = req.body;
    try {
        const result = await questService.completeCheckpoint(questId, userId);
        res.status(200).json(result);
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('invalid')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('already completed') || error.message.includes('pending approval')) {
            return res.status(400).json({ error: error.message });
        }
        // For other errors, let the default error handler take over.
        console.error("Error in completeCheckpoint controller:", error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
};

const claimQuest = async (req, res) => {
    const { questId, userId } = req.body;
    const result = await questService.claimQuest(questId, userId);
    if (!result) return res.status(400).json({ error: 'Could not claim quest.'});
    res.json(result);
}

const unclaimQuest = async (req, res) => {
    const { questId, userId } = req.body;
    const result = await questService.unclaimQuest(questId, userId);
    if (!result) return res.status(400).json({ error: 'Could not unclaim quest.'});
    res.json(result);
}

const approveClaim = async (req, res) => {
    const { questId, userId, adminId } = req.body;
    const result = await questService.approveClaim(questId, userId, adminId);
    if (!result) return res.status(400).json({ error: 'Could not approve claim.'});
    res.json(result);
}

const rejectClaim = async (req, res) => {
    const { questId, userId, adminId } = req.body;
    const result = await questService.rejectClaim(questId, userId, adminId);
    if (!result) return res.status(400).json({ error: 'Could not reject claim.'});
    res.json(result);
}

const updateReadingProgress = async (req, res) => {
    const { id: questId } = req.params;
    const { userId, data } = req.body;
    const result = await questService.updateReadingProgress(questId, userId, data);
    if (!result) return res.status(404).json({ error: 'Quest not found.' });
    res.status(200).json(result);
};

module.exports = {
    getAllQuests,
    createQuest,
    cloneQuest,
    updateQuest,
    deleteQuests,
    bulkUpdateQuestsStatus,
    bulkUpdateQuests,
    completeQuest,
    approveQuestCompletion,
    rejectQuestCompletion,
    markQuestAsTodo,
    unmarkQuestAsTodo,
    completeCheckpoint,
    claimQuest,
    unclaimQuest,
    approveClaim,
    rejectClaim,
    updateReadingProgress,
};