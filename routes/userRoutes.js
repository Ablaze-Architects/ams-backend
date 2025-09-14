const express = require('express');
const router = express.Router();
const { signup } = require('../controller/userController');

// POST /api/user/signup
router.post('/signup', signup);

module.exports = router;
