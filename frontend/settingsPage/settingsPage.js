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




// Funcție pentru actualizarea interfeței după login
function updateUIAfterLogin(user) {
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        // Transformă butonul în dropdown
        const parentLi = loginButton.parentElement;
        parentLi.className = 'dropdown profile';

        // Actualizează conținutul butonului
        loginButton.innerHTML = `
            ${user.username} 
            <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"></path>
            </svg>
        `;


        loginButton.removeAttribute('onclick');


        if (!parentLi.querySelector('.dropdown-menu')) {
            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.innerHTML = `
                <li><a href="#profile">My Profile</a></li>
                <li><a href="#settings">Settings</a></li>
                <li><a href="#notifications">Notifications</a></li>
                <li><a href="#" onclick="logout()">Logout</a></li>
            `;
            parentLi.appendChild(dropdownMenu);
        }
    }
}

// Funcție pentru toggle user menu
function toggleUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Închide dropdown-ul când apeși în altă parte
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


function setCategory(category, targetElement = null) {
    currentCategory = category;

    // Update active category
    const categories = document.querySelectorAll('.category-list span');
    categories.forEach(cat => cat.classList.remove('active'));

    // Dacă avem un element target (din click), îl marcăm ca activ
    if (targetElement) {
        targetElement.classList.add('active');
    } else {
        // Dacă nu avem target (apel din onload), găsim elementul pentru categoria respectivă
        const categoryElement = Array.from(categories).find(cat => cat.textContent.trim() === category);
        if (categoryElement) {
            categoryElement.classList.add('active');
        }
    }

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
    alert(`Selected book ID: ${bookId}`);
}

function searchByName(name, category) {
    const searchInput = document.querySelector('.search-container input');
    searchInput.value = name;
    setCategory('Books'); // Switch to books to show books by this author/series/etc
    performSearch();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
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




// Verifică autentificarea la încărcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('isLoggedIn:', isLoggedIn);
    console.log('user object:', user);

    if (isLoggedIn === 'true' && user.username) {
        updateUIAfterLogin(user);
        updateSettingsNavigation();
    } else {
        window.location.href = '/frontend/mainPage/index.html';
    }
});

// Funcție pentru actualizarea navigării
function updateSettingsNavigation() {
    // Edit Profile link
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

    // Notifications link
    const notificationsLinks = document.querySelectorAll('a[href="#notifications"]');
    notificationsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/frontend/notificationsPage/notificationsPage.html';
        });
    });

}

// Funcție pentru exportul datelor
async function exportData(format) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.user_id) {
        alert('Nu ești logat! Te rog să te loghezi din nou.');
        return;
    }

    // Găsește butonul și schimbă textul
    const button = document.querySelector(`.${format}-btn`);
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '⏳ Exporting...';

    try {
        const response = await fetch(`/backend/export/export_user_data.php?format=${format}&user_id=${user.user_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Obține numele fișierului din header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `user_data_${user.username}_${new Date().toISOString().split('T')[0]}.${format}`;

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Descarcă fișierul
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

        // Afișează mesaj de succes
        showExportMessage(`✅ ${format.toUpperCase()} export completed successfully!`, 'success');

    } catch (error) {
        console.error('Export error:', error);
        showExportMessage(`❌ Export failed: ${error.message}`, 'error');
    } finally {
        // Resetează butonul
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Funcție pentru afișarea mesajelor de export
function showExportMessage(message, type) {
    // Elimină mesajul anterior dacă există
    const existingMessage = document.querySelector('.export-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Creează noul mesaj
    const messageDiv = document.createElement('div');
    messageDiv.className = `export-message ${type}`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // Elimină mesajul după 4 secunde
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 4000);
}
