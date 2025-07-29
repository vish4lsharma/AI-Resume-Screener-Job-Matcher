

/**
 * Calculates score
 * @param {string[]} candidateSkills - Array of candidate's skills
 * @param {string[]} jobSkills - Array of job's required skills
 * @returns {number} - Match percentage 
 */
function calculateSkillMatch(candidateSkills, jobSkills) {
    if (!candidateSkills || !jobSkills || jobSkills.length === 0) return 0;

    const matchedCount = jobSkills.filter(js =>
        candidateSkills.some(cs =>
            cs.trim().toLowerCase() === js.trim().toLowerCase()
        )
    ).length;

    return Math.round((matchedCount / jobSkills.length) * 100);
}

/**
 
 * @param {Object[]} jobs - Array of job objects { id, skills_required }
 * @param {string[]} candidateSkills - Skills from candidate profile or resume
 * @returns {Object[]} - Jobs with added match_score, sorted by score descending
 */
function matchJobsToCandidate(jobs, candidateSkills) {
    
    const skills = candidateSkills.map(s => s.trim().toLowerCase());

    return jobs.map(job => {
        const jobSkills = (job.skills_required || '')
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean);

        const score = calculateSkillMatch(skills, jobSkills);
        return { ...job, match_score: score };
    }).sort((a, b) => b.match_score - a.match_score);
}

module.exports = {
    calculateSkillMatch,
    matchJobsToCandidate
};
