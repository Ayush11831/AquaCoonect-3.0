// backend/src/controllers/userController.js
const jwt = require('jsonwebtoken');
const { User } = require('../models/auth');
const config = require('../config/config');

function signToken(user) {
    return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
}

async function register(req, res) {
    try {
        const { username, email, phone, password, role } = req.body;

        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        // Only allow self-registration as a citizen; officer accounts are provisioned separately.
        const user = await User.create({ username, email, phone, password, role: 'citizen' });
        return res.status(201).json({ success: true, data: user, token: signToken(user) });
    } catch (err) {
        console.error('register error:', err.message);
        return res.status(500).json({ success: false, error: 'Registration failed' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        const ok = await User.verifyPassword(user, password);
        if (!ok) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const { password_hash, ...safeUser } = user;
        return res.json({ success: true, data: safeUser, token: signToken(user) });
    } catch (err) {
        console.error('login error:', err.message);
        return res.status(500).json({ success: false, error: 'Login failed' });
    }
}

async function me(req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        return res.json({ success: true, data: user });
    } catch (err) {
        console.error('me error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
    }
}

async function updateProfile(req, res) {
    try {
        const { username, phone } = req.body;
        const updated = await User.update(req.user.id, { username, phone });
        if (!updated) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        return res.json({ success: true, data: updated });
    } catch (err) {
        console.error('updateProfile error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
}

module.exports = { register, login, me, updateProfile };
