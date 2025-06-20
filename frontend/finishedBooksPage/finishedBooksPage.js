// FUNCȚII DE LOGIN ȘI UI (identice cu currentlyReadingPage.js)
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
            addDashboardDropdown();

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

        const loginButton = document.querySelector('.login-btn');
        if (loginButton) {
            loginButton.textContent = 'Login';
            loginButton.onclick = () => openLogin();
        }

        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.remove();
        }

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
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        loginButton.innerHTML = user.username + ' <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>';

        loginButton.onclick = () => toggleUserMenu();

        if (!document.querySelector('.user-dropdown')) {
            const userDropdown = document.createElement('div');
            userDropdown.className = 'user-dropdown';
            userDropdown.innerHTML = '<a href="#" id="profile-link">Edit Profile</a><a href="#" id="notifications-link">Notifications</a><a href="#" id="settings-link">Settings</a><a href="#" onclick="logout()">Logout</a>';
            loginButton.parentNode.appendChild(userDropdown);
            setupNavigationLinks();
        }
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

// FUNCȚII PENTRU ÎNCĂRCAREA CĂRȚILOR UTILIZATORULUI
async function loadUserBooks() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            displayMessage('Please login to view your finished books.');
            return;
        }

        const response = await fetch(`http://localhost:9000/backend/api/get_user_books.php?user_id=${user.user_id}&status=finished`);
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
      </div>`;
        return;
    }

    booksContainer.innerHTML = books.map(book => `
    <article class="book-card-item">
      <div class="book-placeholder">📚</div>
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">${book.author}</p>
      <p class="book-year">${book.publication_year || 'N/A'}</p>
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

async function submitReview(bookId) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            alert('Please login first');
            return;
        }

        const review = document.getElementById(`review-${bookId}`).value.trim();
        const rating = document.getElementById(`rating-${bookId}`).value;

        if (!review && !rating) {
            alert('Please add a review or select a rating.');
            return;
        }

        const response = await fetch('http://localhost:9000/backend/api/update_review_rating.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId,
                review,
                rating: rating ? parseInt(rating) : null
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Review submitted successfully!');
            if (typeof loadUserBooks === 'function') {
                loadUserBooks();
            }
        } else {
            alert('Error submitting review: ' + (data.error || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Network error. Please try again.');
    }
}


function displayMessage(message) {
    const booksContainer = document.querySelector('.book-cards-container') ||
        document.querySelector('#finishedBooksContainer');

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

function navigateToCommunity() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        window.location.href = '/frontend/communityPage/communityPage.html';
    } else {
        window.location.href = '/frontend/noCommunityPage/noCommunityPage.html';
    }
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        updateUIAfterLogin(user);
        addDashboardDropdown();
        loadUserBooks();
    } else {
        displayMessage('Please login to view your finished books.');
    }
});

document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    const loginButton = document.querySelector('.login-btn');

    if (dropdown && loginButton && !loginButton.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

window.addEventListener('storage', function(e) {
    if (e.key === 'bookStatusUpdated') {
        setTimeout(() => {
            loadUserBooks();
        }, 500);
    }
});