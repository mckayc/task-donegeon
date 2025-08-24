
const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllRotations,
    createRotation,
    updateRotation,
    deleteRotations,
    cloneRotation,
    runRotation,
} = require('../controllers/rotations.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllRotations));
router.post('/', asyncMiddleware(createRotation));
router.put('/:id', asyncMiddleware(updateRotation));
router.delete('/', asyncMiddleware(deleteRotations));
router.post('/clone/:id', asyncMiddleware(cloneRotation));
router.post('/run/:id', asyncMiddleware(runRotation));

module.exports = router;
