// VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    initializeEditProfilePage();
});

function initializeEditProfilePage() {
    if (!isUserLoggedIn()) {
        window.location.href = '../../authPage/authPage.html';
        return;
    }

    updateNavigation();
    loadUserProfileData();
    setupProfileForm();
    setCategory('Books');
    console.log('Edit Profile page initialized');
}

// FUNCȚII JWT
function isUserLoggedIn() {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) return false;

    try {
        const payload = parseJWT(token);
        return payload.exp > Math.floor(Date.now() / 1000);
    } catch (error) {
        sessionStorage.removeItem('jwt_token');
        return false;
    }
}

function parseJWT(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}

function getCurrentUser() {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) return null;

    try {
        return parseJWT(token);
    } catch (error) {
        return null;
    }
}

async function authenticatedFetch(url, options = {}) {
    const token = sessionStorage.getItem('jwt_token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 401) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../../authPage/authPage.html';
        return;
    }

    return response;
}

//  LOGOUT
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        const token = sessionStorage.getItem('jwt_token');

        if (token) {
            try {
                await authenticatedFetch('/backend/auth/logout.php', {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        sessionStorage.removeItem('jwt_token');
        window.location.href = '../../authPage/authPage.html';
    }
}

// ANIMAȚII CARDS
function toggleAnimation() {
    const container = document.getElementById('cards-container');
    if (container) {
        container.classList.toggle('paused');
    }
}

function scrollLeft() {
    const container = document.getElementById('cards-container');
    if (container) {
        container.scrollBy({
            left: -220,
            behavior: 'smooth'
        });
    }
}

function scrollRight() {
    const container = document.getElementById('cards-container');
    if (container) {
        container.scrollBy({
            left: 220,
            behavior: 'smooth'
        });
    }
}

// SEARCH POPUP
const data = {
    Books: ['The Great Gatsby', '1984', 'To Kill a Mockingbird', 'Pride and Prejudice', 'Harry Potter'],
    Authors: ['George Orwell', 'Jane Austen', 'J.K. Rowling', 'F. Scott Fitzgerald', 'Homer'],
    Series: ['Harry Potter', 'The Lord of the Rings', 'A Song of Ice and Fire', 'Percy Jackson', 'Narnia'],
    Characters: ['Sherlock Holmes', 'Harry Potter', 'Elizabeth Bennet', 'Frodo Baggins', 'Hermione Granger'],
    Users: ['booklover123', 'readingaddict', 'fictionfan', 'classicreader', 'fantasyfan'],
    Publishers: ['Penguin Books', 'HarperCollins', 'Bloomsbury', 'Random House', 'Simon & Schuster'],
};

function togglePopup() {
    const popup = document.getElementById('searchPopup');

    if (popup) {
        if (popup.style.display === 'none' || popup.style.display === '') {
            popup.style.display = 'block';
            loadPopularItems('Books');
        } else {
            popup.style.display = 'none';
            resetToBooks();
        }
    }
}

function resetToBooks() {
    setCategory('Books');
}

function setCategory(category) {
    const categoryElements = document.querySelectorAll('.category-list span');
    categoryElements.forEach(span => span.classList.remove('active'));

    const targetElement = document.querySelector(`[onclick="setCategory('${category}')"]`);
    if (targetElement) {
        targetElement.classList.add('active');
    }

    const popularList = document.getElementById('popularList');
    if (popularList && data[category]) {
        popularList.innerHTML = data[category].map(item => `<div class="popular-item">${sanitizeHtml(item)}</div>`).join('');
    }
}

//  ÎNCĂRCARE PROFIL
async function loadUserProfileData() {
    try {
        const user = getCurrentUser();

        if (!user || !user.user_id) {
            showProfileMessage('Authentication error. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = '../../authPage/authPage.html';
            }, 2000);
            return;
        }

        const response = await authenticatedFetch('/backend/api/get_user_profile.php', {
            method: 'POST',
            body: JSON.stringify({ user_id: user.user_id })
        });

        const result = await response.json();
        console.log('Profile data response:', result);

        if (result.success && result.user) {
            populateProfileForm(result.user);
            updateUIAfterLogin(result.user);
        } else {
            console.error('Profile load error:', result.error);
            showProfileMessage('Failed to load profile data: ' + (result.error || 'Unknown error'), 'error');
        }

    } catch (error) {
        console.error('Failed to load profile data:', error);
        showProfileMessage('Network error loading profile', 'error');
        handleAuthError(error);
    }
}

function populateProfileForm(user) {
    const fields = {
        'username': user.username,
        'name': user.real_name,
        'bio': user.description,
        'location': user.location,
        'dob': user.birthdate,
        'pronouns': user.pronouns,
        'website': user.website
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value || '';
        }
    });

    // Actualizează imaginea de profil
    if (user.profile_picture) {
        const avatarImg = document.querySelector('.avatar-img');
        if (avatarImg) {
            avatarImg.src = user.profile_picture;
        }
    }
}

//  SETUP FORMULAR
function setupProfileForm() {
    const form = document.querySelector('.edit-profile-form');
    if (form) {
        form.addEventListener('submit', handleProfileSubmit);
    }

    // Setup pentru preview imagine
    const imageInput = document.getElementById('profileImage');
    if (imageInput) {
        imageInput.addEventListener('change', previewImage);
    }
}

async function handleProfileSubmit(event) {
    event.preventDefault();

    const submitButton = document.querySelector('.btn-primary');
    if (!submitButton) return;

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    const user = getCurrentUser();

    if (!user || !user.user_id) {
        showProfileMessage('Authentication error. Please login again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }

    // Validare de bază
    const username = document.getElementById('username')?.value.trim();
    const name = document.getElementById('name')?.value.trim();

    if (!username || username.length < 3) {
        showProfileMessage('Username must be at least 3 characters', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }

    if (!name || name.length < 2) {
        showProfileMessage('Name must be at least 2 characters', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }

    const profileData = {
        user_id: user.user_id,
        username: sanitizeInput(username),
        real_name: sanitizeInput(name),
        description: sanitizeInput(document.getElementById('bio')?.value.trim() || ''),
        location: sanitizeInput(document.getElementById('location')?.value.trim() || ''),
        birthdate: document.getElementById('dob')?.value || null,
        pronouns: sanitizeInput(document.getElementById('pronouns')?.value.trim() || ''),
        website: sanitizeInput(document.getElementById('website')?.value.trim() || '')
    };

    console.log('Sending profile data:', profileData);

    try {
        const response = await authenticatedFetch('/backend/api/update_profile.php', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });

        const result = await response.json();
        console.log('Update response:', result);

        if (response.ok && result.success) {
            showProfileMessage("Profile updated successfully!", "success");

            // Redirect înapoi la settings după 2 secunde
            setTimeout(() => {
                window.location.href = '../settingsPage.html';
            }, 2000);

        } else {
            showProfileMessage(result.error || 'Failed to update profile', 'error');
        }

    } catch (error) {
        console.error('Profile update error:', error);
        showProfileMessage('Network error. Please try again.', 'error');
        handleAuthError(error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// UI UPDATES
function updateUIAfterLogin(user) {
    const usernameElements = document.querySelectorAll('.username-display');
    usernameElements.forEach(element => {
        element.textContent = user.username || 'User';
    });

    if (user.profile_picture) {
        const profileImages = document.querySelectorAll('.profile-image, .avatar-img');
        profileImages.forEach(img => {
            img.src = user.profile_picture;
        });
    }

    const realNameElements = document.querySelectorAll('.real-name-display');
    realNameElements.forEach(element => {
        element.textContent = user.real_name || user.username || 'User';
    });

    console.log('UI updated for user:', user.username);
}

function updateNavigation() {
    const user = getCurrentUser();
    const profileDropdown = document.getElementById('profileDropdown');
    const loginButton = document.getElementById('loginButton');
    const profileUsername = document.getElementById('profileUsername');

    if (user && user.username) {
        if (profileDropdown) profileDropdown.style.display = 'block';
        if (loginButton) loginButton.style.display = 'none';
        if (profileUsername) profileUsername.textContent = user.username;
    } else {
        if (profileDropdown) profileDropdown.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

//  PREVIEW IMAGINE
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        // Verifică tipul fișierului
        if (!file.type.startsWith('image/')) {
            showProfileMessage('Please select a valid image file', 'error');
            return;
        }

        // Verifică dimensiunea (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showProfileMessage('Image size must be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarImg = document.querySelector('.avatar-img');
            if (avatarImg) {
                avatarImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

//  MESAJE
function showProfileMessage(message, type) {
    const existingMessage = document.querySelector('.profile-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `profile-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        padding: 12px 16px;
        margin: 10px 0;
        border-radius: 5px;
        font-weight: 500;
        ${type === 'success' ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        ${type === 'error' ? 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
    `;

    const section = document.querySelector('.edit-profile-section');
    if (section && section.children.length > 2) {
        section.insertBefore(messageDiv, section.children[2]);
    } else if (section) {
        section.appendChild(messageDiv);
    }

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

//  GESTIONARE ERORI
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../../authPage/authPage.html';
    }
}

// XSS
function sanitizeHtml(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function sanitizeInput(input) {
    if (!input) return '';
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .trim();
}

// EVENT LISTENERS
document.addEventListener('click', function(e) {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');

    if (popup && searchContainer && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});

// Inițializare la încărcare
window.onload = () => setCategory('Books');