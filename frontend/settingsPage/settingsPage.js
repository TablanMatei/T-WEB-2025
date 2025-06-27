//  VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsPage();
});

function initializeSettingsPage() {
    if (!isUserLoggedIn()) {
        window.location.href = '../authPage/authPage.html';
        return;
    }

    updateNavigation();
    updateSettingsNavigation();
    setCategory('Books');
    console.log('Settings page initialized');
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
        window.location.href = '../authPage/authPage.html';
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

//  SEARCH POPUP
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

function setCategory(category, targetElement = null) {
    currentCategory = category;

    const categories = document.querySelectorAll('.category-list span');
    categories.forEach(cat => cat.classList.remove('active'));

    if (targetElement) {
        targetElement.classList.add('active');
    } else {
        const categoryElement = Array.from(categories).find(cat => cat.textContent.trim() === category);
        if (categoryElement) {
            categoryElement.classList.add('active');
        }
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

//  NAVIGARE
function updateSettingsNavigation() {
    const editProfileLink = document.querySelector('a[href*="editProfilePage"]');
    if (editProfileLink) {
        editProfileLink.href = '/frontend/settingsPage/editProfilePage/editProfilePage.html';
    }

    const settingsLinks = document.querySelectorAll('a[href="#settings"]');
    settingsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/frontend/settingsPage/settingsPage.html';
        });
    });

    const notificationsLinks = document.querySelectorAll('a[href="#notifications"]');
    notificationsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/frontend/notificationsPage/notificationsPage.html';
        });
    });

    const signoutLinks = document.querySelectorAll('a[href="#signout"]');
    signoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
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
    if (isUserLoggedIn()) {
        window.location.href = '/frontend/communityPage/communityPage.html';
    } else {
        window.location.href = '/frontend/noCommunityPage/noCommunityPage.html';
    }
}

// EXPORT DATE
async function exportData(format) {
    const user = getCurrentUser();

    if (!user || !user.user_id) {
        alert('Authentication error. Please login again.');
        window.location.href = '../authPage/authPage.html';
        return;
    }

    const button = document.querySelector(`.${format}-btn`);
    if (!button) return;

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '⏳ Exporting...';

    try {
        const response = await authenticatedFetch(`/backend/export/export_user_data.php?format=${format}&user_id=${user.user_id}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `user_data_${user.username}_${new Date().toISOString().split('T')[0]}.${format}`;

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showExportMessage(` ${format.toUpperCase()} export completed successfully!`, 'success');

    } catch (error) {
        console.error('Export error:', error);
        showExportMessage(` Export failed: ${error.message}`, 'error');
        handleAuthError(error);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function showExportMessage(message, type) {
    const existingMessage = document.querySelector('.export-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `export-message ${type}`;
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
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 4000);
}

// GESTIONARE ERORI
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}

// XSS protection
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