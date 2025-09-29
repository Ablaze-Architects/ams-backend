const express = require('express');
const router = express.Router();
const { signup, login, logout, getAlumniById } = require('../controller/userController');

// POST /api/user/signup
router.post('/signup', signup);

// POST /api/user/login
router.post('/login', login);

// POST /api/user/:userId/logout
router.post('/:userId/logout', logout);

//GET api for particular alumni
router.get("/:alumniId", getAlumniById);

module.exports = router;
