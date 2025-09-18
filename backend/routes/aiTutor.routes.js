const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllAITutors,
    createAITutor,
    updateAITutor,
    deleteAITutors,
} = require('../controllers/aiTutor.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllAITutors));
router.post('/', asyncMiddleware(createAITutor));
router.put('/:id', asyncMiddleware(updateAITutor));
router.delete('/', asyncMiddleware(deleteAITutors));

module.exports = router;
