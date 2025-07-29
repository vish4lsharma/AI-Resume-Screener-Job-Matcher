const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all jobs
router.get('/', (req, res) => {
    const query = `
        SELECT j.*, u.full_name as hr_name 
        FROM jobs j 
        JOIN users u ON j.hr_id = u.id 
        ORDER BY j.posted_date DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Create job (HR only)
router.post('/', auth, (req, res) => {
    if (req.user.user_type !== 'hr') {
        return res.status(403).json({ error: 'Only HR can post jobs' });
    }

    const { title, company, location, salary, description, requirements, skills_required } = req.body;
    const hr_id = req.user.id;

    const query = `
        INSERT INTO jobs (hr_id, title, company, location, salary, description, requirements, skills_required) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [hr_id, title, company, location, salary, description, requirements, skills_required], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create job' });
        }
        res.status(201).json({ message: 'Job posted successfully', job_id: result.insertId });
    });
});

// Get jobs by HR
router.get('/my-jobs', auth, (req, res) => {
    if (req.user.user_type !== 'hr') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const query = 'SELECT * FROM jobs WHERE hr_id = ? ORDER BY posted_date DESC';
    
    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get matched jobs for candidate based on skills
router.get('/matched/:candidateId', auth, (req, res) => {
    const candidateId = req.params.candidateId;
    
    // Get candidate skills
    db.query('SELECT skills FROM candidate_profiles WHERE user_id = ?', [candidateId], (err, profileResults) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (profileResults.length === 0) {
            return res.json([]);
        }

        const candidateSkills = profileResults[0].skills ? profileResults[0].skills.split(',') : [];
        
        // Get all jobs and calculate match scores
        db.query('SELECT * FROM jobs ORDER BY posted_date DESC', (err, jobResults) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const matchedJobs = jobResults.map(job => {
                const jobSkills = job.skills_required ? job.skills_required.split(',') : [];
                const matchScore = calculateMatchScore(candidateSkills, jobSkills);
                return { ...job, match_score: matchScore };
            });

            // Sort by match score
            matchedJobs.sort((a, b) => b.match_score - a.match_score);
            res.json(matchedJobs);
        });
    });
});

function calculateMatchScore(candidateSkills, jobSkills) {
    if (jobSkills.length === 0) return 0;
    
    let matches = 0;
    jobSkills.forEach(skill => {
        if (candidateSkills.some(cSkill => 
            cSkill.toLowerCase().trim().includes(skill.toLowerCase().trim()) ||
            skill.toLowerCase().trim().includes(cSkill.toLowerCase().trim())
        )) {
            matches++;
        }
    });
    
    return (matches / jobSkills.length * 100).toFixed(2);
}

module.exports = router;
