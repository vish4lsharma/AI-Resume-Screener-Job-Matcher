
function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type}`;
    alertElement.classList.remove('hidden');
    
    setTimeout(() => {
        alertElement.classList.add('hidden');
    }, 5000);
}

// Update navigation for logged-in user
function updateNavForLoggedInUser(user) {
    const navLinks = document.getElementById('navLinks');
    const profileIcon = document.getElementById('profileIcon');
    const userInitials = document.getElementById('userInitials');
    
    if (navLinks) {
        navLinks.innerHTML = `
            <li><a href="${user.user_type === 'candidate' ? 'candidate-dashboard.html' : 'hr-dashboard.html'}">Dashboard</a></li>
            <li><a href="#" onclick="logout()">Logout</a></li>
        `;
    }
    
    if (profileIcon && userInitials) {
        const initials = user.full_name.split(' ').map(name => name[0]).join('').toUpperCase();
        userInitials.textContent = initials;
        profileIcon.classList.remove('hidden');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    return { token, user };
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// API call helper
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(endpoint, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API call failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// File upload helper
function createFileFormData(formElement) {
    const formData = new FormData();
    
    for (const [key, value] of new FormData(formElement)) {
        formData.append(key, value);
    }
    
    return formData;
}

// Skill matching utility
function calculateSkillMatch(candidateSkills, jobSkills) {
    if (!candidateSkills || !jobSkills) return 0;
    
    const candidate = candidateSkills.toLowerCase().split(',').map(s => s.trim());
    const job = jobSkills.toLowerCase().split(',').map(s => s.trim());
    
    let matches = 0;
    job.forEach(skill => {
        if (candidate.some(cSkill => cSkill.includes(skill) || skill.includes(cSkill))) {
            matches++;
        }
    });
    
    return Math.round((matches / job.length) * 100);
}

// Form validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// Local storage helpers
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to storage:', error);
    }
}

function getFromStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Failed to get from storage:', error);
        return null;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to remove from storage:', error);
    }
}
