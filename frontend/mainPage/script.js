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

// Variabile globale pentru search
let currentCategory = 'Books';
let searchResults = [];

// Funcție minimală pentru prevenirea XSS Cross Site
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

    // Fix pentru libraryModal - obține elementul direct
    const libraryModal = document.getElementById('libraryModal');
    if (libraryModal && e.target === libraryModal) {
        closeLibraryModal();
    }
});

// Funcție încarcă items populare cu debugging
async function loadPopularItems(category) {
    try {
        console.log('Loading popular items for:', category);
        const url = `http://localhost:9000/backend/api/search.php?category=${category}&limit=10`;
        console.log('Request URL:', url);

        const response = await fetch(url);
        console.log('Response status:', response.status);

        const text = await response.text();
        console.log('Raw response:', text);

        const data = JSON.parse(text);
        console.log('Parsed data:', data);

        if (data.success) {
            displayPopularItems(data.data, category);
        } else {
            console.error('Error loading popular items:', data.error);
        }
    } catch (error) {
        console.error('Error in loadPopularItems:', error);
    }
}

// Funcție afișează items populare
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

// Funcție search real-time
async function performSearch() {
    const searchInput = document.querySelector('.search-container input');
    const query = searchInput.value.trim();

    if (query.length < 2) {
        loadPopularItems(currentCategory);
        return;
    }

    try {
        console.log('Performing search for:', query, 'in category:', currentCategory);
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

        const text = await response.text();
        console.log('Search response:', text);

        const data = JSON.parse(text);

        if (data.success) {
            displaySearchResults(data.data, currentCategory, query);
        } else {
            console.error('Search error:', data.error);
            displayNoResults(query);
        }
    } catch (error) {
        console.error('Error in performSearch:', error);
    }
}

function displaySearchResults(results, category, query) {
    const popularList = document.getElementById('popularList');
    if (!popularList) return;

    if (results.length === 0) {
        displayNoResults(query);
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

function displayNoResults(query) {
    const popularList = document.getElementById('popularList');
    if (!popularList) return;

    popularList.innerHTML = `  
        <div class="no-results">  
            <h4>No results found for "${query}"</h4>  
            <p>We couldn't find any books matching your search.</p>  
            <button class="library-recommend-btn" onclick="recommendLibraries()">  
                📍 Find nearby libraries  
            </button>  
        </div>  
    `;
}

// FUNCȚII PENTRU RECOMANDAREA BIBLIOTECILOR
function recommendLibraries() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                showLibraryModal(lat, lng);
            },
            (error) => {
                console.log('Geolocation error:', error);
                showLocationInputModal();
            }
        );
    } else {
        showLocationInputModal();
    }
}

function showLibraryModal(lat, lng) {
    const modal = document.getElementById('libraryModal');
    if (!modal) {
        createLibraryModal();
    }

    const libraryList = document.getElementById('libraryList');
    libraryList.innerHTML = '<div class="loading">Finding nearby libraries...</div>';

    document.getElementById('libraryModal').style.display = 'block';

    findNearbyLibraries(lat, lng);
}

async function findNearbyLibraries(lat, lng) {
    try {
        // Overpass API query pentru biblioteci
        /// PENTRU A VEDEA LCOATIILE GASITE:
        /// https://overpass-turbo.eu/

        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="library"](around:5000,47.1585,27.6014);
              way["amenity"="library"](around:5000,47.1585,27.6014);
            );
            out center meta;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });

        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            const libraries = data.elements.slice(0, 10).map(element => {
                const elementLat = element.lat || element.center?.lat;
                const elementLng = element.lon || element.center?.lon;

                return {
                    name: element.tags?.name || 'Library',
                    address: `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:housenumber'] || ''}`.trim() || 'Address not available',
                    distance: calculateDistance(lat, lng, elementLat, elementLng),
                    type: element.tags?.library || 'Public Library'
                };
            });
            libraries.sort((a, b) => {
                const distA = parseFloat(a.distance.replace(' km', ''));
                const distB = parseFloat(b.distance.replace(' km', ''));
                return distA - distB;
            });
            displayLibraries(libraries, lat, lng);
        } else {
            showMockLibraries(lat, lng);
        }
    } catch (error) {
        console.error('Error finding libraries:', error);
        showMockLibraries(lat, lng);
    }
}

function showMockLibraries(lat, lng) {
    const libraries = [
        { name: 'Biblioteca 1', address: 'Strada 1', distance: '0.5 km' },
        { name: 'Biblioteca 2', address: 'Strada 2', distance: '1.2 km' },
        { name: 'Biblioteca 3', address: 'Strada 3', distance: '2.1 km' }
    ];
    displayLibraries(libraries, lat, lng);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1) + ' km';
}

function showLocationInputModal() {
    const modal = document.getElementById('libraryModal');
    if (!modal) {
        createLibraryModal();
    }

    const libraryList = document.getElementById('libraryList');
    libraryList.innerHTML = `  
        <div class="location-input">  
            <h4>Enter your location</h4>  
            <input type="text" id="cityInput" placeholder="Enter your city">  
            <button onclick="searchLibrariesByCity()">Find Libraries</button>  
        </div>  
    `;

    document.getElementById('libraryModal').style.display = 'block';
}

function displayLibraries(libraries, lat, lng) {
    const libraryList = document.getElementById('libraryList');
    let html = '<h4>Nearby Libraries</h4>';

    libraries.forEach(library => {
        html += `  
            <div class="library-item">  
                <div class="library-info">  
                    <h5>${library.name}</h5>  
                    <p>${library.address}</p>  
                    <span class="distance">${library.distance}</span>  
                </div>  
                <div class="library-actions">  
                    <button onclick="openInMaps('${library.address}')">View on Maps</button>  
                </div>  
            </div>  
        `;
    });

    libraryList.innerHTML = html;
}

function createLibraryModal() {
    const modalHTML = `  
        <div id="libraryModal" class="library-modal">  
            <div class="library-modal-content">  
                <span class="library-close" onclick="closeLibraryModal()">&times;</span>  
                <div id="libraryList"></div>  
            </div>  
        </div>  
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeLibraryModal() {
    document.getElementById('libraryModal').style.display = 'none';
}

function openInMaps(address) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
}

function searchLibrariesByCity() {
    const city = document.getElementById('cityInput').value.trim();
    if (city) {
        // Simulare căutare după oraș
        const libraries = [
            { name: `${city} Biblioteca 1`, address: `Main Street, ${city}`, distance: 'City center' },
            { name: `${city} Public Library`, address: `Library Ave, ${city}`, distance: 'Downtown' }
        ];
        displayLibraries(libraries);
    }
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

// LOGIN FUNCTIONS
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
        console.log('Login response:', result);

        if (response.ok && result.success) {
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true');

            ///DEBUG
            console.log('User data saved:', result.user);
            console.log('User role:', result.user.role);

            showLoginMessage('Login successful!', 'success');
            updateUIAfterLogin(result.user);

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
    }
}

function updateUIAfterLogin(user) {
    console.log('updateUIAfterLogin called with:', user);
    console.log('User role check:', user.role);
    console.log('Is admin?', user.role === 'admin');

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

    // Adaugă dashboard dropdown
    addDashboardDropdown();
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

function navigateToCommunity() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        window.location.href = '/frontend/communityPage/communityPage.html';
    } else {
        window.location.href = '/frontend/noCommunityPage/noCommunityPage.html';
    }
}

// MAIN EVENT LISTENER
document.addEventListener('DOMContentLoaded', function() {
    // Verifică login status
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (isLoggedIn === 'true' && user.username) {
        updateUIAfterLogin(user);
    }

    // Setup search functionality
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');

    if (searchInput && searchButton) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (query.length >= 2) {
                performSearch();
            } else if (query.length === 0) {
                loadPopularItems(currentCategory);
            }
        });

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

    // Setează categoria default
    setCategory('Books');
});

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        addDashboardDropdown();
    }
});

// LOGIN FUNCTIONS
function addDashboardDropdown() {
    const navList = document.getElementById('navList');
    if (!navList) return;
    if (navList.querySelector('li.dropdown a[href="#dashboard"]')) {
        return; // Nu adăuga din nou dacă există deja
    }
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
    <a href="../finishedBooksPage/finishedBooksPage.html">  
    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">  
    <polyline points="20 6 9 17 4 12"></polyline>  
    </svg>  
    Finished Books  
    </a>  
    </li>  
    <li>  
    <a href="#reading-stats">  
    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">  
    <line x1="12" y1="20" x2="12" y2="10"></line>  
    <line x1="18" y1="20" x2="18" y2="4"></line>  
    <line x1="6" y1="20" x2="6" y2="16"></line>  
    </svg>  
    Book Stats  
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

async function loadCurrentBookStatus(bookId, slider) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        const response = await fetch(`/backend/api/get_book_status.php?user_id=${user.id}&book_id=${bookId}`);
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
    }
}

async function setBookStatus(bookId, status, optionElement) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            alert('Please login to add books to your lists');
            return;
        }

        const response = await fetch('/backend/api/update_book_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
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

// Event listener pentru închiderea slider-elor când se face click în afara lor
document.addEventListener('click', function(e) {
    if (!e.target.closest('.book-status-container')) {
        document.querySelectorAll('.status-slider').forEach(slider => {
            slider.classList.remove('show');
        });
    }
});