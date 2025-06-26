// VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    // Verifică dacă utilizatorul e logat
    if (!isUserLoggedIn()) {
        window.location.href = '../authPage/authPage.html';
        return;
    }

    initializeGenresPage();
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
function initializeGenresPage() {
    const user = getCurrentUser();

    // Actualizează UI cu datele utilizatorului
    updateUIAfterLogin(user);

    // Inițializează funcționalitățile existente
    initializeSearchFunctionality();

    // Setează categoria default
    setCategory('Books');

    // Încarcă genurile de la backend
    loadGenresFromDatabase();

    console.log(`Welcome to Genres page, ${user.username}!`);
}

function initializeSearchFunctionality() {
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');

    if (searchInput && searchButton) {
        searchInput.addEventListener('input', performSearch);
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        searchInput.addEventListener('click', function() {
            togglePopup();
        });
    }
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

        // Șterge token-ul și redirecționează
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}

//ACTUALIZARE UI DUPĂ LOGIN
function updateUIAfterLogin(user) {
    console.log('updateUIAfterLogin called with:', user);

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

            userDropdown.innerHTML = '<a href="#" id="profile-link">Edit Profile</a><a href="#" id="settings-link">Settings</a>' + adminLink + '<a href="#" onclick="logout()">Logout</a>';
            loginButton.parentNode.appendChild(userDropdown);
            setupNavigationLinks();
        }
    }
}

// FUNCȚII BOOK STATUS
async function loadCurrentBookStatus(bookId, slider) {
    try {
        const user = getCurrentUser();
        if (!user || !user.user_id) return;

        const response = await authenticatedFetch(`/backend/api/get_book_status.php?user_id=${user.user_id}&book_id=${bookId}`);
        const data = await response.json();

        // Resetează selecțiile
        slider.querySelectorAll('.status-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Marchează statusul curent
        if (data.success && data.status) {
            const currentOption = slider.querySelector(`[data-status="${data.status}"]`);
            if (currentOption) {
                currentOption.classList.add('selected');
            }

            // Actualizează textul butonului
            const button = slider.previousElementSibling;
            updateButtonText(button, data.status);
        }
    } catch (error) {
        console.error('Error loading book status:', error);
        handleAuthError(error);
    }
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
            // Actualizează UI
            const slider = optionElement.closest('.status-slider');
            const button = slider.previousElementSibling;

            // Resetează selecțiile
            slider.querySelectorAll('.status-option').forEach(option => {
                option.classList.remove('selected');
            });

            // Marchează opțiunea selectată
            optionElement.classList.add('selected');

            // Actualizează textul butonului
            updateButtonText(button, status);

            // Închide slider-ul
            slider.classList.remove('show');

            // Afișează mesaj de succes
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

// FUNCȚII SEARCH
async function loadPopularItems(category) {
    try {
        const response = await authenticatedFetch(`/backend/api/search.php?category=${category}&limit=10`);
        const data = await response.json();

        if (data.success) {
            displayPopularItems(data.data, category);
        } else {
            console.error('Error loading popular items:', data.error);
        }
    } catch (error) {
        console.error('Error in loadPopularItems:', error);
        handleAuthError(error);
    }
}

async function performSearch() {
    const searchInput = document.querySelector('.search-container input');
    const query = searchInput.value.trim();

    if (query.length < 2) {
        loadPopularItems(currentCategory);
        return;
    }

    try {
        const response = await authenticatedFetch('/backend/api/search.php', {
            method: 'POST',
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
        console.error('Error in performSearch:', error);
        handleAuthError(error);
    }
}

// FUNCȚII GENRES
async function loadGenresFromDatabase() {
    try {
        const response = await authenticatedFetch('/backend/api/get_genres.php');
        const data = await response.json();

        if (data.success) {
            genresData = data.genres;
            updateGenresDisplay();
        } else {
            console.error('Error loading genres:', data.error);
        }
    } catch (error) {
        console.error('Error fetching genres:', error);
        handleAuthError(error);
    }
}

async function loadBooksForGenre(genre) {
    try {
        const url = `/backend/api/get_genres.php?genre=${encodeURIComponent(genre)}&limit=7`;
        const response = await authenticatedFetch(url);
        const data = await response.json();

        if (data.success) {
            return data.books;
        } else {
            console.error('Error loading books for genre:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error fetching books for genre:', error);
        handleAuthError(error);
        return [];
    }
}

// GESTIONARE ERORI AUTENTIFICARE
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
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

function openLogin() {
    // Această funcție nu mai e necesară - redirecționează la auth.html
    window.location.href = '../authPage/authPage.html';
}

function closeLogin() {
    // Nu mai e necesară
}

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

// Variabile globale pentru search
let currentCategory = 'Books';
let searchResults = [];
let genresData = {};

// Funcție minimală pentru prevenirea XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function togglePopup() {
    const popup = document.getElementById('searchPopup');
    const isVisible = popup.style.display !== 'none';

    if (isVisible) {
        popup.style.display = 'none';
    } else {
        popup.style.display = 'block';
        loadPopularItems(currentCategory);
    }
}

function resetToBooks() {
    setCategory('Books');
}

function setCategory(category, element) {
    currentCategory = category;

    // Update active category
    const categories = document.querySelectorAll('.category-list span');
    categories.forEach(cat => cat.classList.remove('active'));

    if (element) {
        element.classList.add('active');
    } else {
        categories.forEach(cat => {
            if (cat.textContent.trim() === category) {
                cat.classList.add('active');
            }
        });
    }

    loadPopularItems(category);
}

// Închide popup-ul dacă faci clic în afara lui
document.addEventListener('click', (e) => {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');
    if (popup && searchContainer && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});

function displayPopularItems(items, category) {
    const popularList = document.getElementById('popularList');
    if (!popularList) return;

    if (items.length === 0) {
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
                        <div class="item-title">${item.title}</div>
                        <div class="item-subtitle">${item.author} (${item.publication_year || 'N/A'})</div>
                        <div class="item-publisher">Publisher: ${item.publisher}</div>
                    </div>
                </div>
            `;
        } else if (category === 'Authors') {
            html += `
                <div class="popular-item" onclick="selectAuthor(${item.id})">
                    <div class="item-placeholder">👤</div>
                    <div class="item-info">
                        <div class="item-title">${item.name}</div>
                        <div class="item-subtitle">${item.nationality || 'Unknown nationality'} • Born ${item.birth_year || 'Unknown'}</div>
                        <div class="item-description">${item.description || 'No description available.'}</div>
                        <div class="item-books">${item.book_count} books</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="popular-item" onclick="searchByName('${item.name}', '${category}')">
                    <div class="item-info">
                        <div class="item-title">${item.name}</div>
                        <div class="item-subtitle">${item.book_count} books</div>
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
    if (!popularList) return;

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
                        <div class="item-title">${item.title}</div>
                        <div class="item-subtitle">${item.author} (${item.publication_year || 'N/A'})</div>
                        <div class="item-publisher">Publisher: ${item.publisher}</div>
                    </div>
                </div>
            `;
        } else if (category === 'Authors') {
            html += `
                <div class="search-result-item" onclick="selectAuthor(${item.id})">
                    <div class="item-placeholder">👤</div>
                    <div class="item-info">
                        <div class="item-title">${item.name}</div>
                        <div class="item-subtitle">${item.nationality || 'Unknown nationality'} • Born ${item.birth_year || 'Unknown'}</div>
                        <div class="item-description">${item.description || 'No description available.'}</div>
                        <div class="item-books">${item.book_count} books</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="search-result-item" onclick="searchByName('${item.name}', '${category}')">
                    <div class="item-info">
                        <div class="item-title">${item.name}</div>
                        <div class="item-subtitle">${item.book_count} books</div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    popularList.innerHTML = html;
}

function updateGenresDisplay() {
    const genresSection = document.querySelector('.genres-section');
    if (!genresSection || !genresData.length) return;

    // Elimină mesajul de loading
    const loadingMessage = genresSection.querySelector('.loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }

    // Sortează genurile după numărul de cărți (descrescător)
    const sortedGenres = genresData.sort((a, b) => b.book_count - a.book_count);

    // Limitează la primele 15 de genuri pentru performanță
    const topGenres = sortedGenres.slice(0, 15);

    // Creează blocurile pentru fiecare gen
    topGenres.forEach(genreData => {
        createGenreBlock(capitalizeFirst(genreData.genre_name), genreData);
    });
}

async function createGenreBlock(genreName, genreData) {
    const genresSection = document.querySelector('.genres-section');

    // Încarcă cărțile pentru acest gen
    const books = await loadBooksForGenre(genreData.genre_name);

    const genreBlock = document.createElement('div');
    genreBlock.className = 'genre-block';

    genreBlock.innerHTML = `
        <h3>${capitalizeFirst(genreName)} <span class="genre-count">(${genreData.book_count} books)</span></h3>
        <div class="genre-books" id="genre-${genreData.genre_name.replace(/\s+/g, '-')}">
            ${books.length > 0 ? books.map(book => createBookItem(book)).join('') : '<p>No books available for this genre.</p>'}
        </div>
    `;

    genresSection.appendChild(genreBlock);
}

function createBookItem(book) {
    return `  
    <div class="book-item dynamic-book">  
        <div class="book-placeholder">📚</div>  
        <p class="book-title-dynamic">${book.title}</p>  
        <p class="book-author-dynamic">${book.author}</p>  
        <p class="book-year-dynamic">${book.publication_year || 'N/A'}</p>  
        
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
    `;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper functions
function selectBook(bookId) {
    console.log('Selected book:', bookId);
    alert(`Selected book ID: ${bookId}`);
}

function selectAuthor(authorId) {
    console.log('Selected author:', authorId);
    alert(`Selected author ID: ${authorId}. În viitor va deschide pagina autorului.`);
}

function searchByName(name, category) {
    const searchInput = document.querySelector('.search-container input');
    searchInput.value = name;
    setCategory('Books');
    performSearch();
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

document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    const loginButton = document.querySelector('.login-btn');

    if (dropdown && loginButton && !loginButton.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

/* Funcții pentru gestionarea statusului cărților */
function toggleStatusSlider(button, bookId) {
    const slider = button.nextElementSibling;
    const allSliders = document.querySelectorAll('.status-slider');

    // Închide toate celelalte slidere
    allSliders.forEach(s => {
        if (s !== slider) {
            s.classList.remove('show');
        }
    });

    // Toggle slider-ul curent
    slider.classList.toggle('show');

    // Încarcă statusul actual al cărții
    loadCurrentBookStatus(bookId, slider);
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

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Event listener pentru închiderea slider-elor când se face click în afara lor
document.addEventListener('click', function(e) {
    if (!e.target.closest('.book-status-container')) {
        document.querySelectorAll('.status-slider').forEach(slider => {
            slider.classList.remove('show');
        });
    }
});