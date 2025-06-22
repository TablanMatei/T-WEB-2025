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
    // Folosește noul sistem de navigație
    updateNavigation();

    // Păstrează funcționalitatea veche pentru compatibilitate
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        // Creează dropdown pentru utilizator logat cu protecție XSS
        loginButton.innerHTML = `  
        ${sanitizeHtml(user.username)}   
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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');

    // Real-time search
    searchInput.addEventListener('input', performSearch);

    // Search button click
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        performSearch();
    });

    // Enter key search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
});
function loadTopRatedBooks() {
    const container = document.getElementById('topRatedContainer');
    if (!container) return;

    fetch('http://localhost:9000/backend/api/get_top_rated_books.php')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!data.success) {
                container.innerHTML = `<p>Error from API: ${data.error || 'Unknown error'}</p>`;
                return;
            }

            if (!data.books || data.books.length === 0) {
                container.innerHTML = '<p>No top-rated books found.</p>';
                return;
            }

            container.innerHTML = data.books.map(book => `
        <article class="book">
          <div class="book-details">
            <h3>${book.title}</h3>
            <p class="author">Published: ${book.year || 'N/A'}</p>
            <p class="genre">${book.genre || 'Unknown Genre'}</p>
            <p class="rating">⭐ ${book.avg_rating}</p>
          </div>
        </article>
      `).join('');
        })
        .catch(err => {
            container.innerHTML = `<p>Error loading books: ${err.message}</p>`;
        });
}

// Apelează funcția când vrei, de exemplu la încărcarea paginii:
document.addEventListener('DOMContentLoaded', loadTopRatedBooks);

// Funcție minimală pentru prevenirea XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
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

// Variabile globale pentru filtrare
let allTopRatedBooks = [];
let currentFilters = {
    genre: '',
    year: '',
    sort: 'rating_desc'
};

// Optimizează funcția loadTopRatedBooks
async function loadTopRatedBooks() {
    const container = document.getElementById('topRatedContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading top rated books...</div>';

    try {
        const response = await fetch('http://localhost:9000/backend/api/get_top_rated_books.php');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<div class="error-message">Error: ${sanitizeHtml(data.error || 'Unknown error')}</div>`;
            return;
        }

        if (!data.books || data.books.length === 0) {
            container.innerHTML = '<div class="no-results">No top-rated books found.</div>';
            return;
        }

        // Salvează toate cărțile pentru filtrare
        allTopRatedBooks = data.books;

        // Populează filtrele
        populateFilters(data.books);

        // Afișează cărțile
        displayTopRatedBooks(data.books);

    } catch (error) {
        console.error('Error loading top rated books:', error);
        container.innerHTML = `<div class="error-message">Error loading books: ${sanitizeHtml(error.message)}</div>`;
    }
}

// Populează dropdown-urile pentru filtrare
function populateFilters(books) {
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');

    if (!genreFilter || !yearFilter) return;

    // Extrage genurile unice
    const genres = [...new Set(books.map(book => book.genre).filter(Boolean))].sort();
    genreFilter.innerHTML = '<option value="">All Genres</option>' +
        genres.map(genre => `<option value="${sanitizeHtml(genre)}">${sanitizeHtml(genre)}</option>`).join('');

    // Extrage anii unici
    const years = [...new Set(books.map(book => book.year).filter(Boolean))].sort((a, b) => b - a);
    yearFilter.innerHTML = '<option value="">All Years</option>' +
        years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// Afișează cărțile cu design îmbunătățit
function displayTopRatedBooks(books) {
    const container = document.getElementById('topRatedContainer');
    if (!container) return;

    if (books.length === 0) {
        container.innerHTML = '<div class="no-results">No books match your filters.</div>';
        return;
    }

    container.innerHTML = books.map((book, index) => `
        <article class="book-card top-rated-book" data-rank="${index + 1}">
            <div class="book-rank">#${index + 1}</div>
            <div class="book-placeholder">📚</div>
            <div class="book-details">
                <h3 class="book-title">${sanitizeHtml(book.title)}</h3>
                <p class="book-author">by ${sanitizeHtml(book.author || 'Unknown Author')}</p>
                <div class="book-meta">
                    <span class="book-year">${book.year || 'N/A'}</span>
                    <span class="book-genre">${sanitizeHtml(book.genre || 'Unknown Genre')}</span>
                </div>
                <div class="book-rating">
                    <span class="rating-stars">⭐ ${book.avg_rating}</span>
                    <span class="rating-count">(${book.rating_count || 0} ratings)</span>
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

// Funcție pentru filtrarea cărților
function filterTopRatedBooks() {
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const sortOrder = document.getElementById('sortOrder');

    if (!genreFilter || !yearFilter || !sortOrder) return;

    currentFilters = {
        genre: genreFilter.value,
        year: yearFilter.value,
        sort: sortOrder.value
    };

    let filteredBooks = [...allTopRatedBooks];

    // Filtrează după gen
    if (currentFilters.genre) {
        filteredBooks = filteredBooks.filter(book => book.genre === currentFilters.genre);
    }

    // Filtrează după an
    if (currentFilters.year) {
        filteredBooks = filteredBooks.filter(book => book.year == currentFilters.year);
    }

    // Sortează
    filteredBooks.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'rating_desc':
                return (b.avg_rating || 0) - (a.avg_rating || 0);
            case 'rating_asc':
                return (a.avg_rating || 0) - (b.avg_rating || 0);
            case 'year_desc':
                return (b.year || 0) - (a.year || 0);
            case 'year_asc':
                return (a.year || 0) - (b.year || 0);
            default:
                return 0;
        }
    });

    displayTopRatedBooks(filteredBooks);
}

// Funcții pentru gestionarea statusului cărților (similare cu genresPage)
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

async function setBookStatus(bookId, status, optionElement) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) {
            alert('Please login to add books to your lists');
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
                status: status
            })
        });

        const responseText = await response.text();

        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const data = JSON.parse(responseText);

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
        } else {
            console.error('Backend returned non-JSON response:', responseText);
            showStatusMessage('Server error. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Error setting book status:', error);
        showStatusMessage('Network error. Please try again.', 'error');
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

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

async function loadCurrentBookStatus(bookId, slider) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.user_id) return;

        const response = await fetch(`http://localhost:9000/backend/api/get_book_status.php?user_id=${user.user_id}&book_id=${bookId}`);
        const responseText = await response.text();

        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const data = JSON.parse(responseText);

            if (data.success && data.status) {
                // Marchează statusul curent
                const currentOption = slider.querySelector(`[data-status="${data.status}"]`);
                if (currentOption) {
                    currentOption.classList.add('selected');
                }

                // Actualizează butonul
                const button = slider.previousElementSibling;
                updateButtonText(button, data.status);
            }
        }
    } catch (error) {
        console.error('Error loading book status:', error);
    }
}

// Închide slidere când se face clic în afara lor
document.addEventListener('click', function(e) {
    if (!e.target.closest('.book-status-container')) {
        document.querySelectorAll('.status-slider').forEach(slider => {
            slider.classList.remove('show');
        });
    }
});
