//  VERIFICARE AUTENTIFICARE
async function checkAuthBackend() {
    try {
        const response = await fetch('../../backend/auth/check_auth.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            sessionStorage.removeItem('jwt_token');
            window.location.href = '../authPage/authPage.html';
            return false;
        }

        const text = await response.text();
        console.log('Response text from backend:', text);

        // Încearcă să parsezi JSON doar dacă textul nu este gol
        const data = text ? JSON.parse(text) : null;
        return data && data.success;
    } catch (error) {
        console.error('Auth check failed:', error);
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
        return false;
    }
}
document.addEventListener('DOMContentLoaded', async function() {
    if (!isUserLoggedIn()) {
        window.location.href = '../authPage/authPage.html';
        return;
    }
    // Verifică și cu backend dacă tokenul e valid
    const valid = await checkAuthBackend();
    if (!valid) return;
    initializeCreateGroupPage();
});

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
        window.location.href = '../authPage/authPage.html';
        return;
    }

    return response;
}

// INIȚIALIZARE PAGINĂ
function initializeCreateGroupPage() {
    updateNavigation();
    setupAfterLoginNavigation();
    setCategory('Books');
    console.log(`Welcome to Create Group page, ${getCurrentUser().username}!`);
}

// LOGOUT
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
        window.location.href = '../authPage/authPage.html';
    }
}

// =FUNCȚIE PENTRU SALVAREA GRUPULUI
async function saveGroup(event) {
    event.preventDefault();

    const button = event.target;
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Creating...';

    try {
        const groupName = document.getElementById('group-name').value.trim();
        const groupDescription = document.getElementById('group-description').value.trim();
        const minAge = document.getElementById('min-age').value;
        const maxAge = document.getElementById('max-age').value;
        const isPublic = document.getElementById('public-group').checked;

        const selectedGenres = [];
        const genreCheckboxes = document.querySelectorAll('input[name="genres"]:checked');
        genreCheckboxes.forEach(checkbox => {
            selectedGenres.push(checkbox.value);
        });

        if (!groupName) {
            alert('Please enter a group name');
            return;
        }

        if (!groupDescription) {
            alert('Please enter a group description');
            return;
        }

        if (selectedGenres.length === 0) {
            alert('Please select at least one genre');
            return;
        }

        const user = getCurrentUser();
        if (!user || !user.user_id) {
            alert('You must be logged in to create a group');
            return;
        }

        const extendedDescription = `${groupDescription}

Preferred Genres: ${selectedGenres.join(', ')}
${minAge || maxAge ? `Age Range: ${minAge || 'No min'} - ${maxAge || 'No max'}` : ''}`;

        const response = await authenticatedFetch('/backend/community/create_groups.php', {
            method: 'POST',
            body: JSON.stringify({
                name: groupName,
                description: extendedDescription,
                user_id: user.user_id,
                is_private: !isPublic
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Group created successfully!');
            window.location.href = '../communityPage/communityPage.html';
        } else {
            alert('Error creating group: ' + (result.error || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.');
        handleAuthError(error);
    } finally {
        button.disabled = false;
        button.textContent = 'Save Changes';
    }
}

// GESTIONARE ERORI AUTENTIFICARE
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}




function setupAfterLoginNavigation() {
    const notificationsLink = document.querySelector('a[href="#notifications"]');
    const settingsLink = document.querySelector('a[href="#settings"]');
    const signoutLink = document.querySelector('a[href="#signout"]');

    const currentlyReadingLink = document.querySelector('a[href="../currentlyReadingPage/currentlyReadingPage.html"]');
    const wantToReadLink = document.querySelector('a[href="../wantToReadPage/wantToReadPage.html"]');
    const finishedBooksLink = document.querySelector('a[href="../finishedBooksPage/finishedBooksPage.html"]');
    const readingStatsLink = document.querySelector('a[href="../readingStatsPage/readingStatsPage.html"]');

    if (currentlyReadingLink) {
        currentlyReadingLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../currentlyReadingPage/currentlyReadingPage.html';
        });
    }

    if (wantToReadLink) {
        wantToReadLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../wantToReadPage/wantToReadPage.html';
        });
    }

    if (finishedBooksLink) {
        finishedBooksLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../finishedBooksPage/finishedBooksPage.html';
        });
    }

    if (readingStatsLink) {
        readingStatsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../readingStatsPage/readingStatsPage.html';
        });
    }

    if (notificationsLink) {
        notificationsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../notificationsPage/notificationsPage.html';
        });
    }

    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../settingsPage/settingsPage.html';
        });
    }

    if (signoutLink) {
        signoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
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

function navigateToCommunity() {
    const user = getCurrentUser();

    if (user && user.username) {
        window.location.href = '../communityPage/communityPage.html';
    } else {
        window.location.href = '../noCommunityPage/noCommunityPage.html';
    }
}

// FUNCȚII PENTRU SEARCH POPUP
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

    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
        resetToBooks();
    }
}

function resetToBooks() {
    setCategory('Books');
}

function setCategory(category) {
    document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));
    document.querySelector(`[onclick="setCategory('${category}')"]`).classList.add('active');
    const popularList = document.getElementById('popularList');
    popularList.innerHTML = data[category].map(item => `<div>${item}</div>`).join('');
}

// FUNCȚII PENTRU ANIMAȚII CARDS
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

// EVENT LISTENERS
document.addEventListener('click', (e) => {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');
    if (!popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});

// ===== FUNCȚII CARE NU MAI SUNT NECESARE
// function openLogin() {
//     window.location.href = '../authPage/authPage.html';
// }