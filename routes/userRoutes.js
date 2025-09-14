const express = require('express');
const router = express.Router();
const { signup, login } = require('../controller/userController');

// POST /api/user/signup
router.post('/signup', signup);

// POST /api/user/login
router.post('/login', login);

module.exports = router;
