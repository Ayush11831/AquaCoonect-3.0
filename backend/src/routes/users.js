// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { register, login, me } = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);

module.exports = router;
