// backend/src/routes/complaints.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
    submitComplaint,
    listComplaints,
    respondToComplaint,
} = require('../controllers/complaintController');

// Submit a complaint (citizen). Up to 5 photos.
router.post('/submit', upload.array('images', 5), submitComplaint);

// List complaints, sorted by ML priority or recency.
router.get('/list', listComplaints);

// Government officer records the action taken and resolves the complaint.
router.post('/:id/respond', authMiddleware, requireRole('officer', 'admin'), respondToComplaint);

module.exports = router;
