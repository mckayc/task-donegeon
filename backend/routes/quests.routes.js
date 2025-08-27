
const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
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
} = require('../controllers/quests.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllQuests));
router.post('/', asyncMiddleware(createQuest));
router.post('/clone/:id', asyncMiddleware(cloneQuest));
router.put('/:id', asyncMiddleware(updateQuest));
router.delete('/', asyncMiddleware(deleteQuests));
router.put('/bulk-status', asyncMiddleware(bulkUpdateQuestsStatus));
router.put('/bulk-update', asyncMiddleware(bulkUpdateQuests));

// --- Actions ---
router.post('/complete', asyncMiddleware(completeQuest));
router.post('/approve/:id', asyncMiddleware(approveQuestCompletion));
router.post('/reject/:id', asyncMiddleware(rejectQuestCompletion));
router.post('/mark-todo', asyncMiddleware(markQuestAsTodo));
router.post('/unmark-todo', asyncMiddleware(unmarkQuestAsTodo));
router.post('/complete-checkpoint', asyncMiddleware(completeCheckpoint));
router.post('/claim', asyncMiddleware(claimQuest));
router.post('/unclaim', asyncMiddleware(unclaimQuest));
router.post('/approve-claim', asyncMiddleware(approveClaim));
router.post('/reject-claim', asyncMiddleware(rejectClaim));


module.exports = router;