// VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    if (!isUserLoggedIn()) {
        window.location.href = '../authPage/authPage.html';
        return;
    }

    initializeFinishedBooksPage();
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

// Request-uri autentificate
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
function initializeFinishedBooksPage() {
    const user = getCurrentUser();

    // Actualizează UI cu datele utilizatorului
    updateUIAfterLogin(user);

    // Adaugă dropdown-ul dashboard
    addDashboardDropdown();

    // Încarcă cărțile utilizatorului
    loadUserBooks();

    // Inițializează funcționalitățile de search
    initializeSearchFunctionality();

    console.log(`Welcome to Finished Books page, ${user.username}!`);
}

function initializeSearchFunctionality() {
    // Funcționalitate pentru search popup
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('click', function() {
            togglePopup();
        });
    }

    setCategory('Books');
}

// LOGOUT MODIFICAT PENTRU JWT
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

        // Șterge token-ul și redirecționează
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}

// FUNCȚII PENTRU ÎNCĂRCAREA CĂRȚILOR
async function loadUserBooks() {
    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) {
            displayMessage('Please login to view your finished books.');
            return;
        }

        const response = await authenticatedFetch(`/backend/api/get_user_books.php?user_id=${user.user_id}&status=finished`);
        const data = await response.json();

        if (data.success) {
            displayUserBooks(data.books);
        } else {
            console.error('Error loading user books:', data.error);
            displayMessage('Error loading your books.');
        }
    } catch (error) {
        console.error('Error fetching user books:', error);
        displayMessage('Network error. Please try again.');
        handleAuthError(error);
    }
}

// FUNCȚII PENTRU SCHIMBAREA STATUSULUI
async function changeBookStatus(bookId, newStatus) {
    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) {
            alert('Please login first');
            return;
        }

        const response = await authenticatedFetch('/backend/api/update_book_status.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId,
                status: newStatus
            })
        });

        const data = await response.json();

        if (data.success) {
            loadUserBooks();

            // Notifică alte pagini despre actualizare
            // if (typeof(Storage) !== "undefined") {
            //     sessionStorage.setItem('bookStatusUpdated', Date.now());
            // }

            // Afișează mesaj de succes
            showStatusMessage(`Book moved to ${getStatusDisplayName(newStatus)}!`, 'success');
        } else {
            alert('Error updating book status: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error changing book status:', error);
        alert('Network error. Please try again.');
        handleAuthError(error);
    }
}

async function removeFromList(bookId) {
    if (!confirm('Are you sure you want to remove this book from your list?')) {
        return;
    }

    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) {
            alert('Please login first');
            return;
        }

        const response = await authenticatedFetch('/backend/api/remove_book_status.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId
            })
        });

        const data = await response.json();

        if (data.success) {
            loadUserBooks();

            // Notifică alte pagini despre actualizare
            if (typeof(Storage) !== "undefined") {
                sessionStorage.setItem('bookStatusUpdated', Date.now());
            }

            showStatusMessage('Book removed from your list!', 'success');
        } else {
            alert('Error removing book: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error removing book:', error);
        alert('Network error. Please try again.');
        handleAuthError(error);
    }
}

// FUNCȚII PENTRU REVIEW ȘI RATING
async function submitReview(bookId) {
    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) {
            alert('Please login first');
            return;
        }

        const review = document.getElementById(`review-${bookId}`).value.trim();
        const rating = document.getElementById(`rating-${bookId}`).value;

        if (!review && !rating) {
            alert('Please add a review or select a rating.');
            return;
        }

        const response = await authenticatedFetch('/backend/api/update_review_rating.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId,
                review,
                rating: rating ? parseInt(rating) : null
            })
        });

        const data = await response.json();

        if (data.success) {
            showStatusMessage('Review submitted successfully!', 'success');
            loadUserBooks();
        } else {
            alert('Error submitting review: ' + (data.error || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Network error. Please try again.');
        handleAuthError(error);
    }
}

// HELPER FUNCTIONS
function getStatusDisplayName(status) {
    const statusMap = {
        'want_to_read': 'Want to Read',
        'currently_reading': 'Currently Reading',
        'finished': 'Finished Books'
    };
    return statusMap[status] || status;
}

function showStatusMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        ${type === 'success' ? 'background-color: #4CAF50;' : 'background-color: #f44336;'}
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// GESTIONARE ERORI AUTENTIFICARE
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}

// ACTUALIZARE UI DUPĂ LOGIN
function updateUIAfterLogin(user) {
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        loginButton.innerHTML = sanitizeHtml(user.username) + ' <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>';

        loginButton.onclick = () => toggleUserMenu();

        if (!document.querySelector('.user-dropdown')) {
            const userDropdown = document.createElement('div');
            userDropdown.className = 'user-dropdown';

            // Adaugă link Admin Panel dacă utilizatorul este admin
            let adminLink = '';
            if (user.role === 'admin') {
                adminLink = '<a href="/frontend/adminPanel/adminPanel.html" id="admin-link">Admin Panel</a>';
            }

            userDropdown.innerHTML = '<a href="#" id="profile-link">Edit Profile</a><a href="#" id="notifications-link">Notifications</a><a href="#" id="settings-link">Settings</a>' + adminLink + '<a href="#" onclick="logout()">Logout</a>';
            loginButton.parentNode.appendChild(userDropdown);
            setupNavigationLinks();
        }
    }
}

// FUNCȚII COMMUNITY
function navigateToCommunity() {
    const user = getCurrentUser();

    if (user && user.username) {
        window.location.href = '/frontend/communityPage/communityPage.html';
    } else {
        window.location.href = '/frontend/noCommunityPage/noCommunityPage.html';
    }
}





function addDashboardDropdown() {
    const navList = document.getElementById('navList');
    if (!navList) return;

    const dropdownHTML = `
    <li class="dropdown">
        <a href="#dashboard" class="nav-btn">DASHBOARD
            <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"></path>
            </svg>
        </a>
        <ul class="dropdown-menu">
            <li>
                <a href="../currentlyReadingPage/currentlyReadingPage.html">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Currently Reading
                </a>
            </li>
            <li>
                <a href="../wantToReadPage/wantToReadPage.html">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20l9-5-9-5-9 5 9 5z"></path>
                        <path d="M12 12v8"></path>
                        <path d="M12 12L3 7"></path>
                        <path d="M12 12l9-5"></path>
                    </svg>
                    Want to Read
                </a>
            </li>
            <li>
                <a href="finishedBooksPage.html">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Finished Books
                </a>
            </li>
        </ul>
    </li>
    `;

    const discoverItem = navList.querySelector('li.dropdown');
    if (discoverItem) {
        discoverItem.insertAdjacentHTML('afterend', dropdownHTML);
    } else {
        navList.insertAdjacentHTML('beforeend', dropdownHTML);
    }
}

function displayUserBooks(books) {
    const booksContainer = document.querySelector('.book-cards-container') ||
        document.querySelector('#finishedBooksContainer');

    if (!booksContainer) {
        console.error('Books container not found');
        return;
    }

    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-books-message">
                <h3>No finished books yet!</h3>
                <p>Complete reading books from the <a href="../genresPage/genresPage.html">Genres page</a> or <a href="../mainPage/index.html">search for books</a>.</p>
            </div>
        `;
        return;
    }

    booksContainer.innerHTML = books.map(book => `
        <article class="book-card-item">
            <div class="book-placeholder">📚</div>
            <h3 class="book-title">${sanitizeHtml(book.title)}</h3>
            <p class="book-author">${sanitizeHtml(book.author)}</p>
            
            <p class="book-finished">Finished: ${new Date(book.date_added).toLocaleDateString()}</p>
            ${book.rating ? `<div class="book-rating">${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}</div>` : ''}
            
            <div class="book-actions">
                <button onclick="changeBookStatus(${book.book_id}, 'currently_reading')" class="btn-reading">Read Again</button>
                <button onclick="changeBookStatus(${book.book_id}, 'want_to_read')" class="btn-want">Move to Want to Read</button>
                <button onclick="removeFromList(${book.book_id})" class="btn-remove">Remove</button>
                
                <div class="review-section">
                    <textarea placeholder="Write a short review..." id="review-${book.book_id}">${book.review || ''}</textarea>
                    <select id="rating-${book.book_id}">
                        <option value="">Rate this book</option>
                        ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${book.rating == n ? 'selected' : ''}>${n} ★</option>`).join('')}
                    </select>
                    <button onclick="submitReview(${book.book_id})">Submit Review</button>
                </div>
            </div>
        </article>
    `).join('');
}

function displayMessage(message) {
    const booksContainer = document.querySelector('.book-cards-container') ||
        document.querySelector('#finishedBooksContainer');

    if (booksContainer) {
        booksContainer.innerHTML = `<div class="message">${message}</div>`;
    }
}

function setupNavigationLinks() {
    setTimeout(() => {
        const profileLink = document.getElementById('profile-link');
        const settingsLink = document.getElementById('settings-link');
        const notificationsLink = document.getElementById('notifications-link');

        if (profileLink) {
            profileLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '/frontend/settingsPage/editProfilePage/editProfilePage.html';
            });
        }

        if (settingsLink) {
            settingsLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '/frontend/settingsPage/settingsPage.html';
            });
        }

        if (notificationsLink) {
            notificationsLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '/frontend/notificationsPage/notificationsPage.html';
            });
        }
    }, 100);
}

function toggleUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Funcții pentru search popup
function togglePopup() {
    const popup = document.getElementById('searchPopup');
    if (popup) {
        if (popup.style.display === 'none' || popup.style.display === '') {
            popup.style.display = 'block';
        } else {
            popup.style.display = 'none';
            resetToBooks();
        }
    }
}

function resetToBooks() {
    setCategory('Books');
}

function setCategory(category, element) {
    const data = {
        Books: ['The Great Gatsby', '1984', 'To Kill a Mockingbird', 'Pride and Prejudice', 'Harry Potter'],
        Authors: ['George Orwell', 'Jane Austen', 'J.K. Rowling', 'F. Scott Fitzgerald', 'Homer'],
        Users: ['booklover123', 'readingaddict', 'fictionfan', 'classicreader', 'fantasyfan'],
        Publishers: ['Penguin Books', 'HarperCollins', 'Bloomsbury', 'Random House', 'Simon & Schuster'],
    };

    document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));
    if (element) element.classList.add('active');

    const popularList = document.getElementById('popularList');
    if (popularList && data[category]) {
        popularList.innerHTML = data[category].map(item => `<div>${item}</div>`).join('');
    }
}

// Funcții pentru animații cards
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

// Funcție minimală pentru prevenirea XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Actualizează interfața în funcție de starea de login
function updateNavigation() {
    const user = getCurrentUser();

    const profileDropdown = document.getElementById('profileDropdown');
    const loginButton = document.getElementById('loginButton');
    const profileUsername = document.getElementById('profileUsername');

    if (user && user.username) {
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

// Event listeners
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    const loginButton = document.querySelector('.login-btn');

    if (dropdown && loginButton && !loginButton.contains(e.target)) {
        dropdown.style.display = 'none';
    }

    // Închide search popup când se dă click în afara lui
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');
    if (popup && searchContainer && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});

// Ascultă pentru actualizări de status din alte pagini
window.addEventListener('storage', function(e) {
    if (e.key === 'bookStatusUpdated') {
        setTimeout(() => {
            loadUserBooks();
        }, 500);
    }
});

// Funcții care nu mai sunt necesare
// function openLogin() {
//     window.location.href = '../authPage/authPage.html';
// }
//
// function closeLogin() {
//     // Nu mai e necesară
// }
//
// function handleLogin() {
//     // Nu mai e necesară - se face în authPage
// }
//
// function showLoginMessage() {
//     // Nu mai e necesară
// }
//
// function clearLoginForm() {
//     // Nu mai e necesară
// }