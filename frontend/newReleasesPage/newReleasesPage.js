// VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    initializeNewReleasesPage();
});

function initializeNewReleasesPage() {
    updateNavigation();
    loadNewReleases();
    setupAfterLoginNavigation();
    setCategory('Books');
    console.log('New Releases page initialized');
}

//  FUNCȚII JWT
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


let currentCategory = 'Books';
let allNewReleases = [];


// ÎNCĂRCARE NEW RELEASES
async function loadNewReleases() {
    const container = document.getElementById('newReleasesContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading new releases...</div>';

    try {
        // Calculează data de acum 6 luni pentru "new releases"
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const cutoffYear = sixMonthsAgo.getFullYear();

        const response = await fetch(`/backend/api/search.php?category=Books&limit=50&min_year=${cutoffYear}`);
        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<div class="error-message">Error: ${sanitizeHtml(data.error || 'Unknown error')}</div>`;
            return;
        }

        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<div class="no-results">No new releases found.</div>';
            return;
        }

        // Sortează după anul publicării (cele mai noi primul)
        const sortedBooks = data.data.sort((a, b) => (b.publication_year || 0) - (a.publication_year || 0));

        allNewReleases = sortedBooks;
        displayNewReleases(sortedBooks);

    } catch (error) {
        console.error('Error loading new releases:', error);
        container.innerHTML = `<div class="error-message">Error loading new releases: ${sanitizeHtml(error.message)}</div>`;
    }
}

function displayNewReleases(books) {
    const container = document.getElementById('newReleasesContainer');
    if (!container) return;

    if (books.length === 0) {
        container.innerHTML = '<div class="no-results">No new releases found.</div>';
        return;
    }

    container.innerHTML = books.map((book, index) => `
        <article class="book-card new-release" data-index="${index}">
            <div class="new-badge">NEW</div>
            <div class="book-placeholder">📚</div>
            <div class="book-details">
                <h3 class="book-title">${sanitizeHtml(book.title)}</h3>
                <p class="book-author">by ${sanitizeHtml(book.author || 'Unknown Author')}</p>
                <div class="book-meta">
                    <span class="book-year">${book.publication_year || 'N/A'}</span>
                    <span class="book-genre">${sanitizeHtml(book.genre || 'Unknown Genre')}</span>
                </div>
                <div class="book-publisher">
                    <span class="publisher-label">Publisher:</span>
                    <span class="publisher-name">${sanitizeHtml(book.publisher || 'Unknown')}</span>
                </div>
            </div>
            <div class="book-actions">
                <div class="book-status-container">
                    <button class="book-status-btn" onclick="toggleStatusSlider(this, ${book.id})">
                        <span class="status-text">Add to List</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="status-slider">
                        <div class="status-option" data-status="want_to_read" onclick="setBookStatus(${book.id}, 'want_to_read', this)">
                            <span class="status-icon">📚</span>Want to Read
                        </div>
                        <div class="status-option" data-status="currently_reading" onclick="setBookStatus(${book.id}, 'currently_reading', this)">
                            <span class="status-icon">📖</span>Currently Reading
                        </div>
                        <div class="status-option" data-status="finished" onclick="setBookStatus(${book.id}, 'finished', this)">
                            <span class="status-icon">✅</span>Finished
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `).join('');
}

//  STATUS CĂRȚI
function toggleStatusSlider(button, bookId) {
    const slider = button.nextElementSibling;
    const allSliders = document.querySelectorAll('.status-slider');

    allSliders.forEach(s => {
        if (s !== slider) {
            s.classList.remove('show');
        }
    });

    slider.classList.toggle('show');
    loadCurrentBookStatus(bookId, slider);
}

async function setBookStatus(bookId, status, optionElement) {
    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) {
            alert('Please login to add books to your lists');
            return;
        }

        const response = await authenticatedFetch('/backend/api/update_book_status.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: user.user_id,
                book_id: bookId,
                status: status
            })
        });

        const data = await response.json();

        if (data.success) {
            const slider = optionElement.closest('.status-slider');
            const button = slider.previousElementSibling;

            slider.querySelectorAll('.status-option').forEach(option => {
                option.classList.remove('selected');
            });

            optionElement.classList.add('selected');
            updateButtonText(button, status);
            slider.classList.remove('show');
            showStatusMessage('Book added to your list!', 'success');

        } else {
            showStatusMessage(data.error || 'Error updating book status', 'error');
        }

    } catch (error) {
        console.error('Error setting book status:', error);
        showStatusMessage('Network error. Please try again.', 'error');
        handleAuthError(error);
    }
}

async function loadCurrentBookStatus(bookId, slider) {
    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) return;

        const response = await authenticatedFetch(`/backend/api/get_book_status.php?user_id=${user.user_id}&book_id=${bookId}`);
        const data = await response.json();

        if (data.success && data.status) {
            const currentOption = slider.querySelector(`[data-status="${data.status}"]`);
            if (currentOption) {
                currentOption.classList.add('selected');
            }

            const button = slider.previousElementSibling;
            updateButtonText(button, data.status);
        }
    } catch (error) {
        console.error('Error loading book status:', error);
        handleAuthError(error);
    }
}

function updateButtonText(button, status) {
    const statusText = button.querySelector('.status-text');
    const statusMap = {
        'want_to_read': 'Want to Read',
        'currently_reading': 'Reading',
        'finished': 'Finished'
    };

    statusText.textContent = statusMap[status] || 'Add to List';

    if (status) {
        button.classList.add('active');
    } else {
        button.classList.remove('active');
    }
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
    setTimeout(() => messageDiv.remove(), 3000);
}

//  GESTIONARE ERORI
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}

//  NAVIGARE
function setupAfterLoginNavigation() {
    const notificationsLink = document.querySelector('a[href="#notifications"]');
    const settingsLink = document.querySelector('a[href="#settings"]');
    const signoutLink = document.querySelector('a[href="#signout"]');

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

//  ANIMAȚII CARDS
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
            loadPopularItems(currentCategory);
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
    currentCategory = category;

    document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));

    const categoryElement = document.querySelector(`[onclick="setCategory('${category}')"]`);
    if (categoryElement) {
        categoryElement.classList.add('active');
    }

    loadPopularItems(category);
}

async function loadPopularItems(category) {
    try {
        const response = await fetch(`/backend/api/search.php?category=${category}&limit=10`);
        const data = await response.json();

        if (data.success) {
            displayPopularItems(data.data, category);
        } else {
            console.error('Error loading popular items:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayPopularItems(items, category) {
    const popularList = document.getElementById('popularList');

    if (!items || items.length === 0) {
        popularList.innerHTML = '<div class="no-results">No popular items found</div>';
        return;
    }

    let html = `<h4>Popular ${category}</h4><div class="popular-items">`;

    items.forEach(item => {
        if (category === 'Books') {
            html += `
                <div class="popular-item" onclick="selectBook(${item.id})">
                    <div class="item-placeholder">📚</div>
                    <div class="item-info">
                        <div class="item-title">${sanitizeHtml(item.title)}</div>
                        <div class="item-subtitle">${sanitizeHtml(item.author)} (${item.publication_year || 'N/A'})</div>
                        <div class="item-publisher">Publisher: ${sanitizeHtml(item.publisher)}</div>
                    </div>
                </div>
            `;
        } else if (category === 'Authors') {
            html += `
                <div class="popular-item" onclick="selectAuthor(${item.id})">
                    <div class="item-placeholder">👤</div>
                    <div class="item-info">
                        <div class="item-title">${sanitizeHtml(item.name)}</div>
                        <div class="item-subtitle">${sanitizeHtml(item.nationality || 'Unknown nationality')} • Born ${item.birth_year || 'Unknown'}</div>
                        <div class="item-description">${sanitizeHtml(item.description || 'No description available.')}</div>
                        <div class="item-books">${item.book_count} books</div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    popularList.innerHTML = html;
}

function selectBook(bookId) {
    console.log('Selected book:', bookId);
    alert(`Selected book ID: ${bookId}. Feature coming soon!`);
}

function selectAuthor(authorId) {
    console.log('Selected author:', authorId);
    alert(`Selected author ID: ${authorId}. Feature coming soon!`);
}

//  FILTRARE NEW RELEASES
function filterNewReleases() {
    const yearFilter = document.getElementById('yearFilter');
    const genreFilter = document.getElementById('genreFilter');
    const sortOrder = document.getElementById('sortOrder');

    if (!yearFilter || !genreFilter || !sortOrder) return;

    let filteredBooks = [...allNewReleases];

    // Filtrează după an
    if (yearFilter.value) {
        filteredBooks = filteredBooks.filter(book => book.publication_year == yearFilter.value);
    }

    // Filtrează după gen
    if (genreFilter.value) {
        filteredBooks = filteredBooks.filter(book => book.genre === genreFilter.value);
    }

    // Sortează
    filteredBooks.sort((a, b) => {
        switch (sortOrder.value) {
            case 'year_desc':
                return (b.publication_year || 0) - (a.publication_year || 0);
            case 'year_asc':
                return (a.publication_year || 0) - (b.publication_year || 0);
            case 'title_asc':
                return (a.title || '').localeCompare(b.title || '');
            case 'author_asc':
                return (a.author || '').localeCompare(b.author || '');
            default:
                return 0;
        }
    });

    displayNewReleases(filteredBooks);
}

// XSS Protectiom
function sanitizeHtml(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

//  EVENT LISTENERS
document.addEventListener('click', function(e) {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');

    if (popup && searchContainer && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }

    if (!e.target.closest('.book-status-container')) {
        document.querySelectorAll('.status-slider').forEach(slider => {
            slider.classList.remove('show');
        });
    }
});

// Search event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');

    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
});

async function performSearch() {
    const searchInput = document.querySelector('.search-container input');
    const query = searchInput.value.trim();

    if (query.length < 2) {
        loadPopularItems(currentCategory);
        return;
    }

    try {
        const response = await fetch('/backend/api/search.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                category: currentCategory,
                limit: 20,
                offset: 0
            })
        });

        const data = await response.json();

        if (data.success) {
            displaySearchResults(data.data, currentCategory);
        } else {
            console.error('Search error:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displaySearchResults(results, category) {
    const popularList = document.getElementById('popularList');

    if (results.length === 0) {
        popularList.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    let html = `<h4>Search Results (${results.length})</h4><div class="search-results">`;

    results.forEach(item => {
        if (category === 'Books') {
            html += `
                <div class="search-result-item" onclick="selectBook(${item.id})">
                    <div class="item-placeholder">📚</div>
                    <div class="item-info">
                        <div class="item-title">${sanitizeHtml(item.title)}</div>
                        <div class="item-subtitle">${sanitizeHtml(item.author)} (${item.publication_year || 'N/A'})</div>
                        <div class="item-publisher">Publisher: ${sanitizeHtml(item.publisher)}</div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    popularList.innerHTML = html;
}