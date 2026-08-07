// backend/src/routes/complaints.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
    validateSubmitComplaint,
    validateListComplaints,
    validateRespondToComplaint,
    validateUpdateStatus,
} = require('../middleware/validate');
const {
    submitComplaint,
    getComplaint,
    getMyComplaints,
    listComplaints,
    respondToComplaint,
    updateStatus,
} = require('../controllers/complaintController');

// Submit a complaint (citizen). Up to 5 photos.
// Upload middleware runs before validation so multipart fields are parsed.
router.post('/submit', upload.array('images', 5), ...validateSubmitComplaint, submitComplaint);

// Get a citizen's own complaints (must be authenticated).
router.get('/my/list', authMiddleware, getMyComplaints);

// List complaints, sorted by ML priority or recency.
router.get('/list', ...validateListComplaints, listComplaints);

// Get a single complaint by ID (with responses).
router.get('/:id', getComplaint);

// Government officer records the action taken and resolves the complaint.
router.post(
    '/:id/respond',
    authMiddleware,
    requireRole('officer', 'admin'),
    upload.array('images', 5),
    ...validateRespondToComplaint,
    respondToComplaint
);

// Update complaint status (officer/admin only — e.g. mark as in_progress).
router.patch(
    '/:id/status',
    authMiddleware,
    requireRole('officer', 'admin'),
    ...validateUpdateStatus,
    updateStatus
);

module.exports = router;
