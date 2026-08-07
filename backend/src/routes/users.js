// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
} = require('../middleware/validate');
const { register, login, me, updateProfile } = require('../controllers/userController');

router.post('/register', ...validateRegister, register);
router.post('/login', ...validateLogin, login);
router.get('/me', authMiddleware, me);
router.put('/me', authMiddleware, ...validateUpdateProfile, updateProfile);

module.exports = router;
