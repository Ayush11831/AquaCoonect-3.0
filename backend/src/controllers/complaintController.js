// backend/src/controllers/complaintController.js
const { Complaint, Response } = require('../models/complaints');
const { callMLService } = require('../services/mlService');

async function submitComplaint(req, res) {
    try {
        const { title, description, issue_type, latitude, longitude, address } = req.body;

        if (!title || !issue_type || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: 'title, issue_type, latitude and longitude are required',
            });
        }

        const images = (req.files || []).map((img) => img.path);

        // 1. Persist the complaint.
        const complaint = await Complaint.create({
            user_id: req.user ? req.user.id : null,
            title,
            description,
            issue_type,
            latitude,
            longitude,
            address,
            image_urls: images,
        });

        // 2. Score priority via the ML microservice (best-effort).
        const ml = await callMLService({
            latitude: Number(latitude),
            longitude: Number(longitude),
            issue_type,
            timestamp: new Date().toISOString(),
        });

        // 3. Store the score.
        const updated = await Complaint.setPriority(complaint.id, ml.priority_score);

        return res.status(201).json({
            success: true,
            data: updated,
            priority_score: ml.priority_score,
            risk_level: ml.risk_level,
        });
    } catch (err) {
        console.error('submitComplaint error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to submit complaint' });
    }
}

async function listComplaints(req, res) {
    try {
        const { sort_by = 'priority', status, page = 1, limit = 20 } = req.query;
        const { rows, total } = await Complaint.list({
            status,
            sortBy: sort_by,
            page: parseInt(page, 10),
            limit: Math.min(parseInt(limit, 10) || 20, 100),
        });

        return res.json({
            success: true,
            data: rows,
            page: parseInt(page, 10),
            total,
        });
    } catch (err) {
        console.error('listComplaints error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
    }
}

async function respondToComplaint(req, res) {
    try {
        const { id } = req.params;
        const { action_taken, images = [] } = req.body;

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        const response = await Response.create({
            complaint_id: id,
            officer_id: req.user.id,
            action_taken,
            image_urls: images,
        });

        await Complaint.updateStatus(id, 'resolved');

        return res.json({ success: true, data: response });
    } catch (err) {
        console.error('respondToComplaint error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to record response' });
    }
}

module.exports = { submitComplaint, listComplaints, respondToComplaint };
