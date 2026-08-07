// backend/src/models/auth.js
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const User = {
    async create({ username, email, phone = null, password, role = 'citizen' }) {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO users (username, email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email, phone, role, created_at`,
            [username, email, phone, password_hash, role]
        );
        return result.rows[0];
    },

    async findByEmail(email) {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await query(
            'SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    async verifyPassword(user, password) {
        if (!user || !user.password_hash) return false;
        return bcrypt.compare(password, user.password_hash);
    },

    async update(id, { username, phone }) {
        const updates = [];
        const values = [id];
        
        if (username !== undefined) {
            values.push(username);
            updates.push(`username = $${values.length}`);
        }
        
        if (phone !== undefined) {
            values.push(phone);
            updates.push(`phone = $${values.length}`);
        }
        
        if (updates.length === 0) {
            const result = await query(
                'SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        }
        
        const result = await query(
            `UPDATE users 
             SET ${updates.join(', ')} 
             WHERE id = $1 
             RETURNING id, username, email, phone, role, created_at`,
            values
        );
        return result.rows[0] || null;
    },
};

module.exports = { User };
