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
    const isVisible = popup.style.display !== 'none';

    if (isVisible) {
        popup.style.display = 'none';
    } else {
        popup.style.display = 'block';
        loadPopularItems(currentCategory);
    }
}

// Resetează la Books
function resetToBooks() {
    setCategory('Books');
}

function setCategory(category) {
    currentCategory = category;

    // Update active category
    const categories = document.querySelectorAll('.category-list span');
    categories.forEach(cat => cat.classList.remove('active'));
    event.target.classList.add('active');

    // Load popular items for this category
    loadPopularItems(category);
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

// Funcție pentru gestionare login
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitButton.textContent;

    // Validare de bază
    if (!username || !password) {
        showLoginMessage('Please fill in all fields', 'error');
        return false;
    }

    // Disable button during login
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
        console.log('Login response:', result);


        if (response.ok && result.success) {
            // Salvează datele utilizatorului
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true');

            showLoginMessage('Login successful!', 'success');

            // Actualizează interfața
            updateUIAfterLogin(result.user);

            // Închide modal-ul după 1 secundă
            setTimeout(() => {
                closeLogin();
                clearLoginForm();
            }, 1000);

        } else {
            showLoginMessage(result.error || 'Login failed. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showLoginMessage('Network error. Please check your connection.', 'error');
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }

    return false; // Previne submit-ul formularului
}

// Funcție pentru afișarea mesajelor în modal
function showLoginMessage(message, type) {
    // Elimină mesajul anterior dacă există
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Creează noul mesaj
    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message ${type}`;
    messageDiv.textContent = message;

    // Adaugă mesajul în modal
    const loginContainer = document.querySelector('.login-container');
    const form = document.getElementById('loginForm');
    loginContainer.insertBefore(messageDiv, form);

    // Elimină mesajul după 5 secunde
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}



// Funcție pentru curățarea formularului
function clearLoginForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';

    // Elimină mesajele
    const message = document.querySelector('.login-message');
    if (message) {
        message.remove();
    }
}

// Funcție pentru logout
function logout() {
    // Confirmă logout
    if (confirm('Are you sure you want to logout?')) {
        // Șterge datele locale
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        // Resetează interfața
        const loginButton = document.querySelector('.login-btn');
        if (loginButton) {
            loginButton.textContent = 'Login';
            loginButton.onclick = () => openLogin();
        }

        // Elimină dropdown-ul user
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.remove();
        }

        // Apel către backend pentru logout (opțional)
        fetch('http://localhost:9000/backend/auth/logout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }).catch(error => console.log('Logout backend call failed:', error));

        // Afișează mesaj
        alert('You have been logged out successfully!');

        // Opțional: reîncarcă pagina
        // window.location.reload();
    }
}

// Verifică dacă utilizatorul este deja logat la încărcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        updateUIAfterLogin(user);
    }
});




function updateUIAfterLogin(user) {
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        // Creează dropdown pentru utilizator logat
        loginButton.innerHTML = `
        ${user.username} 
        <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9l6 6 6-6"></path>
        </svg>
        `;

        // Schimbă funcționalitatea
        loginButton.onclick = () => toggleUserMenu();

        // Adaugă dropdown menu pentru user
        if (!document.querySelector('.user-dropdown')) {
            const userDropdown = document.createElement('div');
            userDropdown.className = 'user-dropdown';
            userDropdown.innerHTML = `
            <a href="#" id="profile-link">Edit Profile</a>
            <a href="#" id="notifications-link">Notifications</a>
            <a href="#" id="settings-link">Settings</a>
            <a href="#" onclick="logout()">Logout</a>
            `;
            loginButton.parentNode.appendChild(userDropdown);

            // Adaugă event listeners pentru navigare
            setupNavigationLinks();
        }
    }
}

// Funcție nouă pentru configurarea link-urilor de navigare

function setupNavigationLinks() {
    // Folosește setTimeout pentru a se asigura că DOM-ul este gata
    setTimeout(() => {
        const profileLink = document.getElementById('profile-link');
        const settingsLink = document.getElementById('settings-link');
        const notificationsLink = document.getElementById('notifications-link');

        console.log('Profile link:', profileLink);
        console.log('Settings link:', settingsLink);
        console.log('Notifications link:', notificationsLink);

        if (profileLink) {
            profileLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigating to profile page...');
                window.location.href = '/frontend/settingsPage/editProfilePage/editProfilePage.html';
            });
        }

        if (settingsLink) {
            settingsLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigating to settings page...');
                window.location.href = '/frontend/settingsPage/settingsPage.html';
            });
        }

        if (notificationsLink) {
            notificationsLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigating to notifications page...');
                window.location.href = '/frontend/notificationsPage/notificationsPage.html';
            });
        } else {
            console.error('Notifications link not found!');
        }
    }, 100);
}
// Funcție pentru toggle user menu
function toggleUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Închide dropdown-ul când apeși în altă parte//
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    const loginButton = document.querySelector('.login-btn');

    if (dropdown && !loginButton.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});


///FUNCTII DE SEARCH
// Variabile globale pentru search
let currentCategory = 'Books';
let searchResults = [];

// Funcție existentă - o actualizez


// Funcție existentă - o actualizez
function setCategory(category) {
    currentCategory = category;

    // Update active category
    const categories = document.querySelectorAll('.category-list span');
    categories.forEach(cat => cat.classList.remove('active'));
    event.target.classList.add('active');

    // Load popular items for this category
    loadPopularItems(category);
}

// Funcție încarcă items populare
async function loadPopularItems(category) {
    try {
        const response = await fetch(`http://localhost:9000/backend/api/search.php?category=${category}&limit=10`);
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

// Funcție afișează items populare
function displayPopularItems(items, category) {
    const popularList = document.getElementById('popularList');

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

// Funcție pentru selectare autor
function selectAuthor(authorId) {
    console.log('Selected author:', authorId);
    // TODO: Redirect to author details page sau show books by author
    alert(`Selected author ID: ${authorId}. În viitor va deschide pagina autorului.`);
}

// Funcție search real-time
async function performSearch() {
    const searchInput = document.querySelector('.search-container input');
    const query = searchInput.value.trim();

    if (query.length < 2) {
        loadPopularItems(currentCategory);
        return;
    }

    try {
        const response = await fetch('http://localhost:9000/backend/api/search.php', {
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



// Funcții helper
function selectBook(bookId) {
    console.log('Selected book:', bookId);
    // TODO: Redirect to book details page
    alert(`Selected book ID: ${bookId}`);
}

function searchByName(name, category) {
    const searchInput = document.querySelector('.search-container input');
    searchInput.value = name;
    setCategory('Books'); // Switch to books to show books by this author/series/etc
    performSearch();
}

// Funcție pentru navigarea către Community
function navigateToCommunity() {
    // Verifică dacă utilizatorul este logat
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        // Utilizator logat - navighează către pagina de comunitate
        window.location.href = '/frontend/communityPage/communityPage.html';
    } else {
        // Utilizator nelogat - navighează către pagina fără comunitate
        window.location.href = '/frontend/noCommunityPage/noCommunityPage.html';
    }
}

// Funcții pentru gestionarea genurilor
let genresData = {};

// Încarcă genurile de la backend
async function loadGenresFromDatabase() {
    try {
        const response = await fetch('http://localhost:9000/backend/api/get_genres.php');
        const data = await response.json();

        if (data.success) {
            genresData = data.genres;
            updateGenresDisplay();
        } else {
            console.error('Error loading genres:', data.error);
            // Fallback la genurile statice
        }
    } catch (error) {
        console.error('Error fetching genres:', error);
        // Fallback la genurile statice
    }
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

    // Limitează la primele 25 de genuri pentru performanță
    const topGenres = sortedGenres.slice(0, 25);

    // Creează blocurile pentru fiecare gen
    topGenres.forEach(genreData => {
        createGenreBlock(capitalizeFirst(genreData.genre_name), genreData);
    });
}

// Creează un bloc de gen
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

// Încarcă cărțile pentru un gen specific
async function loadBooksForGenre(genre) {
    try {
        const response = await fetch(`http://localhost:9000/backend/api/get_genres.php?genre=${encodeURIComponent(genre)}&limit=7`);
        const data = await response.json();

        if (data.success) {
            return data.books;
        } else {
            console.error('Error loading books for genre:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error fetching books for genre:', error);
        return [];
    }
}

// Creează un item de carte
function createBookItem(book) {
    const rating = book.avg_rating ? `⭐ ${parseFloat(book.avg_rating).toFixed(1)}` : 'No rating';
    return `
        <div class="book-item dynamic-book" onclick="selectBook(${book.id})">
            <div class="book-placeholder">📚</div>
            <p class="book-title-dynamic">${book.title}</p>
            <p class="book-author-dynamic">${book.author}</p>
            <p class="book-year-dynamic">${book.publication_year || 'N/A'}</p>
            <p class="book-rating-dynamic">${rating}</p>
        </div>
    `;
}

// Funcție helper pentru capitalizare
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Actualizează event listener-ul DOMContentLoaded existent
document.addEventListener('DOMContentLoaded', function() {
    // Cod existent pentru search
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
    }

    // Verifică login status
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (isLoggedIn === 'true' && user.username) {
        updateUIAfterLogin(user);
    }

    // Încarcă genurile de la backend
    loadGenresFromDatabase();
});