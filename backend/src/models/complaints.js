// backend/src/models/complaints.js
const { query, pool } = require('../config/database');

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

    async createWithPriority({
        user_id = null,
        title,
        description,
        issue_type,
        latitude,
        longitude,
        address = null,
        image_urls = [],
        priorityScore
    }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const insertResult = await client.query(
                `INSERT INTO complaints
                    (user_id, title, description, issue_type, latitude, longitude, address, image_urls, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                 RETURNING *`,
                [user_id, title, description, issue_type, latitude, longitude, address, image_urls]
            );
            
            const complaintId = insertResult.rows[0].id;
            
            const updateResult = await client.query(
                `UPDATE complaints
                    SET priority_score = $2, updated_at = CURRENT_TIMESTAMP
                  WHERE id = $1
                 RETURNING *`,
                [complaintId, priorityScore]
            );
            
            await client.query('COMMIT');
            return updateResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async respond({ complaintId, officerId, actionTaken, imageUrls = [] }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const responseResult = await client.query(
                `INSERT INTO responses (complaint_id, officer_id, action_taken, image_urls)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [complaintId, officerId, actionTaken, imageUrls]
            );
            const response = responseResult.rows[0];

            const complaintResult = await client.query(
                `UPDATE complaints
                    SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
                  WHERE id = $1
                 RETURNING *`,
                [complaintId]
            );
            const complaint = complaintResult.rows[0];

            await client.query('COMMIT');
            return { response, complaint };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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
        const queryParams = [...params, limit, offset];

        const rowsResult = await query(
            `SELECT * FROM complaints ${where}
              ORDER BY ${order}
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            queryParams
        );

        const countParams = status ? [status] : [];
        const totalResult = await query(
            `SELECT COUNT(*)::int AS total FROM complaints ${where}`,
            countParams
        );

        const total = totalResult.rows[0].total;
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return { rows: rowsResult.rows, total, totalPages, hasMore };
    },

    async listByUser(userId, { page = 1, limit = 20 }) {
        const order = SORT_COLUMNS.recent;
        const offset = (Math.max(1, page) - 1) * limit;

        const rowsResult = await query(
            `SELECT * FROM complaints WHERE user_id = $1
              ORDER BY ${order}
              LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const totalResult = await query(
            `SELECT COUNT(*)::int AS total FROM complaints WHERE user_id = $1`,
            [userId]
        );

        const total = totalResult.rows[0].total;
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return { rows: rowsResult.rows, total, totalPages, hasMore };
    },

    async getById(id) {
        const result = await query(
            `SELECT c.*, u.username as reporter_name 
             FROM complaints c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.id = $1`,
            [id]
        );
        
        const complaint = result.rows[0];
        if (!complaint) return null;

        const responsesResult = await query(
            `SELECT * FROM responses WHERE complaint_id = $1 ORDER BY created_at DESC`,
            [id]
        );
        complaint.responses = responsesResult.rows;

        return complaint;
    },

    async findById(id) {
        return Complaint.getById(id);
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

const EnvironmentalData = {
    async create({ complaint_id, soil_type, rainfall_mm, wind_speed_kmh, temperature_c, humidity_percent, elevation_m, proximity_to_water_bodies_m }) {
        const result = await query(
            `INSERT INTO environmental_data (complaint_id, soil_type, rainfall_mm, wind_speed_kmh, temperature_c, humidity_percent, elevation_m, proximity_to_water_bodies_m)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [complaint_id, soil_type, rainfall_mm, wind_speed_kmh, temperature_c, humidity_percent, elevation_m, proximity_to_water_bodies_m]
        );
        return result.rows[0];
    }
};

module.exports = { Complaint, Response, EnvironmentalData };
