// backend/src/routes/complaints.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { callMLService } = require('../services/mlService');

// Submit complaint
router.post('/submit', upload.array('images', 5), async (req, res) => {
    const { title, description, issue_type, latitude, longitude } = req.body;
    const images = req.files;
    
    // 1. Save complaint to database
    const complaint = await Complaint.create({
        title,
        description,
        issue_type,
        latitude,
        longitude,
        images: images.map(img => img.path),
        status: 'pending'
    });
    
    // 2. Call ML service for priority scoring
    const mlData = {
        latitude,
        longitude,
        issue_type,
        timestamp: new Date().toISOString()
    };
    
    const priorityScore = await callMLService(mlData);
    
    // 3. Update complaint with priority score
    complaint.priority_score = priorityScore;
    await complaint.save();
    
    res.status(201).json({
        success: true,
        data: complaint,
        priority_score: priorityScore
    });
});

// Get complaints with sorting
router.get('/list', async (req, res) => {
    const { sort_by = 'priority', status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    
    let sortCriteria = {};
    if (sort_by === 'priority') {
        sortCriteria = { priority_score: -1, created_at: -1 };
    } else if (sort_by === 'recent') {
        sortCriteria = { created_at: -1 };
    }
    
    const complaints = await Complaint.find(query)
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(limit);
    
    res.json({
        success: true,
        data: complaints,
        page,
        total: await Complaint.countDocuments(query)
    });
});

// Government response
router.post('/:id/respond', authMiddleware, async (req, res) => {
    const { action_taken, images } = req.body;
    const { id } = req.params;
    
    const response = await Response.create({
        complaint_id: id,
        officer_id: req.user.id,
        action_taken,
        image_urls: images
    });
    
    // Update complaint status
    await Complaint.findByIdAndUpdate(id, {
        status: 'resolved',
        updated_at: new Date()
    });
    
    res.json({
        success: true,
        data: response
    });
});