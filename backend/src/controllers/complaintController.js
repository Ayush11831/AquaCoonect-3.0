// backend/src/controllers/complaintController.js
const { Complaint, EnvironmentalData } = require('../models/complaints');
const { callMLService } = require('../services/mlService');

async function submitComplaint(req, res) {
    try {
        const { title, description, issue_type, latitude, longitude, address } = req.body;
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

        // 4. Store environmental data if available.
        if (ml.environmental_data) {
            await EnvironmentalData.create({
                complaint_id: complaint.id,
                ...ml.environmental_data
            });
        }

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

async function getComplaint(req, res) {
    try {
        const { id } = req.params;
        const complaint = await Complaint.getById(id);
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }
        return res.json({ success: true, data: complaint });
    } catch (err) {
        console.error('getComplaint error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch complaint' });
    }
}

async function getMyComplaints(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        const { rows, total, totalPages, hasMore } = await Complaint.listByUser(req.user.id, { 
            page: parsedPage, 
            limit: parsedLimit 
        });
        return res.json({
            success: true,
            data: rows,
            page: parsedPage,
            total,
            totalPages,
            hasMore
        });
    } catch (err) {
        console.error('getMyComplaints error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch user complaints' });
    }
}

async function listComplaints(req, res) {
    try {
        const { sort_by = 'priority', status, page = 1, limit = 20 } = req.query;
        const { rows, total, totalPages, hasMore } = await Complaint.list({
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
            totalPages,
            hasMore
        });
    } catch (err) {
        console.error('listComplaints error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
    }
}

async function respondToComplaint(req, res) {
    try {
        const { id } = req.params;
        const { action_taken } = req.body;
        const images = (req.files || []).map((img) => img.path);

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }
        if (complaint.status === 'resolved') {
            return res.status(409).json({ success: false, error: 'Complaint is already resolved' });
        }

        const response = await Complaint.respond({
            complaintId: id,
            officerId: req.user.id,
            actionTaken: action_taken,
            imageUrls: images,
        });

        return res.json({ success: true, data: response });
    } catch (err) {
        console.error('respondToComplaint error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to record response' });
    }
}

async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        const updated = await Complaint.updateStatus(id, status);
        return res.json({ success: true, data: updated });
    } catch (err) {
        console.error('updateStatus error:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to update status' });
    }
}

module.exports = { submitComplaint, getComplaint, getMyComplaints, listComplaints, respondToComplaint, updateStatus };
