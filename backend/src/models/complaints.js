// backend/src/models/complaints.js
const { query } = require('../config/database');

const SORT_COLUMNS = {
    priority: 'priority_score DESC NULLS LAST, created_at DESC',
    recent: 'created_at DESC',
};

const Complaint = {
    async create({
        user_id = null,
        title,
        description,
        issue_type,
        latitude,
        longitude,
        address = null,
        image_urls = [],
    }) {
        const result = await query(
            `INSERT INTO complaints
                (user_id, title, description, issue_type, latitude, longitude, address, image_urls, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
             RETURNING *`,
            [user_id, title, description, issue_type, latitude, longitude, address, image_urls]
        );
        return result.rows[0];
    },

    async setPriority(id, priorityScore) {
        const result = await query(
            `UPDATE complaints
                SET priority_score = $2, updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
             RETURNING *`,
            [id, priorityScore]
        );
        return result.rows[0];
    },

    async list({ status, sortBy = 'priority', page = 1, limit = 20 }) {
        const order = SORT_COLUMNS[sortBy] || SORT_COLUMNS.priority;
        const params = [];
        let where = '';
        if (status) {
            params.push(status);
            where = `WHERE status = $${params.length}`;
        }

        const offset = (Math.max(1, page) - 1) * limit;
        params.push(limit, offset);

        const rows = await query(
            `SELECT * FROM complaints ${where}
              ORDER BY ${order}
              LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        const countParams = status ? [status] : [];
        const total = await query(
            `SELECT COUNT(*)::int AS total FROM complaints ${where}`,
            countParams
        );

        return { rows: rows.rows, total: total.rows[0].total };
    },

    async findById(id) {
        const result = await query('SELECT * FROM complaints WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async updateStatus(id, status) {
        const result = await query(
            `UPDATE complaints
                SET status = $2, updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
             RETURNING *`,
            [id, status]
        );
        return result.rows[0];
    },
};

const Response = {
    async create({ complaint_id, officer_id, action_taken, image_urls = [] }) {
        const result = await query(
            `INSERT INTO responses (complaint_id, officer_id, action_taken, image_urls)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [complaint_id, officer_id, action_taken, image_urls]
        );
        return result.rows[0];
    },
};

module.exports = { Complaint, Response };
