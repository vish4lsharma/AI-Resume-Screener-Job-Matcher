const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'backend/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Apply for job
router.post('/apply', auth, upload.single('resume'), (req, res) => {
    if (req.user.user_type !== 'candidate') {
        return res.status(403).json({ error: 'Only candidates can apply' });
    }

    const { job_id } = req.body;
    const candidate_id = req.user.id;
    const resume_path = req.file ? req.file.path : null;

    // Check if already applied
    db.query('SELECT * FROM applications WHERE job_id = ? AND candidate_id = ?', 
        [job_id, candidate_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Already applied for this job' });
        }

        // Calculate match score (simplified)
        const match_score = Math.floor(Math.random() * 100); 

        const query = `
            INSERT INTO applications (job_id, candidate_id, resume_path, match_score) 
            VALUES (?, ?, ?, ?)
        `;

        db.query(query, [job_id, candidate_id, resume_path, match_score], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to apply' });
            }
            res.status(201).json({ message: 'Application submitted successfully' });
        });
    });
});

// Get candidate applications
router.get('/my-applications', auth, (req, res) => {
    if (req.user.user_type !== 'candidate') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
        SELECT a.*, j.title, j.company, j.location, j.salary 
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id 
        WHERE a.candidate_id = ? 
        ORDER BY a.applied_date DESC
    `;

    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get applications for HR jobs
router.get('/job-applications/:jobId', auth, (req, res) => {
    if (req.user.user_type !== 'hr') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const jobId = req.params.jobId;
    
    const query = `
        SELECT a.*, u.full_name, u.email, u.phone, cp.skills, cp.experience_years 
        FROM applications a 
        JOIN users u ON a.candidate_id = u.id 
        LEFT JOIN candidate_profiles cp ON u.id = cp.user_id 
        WHERE a.job_id = ? 
        ORDER BY a.match_score DESC
    `;

    db.query(query, [jobId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Update application status
router.put('/update-status/:applicationId', auth, (req, res) => {
    if (req.user.user_type !== 'hr') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { status } = req.body;
    const applicationId = req.params.applicationId;

    const query = 'UPDATE applications SET status = ? WHERE id = ?';

    db.query(query, [status, applicationId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Application status updated successfully' });
    });
});

module.exports = router;
