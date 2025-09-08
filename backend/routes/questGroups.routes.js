const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllQuestGroups,
    createQuestGroup,
    updateQuestGroup,
    deleteQuestGroups,
    assignQuestGroupToUsers,
} = require('../controllers/questGroups.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllQuestGroups));
router.post('/', asyncMiddleware(createQuestGroup));
router.put('/:id', asyncMiddleware(updateQuestGroup));
router.delete('/', asyncMiddleware(deleteQuestGroups));
router.post('/assign', asyncMiddleware(assignQuestGroupToUsers));

module.exports = router;
