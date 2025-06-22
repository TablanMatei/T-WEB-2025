// FUNCȚII DE LOGIN ȘI UI
function openLogin() {
    const loginOverlay = document.getElementById("loginOverlay");
    if (loginOverlay) {
        loginOverlay.style.display = "flex";
    }
    document.body.classList.add("blur-effect");
}

function closeLogin() {
    const loginOverlay = document.getElementById("loginOverlay");
    if (loginOverlay) {
        loginOverlay.style.display = "none";
    }
    document.body.classList.remove("blur-effect");
}

// Funcție minimală pentru prevenirea XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitButton.textContent;

    if (!username || !password) {
        showLoginMessage('Please fill in all fields', 'error');
        return false;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
        const response = await fetch('/backend/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true');

            showLoginMessage('Login successful!', 'success');
            updateUIAfterLogin(result.user);
            updateNavigation();

            setTimeout(() => {
                closeLogin();
                clearLoginForm();
                loadUserBooks();
            }, 1000);

        } else {
            showLoginMessage(result.error || 'Login failed. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showLoginMessage('Network error. Please check your connection.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }

    return false;
}

function showLoginMessage(message, type) {
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message ${type}`;
    messageDiv.textContent = message;

    const loginContainer = document.querySelector('.login-container');
    const form = document.getElementById('loginForm');
    loginContainer.insertBefore(messageDiv, form);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function clearLoginForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';

    const message = document.querySelector('.login-message');
    if (message) {
        message.remove();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        fetch('http://localhost:9000/backend/auth/logout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }).catch(error => console.log('Logout backend call failed:', error));

        alert('You have been logged out successfully!');
        window.location.reload();
    }
}

function updateUIAfterLogin(user) {
    // Nu mai folosim vechiul sistem cu login button
    // Noul sistem folosește profileDropdown și loginButton separate
    updateNavigation();
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

// FUNCȚII PENTRU ÎNCĂRCAREA CĂRȚILOR UTILIZATORULUI
async function loadUserBooks() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            displayMessage('Please login to view your books.');
            return;
        }

        const response = await fetch(`http://localhost:9000/backend/api/get_user_books.php?user_id=${user.user_id}&status=want_to_read`);
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
    }
}

function displayUserBooks(books) {
    const booksContainer = document.querySelector('.want-book-cards-container');

    if (!booksContainer) {
        console.error('Books container not found');
        return;
    }

    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-books-message">
                <h3>No books in your "Want to Read" list yet!</h3>
                <p>Start adding books from the <a href="../genresPage/genresPage.html">Genres page</a> or <a href="../mainPage/index.html">search for books</a>.</p>
            </div>
        `;
        return;
    }

    booksContainer.innerHTML = books.map(book => `
        <div class="want-book-card">
            <div class="book-placeholder">📚</div>
            <div class="want-book-title">${sanitizeHtml(book.title)}</div>
            <div class="want-book-author">${sanitizeHtml(book.author)}</div>
            <div class="book-actions">
                <button onclick="changeBookStatus(${book.book_id}, 'currently_reading')" class="btn-reading">Start Reading</button>
                <button onclick="changeBookStatus(${book.book_id}, 'finished')" class="btn-finished">Mark as Finished</button>
                <button onclick="removeFromList(${book.book_id})" class="btn-remove">Remove</button>
            </div>
        </div>
    `).join('');
}

function displayMessage(message) {
    const booksContainer = document.querySelector('.want-book-cards-container');
    if (booksContainer) {
        booksContainer.innerHTML = `<div class="message">${message}</div>`;
    }
}

// Funcții pentru schimbarea statusului
async function changeBookStatus(bookId, newStatus) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            alert('Please login first');
            return;
        }

        const response = await fetch('http://localhost:9000/backend/api/update_book_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId,
                status: newStatus
            })
        });

        const data = await response.json();

        if (data.success) {
            loadUserBooks();
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem('bookStatusUpdated', Date.now());
            }
        } else {
            alert('Error updating book status: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error changing book status:', error);
        alert('Network error. Please try again.');
    }
}

async function removeFromList(bookId) {
    if (!confirm('Are you sure you want to remove this book from your list?')) {
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            alert('Please login first');
            return;
        }

        const response = await fetch('http://localhost:9000/backend/api/remove_book_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId
            })
        });

        const data = await response.json();

        if (data.success) {
            loadUserBooks();
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem('bookStatusUpdated', Date.now());
            }
        } else {
            alert('Error removing book: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error removing book:', error);
        alert('Network error. Please try again.');
    }
}

// Funcții pentru search popup
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

// Funcție pentru navigarea la Community
function navigateToCommunity() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        window.location.href = '/frontend/communityPage/communityPage.html';
    } else {
        window.location.href = '/frontend/noCommunityPage/noCommunityPage.html';
    }
}

// Funcție pentru căutarea cărților "Want to Read"
function searchWantToRead() {
    const searchInput = document.getElementById('wantSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }

    console.log('Searching for:', searchTerm);
    // Implementează căutarea în backend
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    setCategory('Books');

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        loadUserBooks();
    } else {
        displayMessage('Please login to view your "Want to Read" books.');
    }
});

// Închide search popup când se dă click în afara lui
document.addEventListener('click', (e) => {
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