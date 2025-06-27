// VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    initializePopularAuthorsPage();
});

function initializePopularAuthorsPage() {
    updateNavigation();
    loadPopularAuthors();
    setupAfterLoginNavigation();
    setCategory('Books');
    console.log('Popular Authors page initialized');
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

// ÎNCĂRCARE AUTORI POPULARI
async function loadPopularAuthors() {
    const container = document.getElementById('popularAuthorsContainer');
    container.innerHTML = '<div class="loading-spinner">Loading popular authors...</div>';

    try {
        const response = await fetch('/backend/api/get_popular_authors.php');
        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<div class="error-message">Error loading authors: ${sanitizeHtml(data.error || 'Unknown error')}</div>`;
            return;
        }

        if (data.authors.length === 0) {
            container.innerHTML = '<div class="no-results">No popular authors found.</div>';
            return;
        }

        container.innerHTML = data.authors.map(author => `
            <div class="author-card">
                <div class="author-header">
                    <h3>${sanitizeHtml(author.name)}</h3>
                    <div class="author-stats">
                        <span class="rating-badge">${author.avg_rating} ★</span>
                        <span class="ratings-count">${author.total_ratings} ratings</span>
                    </div>
                </div>
                <div class="author-actions">
                    <button class="show-books-btn" onclick="toggleBooks(${author.author_id}, this)">
                        Show Books
                    </button>
                </div>
                <div class="author-books-dropdown" id="books-${author.author_id}" style="display: none;">
                    <div class="loading-books">Loading...</div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading authors:', error);
        container.innerHTML = '<div class="error-message">Failed to load popular authors. Please try again later.</div>';
    }
}

async function toggleBooks(authorId, button) {
    const container = document.getElementById(`books-${authorId}`);
    const isVisible = container.style.display === 'block';

    if (isVisible) {
        container.style.display = 'none';
        button.textContent = 'Show Books';
        button.classList.remove('active');
        return;
    }

    container.style.display = 'block';
    button.textContent = 'Hide Books';
    button.classList.add('active');
    container.innerHTML = '<div class="loading-books">Loading books...</div>';

    try {
        const response = await fetch(`/backend/api/get_books_by_author.php?author_id=${authorId}&limit=10`);
        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<div class="error-message">Error: ${sanitizeHtml(data.error || 'Unknown error')}</div>`;
            return;
        }

        if (data.books.length === 0) {
            container.innerHTML = '<div class="no-books">No books found for this author.</div>';
            return;
        }

        container.innerHTML = data.books.map(book => `
            <div class="book-item">
                <div class="book-info">
                    <strong class="book-title">${sanitizeHtml(book.title)}</strong>
                    <span class="book-year">(${book.year || 'N/A'})</span>
                </div>
                <div class="book-details">
                    <span class="book-genre">Genre: ${sanitizeHtml(book.genre || 'Unknown')}</span>
                    <span class="book-rating">Rating: ${book.avg_rating ? book.avg_rating + ' ★' : 'N/A'}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading books:', error);
        container.innerHTML = '<div class="error-message">Failed to load books. Please try again.</div>';
    }
}

// NAVIGARE
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

function navigateToCommunity() {
    const user = getCurrentUser();

    if (user && user.username) {
        window.location.href = '../communityPage/communityPage.html';
    } else {
        window.location.href = '../noCommunityPage/noCommunityPage.html';
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

let currentCategory = 'Books';

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
        } else {
            html += `
                <div class="popular-item" onclick="searchByName('${sanitizeHtml(item.name)}', '${category}')">
                    <div class="item-info">
                        <div class="item-title">${sanitizeHtml(item.name)}</div>
                        <div class="item-subtitle">${item.book_count} books</div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    popularList.innerHTML = html;
}

//SEARCH FUNCTIONS
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
        } else if (category === 'Authors') {
            html += `
                <div class="search-result-item" onclick="selectAuthor(${item.id})">
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

function searchByName(name, category) {
    const searchInput = document.querySelector('.search-container input');
    searchInput.value = name;
    setCategory('Books');
    performSearch();
}


function sanitizeHtml(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}


// EVENT LISTENERS
document.addEventListener('click', (e) => {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');

    if (popup && searchContainer && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
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