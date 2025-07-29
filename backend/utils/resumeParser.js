
/**

 * @param {string} resumeText - Resume text (from PDF, DOC, etc.)
 * @returns {Object} - Parsed fields/keywords
 */
function parseResume(resumeText) {
    if (!resumeText || typeof resumeText !== 'string') {
        return {
            name: '',
            email: '',
            skills: [],
            experience: ''
        };
    }

    
    const SKILLS_DB = [
        'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C#', 'HTML', 'CSS',
        'SQL', 'MongoDB', 'Express', 'AWS', 'Docker', 'Figma', 'Tableau', 'Git'
    ];

    // Extract email
    const email = (resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || '';

    // Extract name (first line, if formatted, else empty string)
    const lines = resumeText.split('\n').map(s => s.trim()).filter(Boolean);
    const name = lines[0] || '';

    // Skill matching (case-insensitive)
    const skills = SKILLS_DB.filter(skill =>
        resumeText.toLowerCase().includes(skill.toLowerCase())
    );

    // Extract experience (looks for "X years" or "X+ years")
    let experience = '';
    const expMatch = resumeText.match(/(\d+(\+)?\s*years?)/i);
    if (expMatch) experience = expMatch[0];

    return {
        name,
        email,
        skills,
        experience
    };
}

module.exports = { parseResume };
