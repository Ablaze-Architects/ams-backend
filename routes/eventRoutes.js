const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents } = require('../controller/eventController');

// @route   POST /api/events/:adminId/createEvent
router.post('/:adminId/createEvent', createEvent);

// @route   GET /api/events/:adminId/getAllEvents
router.get('/:adminId/getAllEvents', getAllEvents);

module.exports = router;
