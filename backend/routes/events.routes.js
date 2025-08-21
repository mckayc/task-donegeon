const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} = require('../controllers/events.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllEvents));
router.post('/', asyncMiddleware(createEvent));
router.put('/:id', asyncMiddleware(updateEvent));
router.delete('/:id', asyncMiddleware(deleteEvent));

module.exports = router;
