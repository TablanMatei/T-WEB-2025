function toggleAnimation() {
  const container = document.getElementById('cards-container');
  if (container) {
    container.classList.toggle('paused');
  }
}
function scrollLeft() {
    const container = document.getElementById('cards-container');
    container.scrollBy({
        left: -220,
        behavior: 'smooth'
    });
}

function scrollRight() {
    const container = document.getElementById('cards-container');
    container.scrollBy({
        left: 220,
        behavior: 'smooth'
    });
}

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
    
    // Deschide sau închide popup-ul
    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
        resetToBooks(); // Resetează la Books când se închide
    }
}

// Resetează la Books
function resetToBooks() {
    setCategory('Books');
}

function setCategory(category) {
        document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));
        document.querySelector(`[onclick="setCategory('${category}')"]`).classList.add('active');
        const popularList = document.getElementById('popularList');
        popularList.innerHTML = data[category].map(item => `<div>${item}</div>`).join('');
    }

// Închide popup-ul dacă faci clic în afara lui
document.addEventListener('click', (e) => {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');
    if (!popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});
window.onload = () => setCategory('Books');




// Verifică autentificarea
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        updateUIAfterLogin(user);
        loadUserProfileData();
    } else {
        window.location.href = '/frontend/mainPage/index.html';
    }

    setupProfileForm();
});

// Încarcă datele utilizatorului în formular
async function loadUserProfileData() {
    try {
        // Folosește același pattern ca în search
        const response = await fetch('http://localhost:9000/backend/api/get_user_profile.php');
        const result = await response.json();

        if (result.success && result.user) {
            populateProfileForm(result.user);
        } else {
            showProfileMessage('Failed to load profile data', 'error');
        }
    } catch (error) {
        console.error('Failed to load profile data:', error);
        showProfileMessage('Network error loading profile', 'error');
    }
}

// Populează formularul
function populateProfileForm(user) {
    document.getElementById('username').value = user.username || '';
    document.getElementById('name').value = user.real_name || '';
    document.getElementById('bio').value = user.description || '';
    document.getElementById('location').value = user.location || '';
    document.getElementById('dob').value = user.birthdate || '';
    document.getElementById('pronouns').value = user.pronouns || '';
    document.getElementById('website').value = user.website || '';

    // Actualizează imaginea dacă există
    if (user.profile_picture) {
        const avatarImg = document.querySelector('.avatar-img');
        if (avatarImg) {
            avatarImg.src = user.profile_picture;
        }
    }
}

// Setup form (similar cu signup.js)
function setupProfileForm() {
    const form = document.querySelector('.edit-profile-form');
    if (form) {
        form.addEventListener('submit', handleProfileSubmit);
    }
}

// Handle submit
async function handleProfileSubmit(event) {
    event.preventDefault();

    const submitButton = document.querySelector('.btn-primary');
    const originalText = submitButton.textContent;

    // Disable button during submission (exact ca în signup)
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    // Colectează datele (similar cu signup.js)
    const profileData = {
        username: document.getElementById('username').value.trim(),
        real_name: document.getElementById('name').value.trim(),
        description: document.getElementById('bio').value.trim(),
        location: document.getElementById('location').value.trim(),
        birthdate: document.getElementById('dob').value,
        pronouns: document.getElementById('pronouns').value.trim(),
        website: document.getElementById('website').value.trim()
    };

    try {

        const response = await fetch('/backend/api/update_profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showProfileMessage("Profile updated successfully!", "success");

            // Actualizează localStorage
            if (result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
            }

            // Redirect înapoi la settings după 2 secunde (ca în signup)
            setTimeout(() => {
                window.location.href = '/frontend/settingsPage/settingsPage.html';
            }, 2000);

        } else {
            showProfileMessage(result.error || 'Failed to update profile', 'error');
        }

    } catch (error) {
        console.error('Profile update error:', error);
        showProfileMessage('Network error. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Funcție pentru mesaje
function showProfileMessage(message, type) {
    const existingMessage = document.querySelector('.profile-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `profile-message ${type}`;
    messageDiv.textContent = message;

    const section = document.querySelector('.edit-profile-section');
    section.insertBefore(messageDiv, section.children[2]);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

