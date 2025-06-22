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

document.addEventListener('click', (e) => {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');
    if (!popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});

// Configurează navigarea pentru pagina after login
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    setupAfterLoginNavigation();
    setCategory('Books');
});

function setupAfterLoginNavigation() {
    // Link-urile existente...
    const notificationsLink = document.querySelector('a[href="#notifications"]');
    const settingsLink = document.querySelector('a[href="#settings"]');
    const signoutLink = document.querySelector('a[href="#signout"]');

    // ADAUGĂ PENTRU DASHBOARD:
    const currentlyReadingLink = document.querySelector('a[href="../currentlyReadingPage/currentlyReadingPage.html"]');
    const wantToReadLink = document.querySelector('a[href="../wantToReadPage/wantToReadPage.html"]');
    const finishedBooksLink = document.querySelector('a[href="../finishedBooksPage/finishedBooksPage.html"]');
    const readingStatsLink = document.querySelector('a[href="../readingStatsPage/readingStatsPage.html"]');

    // Event listeners pentru dashboard
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

    // Restul funcțiilor existente...
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

async function logout() {
    try {
        const response = await fetch('../backend/auth/logout.php', {
            method: 'POST',
            credentials: 'include'
        });

        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../index.html';
    }
}

// Funcție pentru salvarea grupului
async function saveGroup(event) {
    event.preventDefault();

    // Previne multiple submissions
    const button = event.target;
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Creating...';

    try {
        // Colectează datele din formular
        const groupName = document.getElementById('group-name').value.trim();
        const groupDescription = document.getElementById('group-description').value.trim();
        const minAge = document.getElementById('min-age').value;
        const maxAge = document.getElementById('max-age').value;
        const isPublic = document.getElementById('public-group').checked;

        // Colectează genurile selectate
        const selectedGenres = [];
        const genreCheckboxes = document.querySelectorAll('input[name="genres"]:checked');
        genreCheckboxes.forEach(checkbox => {
            selectedGenres.push(checkbox.value);
        });

        // Validare de bază
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

        // Verifică dacă utilizatorul este logat
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            alert('You must be logged in to create a group');
            return;
        }

        // Construiește descrierea extinsă cu toate detaliile
        const extendedDescription = `${groupDescription}

Preferred Genres: ${selectedGenres.join(', ')}
${minAge || maxAge ? `Age Range: ${minAge || 'No min'} - ${maxAge || 'No max'}` : ''}`;

        const response = await fetch('../../backend/community/create_groups.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
    } finally {
        // Re-enable butonul
        button.disabled = false;
        button.textContent = 'Save Changes';
    }
}

// Actualizează interfața în funcție de starea de login
function updateNavigation() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const profileDropdown = document.getElementById('profileDropdown');
    const loginButton = document.getElementById('loginButton');
    const profileUsername = document.getElementById('profileUsername');

    if (isLoggedIn === 'true' && user.username) {
        // Utilizator logat - arată profilul
        if (profileDropdown) profileDropdown.style.display = 'block';
        if (loginButton) loginButton.style.display = 'none';
        if (profileUsername) profileUsername.textContent = user.username;
    } else {
        // Utilizator nelogat - arată login
        if (profileDropdown) profileDropdown.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

// Navigare către Community
function navigateToCommunity() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
        window.location.href = '../communityPage/communityPage.html';
    } else {
        window.location.href = '../noCommunityPage/noCommunityPage.html';
    }
}

// Funcție pentru deschiderea login-ului
function openLogin() {
    // Redirect către pagina de login sau deschide modal
    window.location.href = '../loginPage/loginPage.html';
}