// Funcție minimală pentru prevenirea XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Variabile globale
let allGroupBooks = [];
let currentFilters = {
    genre: '',
    rating: '',
    sort: 'rating_desc'
};
let currentViewMode = 'grid';

document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    loadGroupData();
    setupAfterLoginNavigation();
});

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

async function loadGroupData() {
    const currentGroup = JSON.parse(localStorage.getItem('currentGroup') || '{}');

    if (!currentGroup.id) {
        // Dacă nu avem ID-ul grupului, redirectează înapoi
        window.location.href = '../communityPage/communityPage.html';
        return;
    }

    try {
        const response = await fetch(`../../backend/community/get_group_details.php?group_id=${currentGroup.id}`);
        const data = await response.json();

        if (data.success) {
            updateGroupUI(data.group, data.members);
            // Încarcă cărțile grupului după ce s-au încărcat detaliile
            loadGroupBooks(currentGroup.id);
        } else {
            console.error('Error loading group:', data.error);
            alert('Error loading group details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error loading group');
    }
}

async function loadGroupBooks(groupId) {
    const container = document.getElementById('groupBooksContainer');
    container.innerHTML = '<div class="loading-message">Loading community books...</div>';

    try {
        const response = await fetch(`../../backend/community/get_group_books.php?group_id=${groupId}`);
        const data = await response.json();

        if (data.success) {
            allGroupBooks = data.books;
            populateFilters(data.books);
            displayGroupBooks(data.books);
        } else {
            console.error('Error loading group books:', data.error);
            container.innerHTML = '<div class="no-books-message"><h3>📚 No Community Books Yet</h3><p>Be the first to finish and rate books to build your group library!</p></div>';
        }
    } catch (error) {
        console.error('Error loading group books:', error);
        container.innerHTML = '<div class="no-books-message"><h3>❌ Error Loading Books</h3><p>There was a problem loading the community books. Please try again later.</p></div>';
    }
}

// Populează filtrele
function populateFilters(books) {
    const genreFilter = document.getElementById('genreFilter');

    if (!genreFilter || !books.length) return;

    // Extrage genurile unice
    const genres = [...new Set(books.map(book => book.genre).filter(Boolean))].sort();
    genreFilter.innerHTML = '<option value="">All Genres</option>' +
        genres.map(genre => `<option value="${sanitizeHtml(genre)}">${sanitizeHtml(genre)}</option>`).join('');
}

function displayGroupBooks(books) {
    const container = document.getElementById('groupBooksContainer');

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="no-books-message"><h3>📚 No Community Books Yet</h3><p>When members finish and rate books they will appear here</p></div>';
        return;
    }

    // Aplică view mode
    container.className = `group-books-container ${currentViewMode}-view`;

    container.innerHTML = books.map(book => createGroupBookCard(book)).join('');
}

function createGroupBookCard(book) {
    const stars = generateStars(book.avg_rating);
    const genre = book.genre || 'Fiction';
    const readersList = book.readers || '';

    return `
        <div class="group-book-card" onclick="showBookDetails('${book.book_id}')">
            ${book.cover_image ?
        `<img src="${sanitizeHtml(book.cover_image)}" alt="${sanitizeHtml(book.title)}" class="group-book-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                 <div class="no-cover-placeholder" style="display:none;">📚</div>`
        :
        `<div class="no-cover-placeholder">📚</div>`
    }
            
            <div class="group-book-genre">${sanitizeHtml(genre)}</div>
            
            <h3 class="group-book-title">${sanitizeHtml(book.title)}</h3>
            <p class="group-book-author">by ${sanitizeHtml(book.author)}</p>
            
            <div class="group-book-stats">
                <div class="group-book-rating">
                    <span class="stars">${stars}</span>
                    <span>${book.avg_rating || 'N/A'}</span>
                </div>
                <div class="group-book-readers">
                    ${book.reader_count} readers
                </div>
            </div>
            
            <div class="group-book-readers-list">
                <strong>Read by:</strong> ${sanitizeHtml(readersList)}
            </div>

            <!--
            <div class="book-actions">
                <div class="book-status-container">
                    <button class="book-status-btn" onclick="event.stopPropagation(); toggleStatusSlider(this, ${book.book_id})">
                        <span class="status-text">Add to List</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="status-slider">
                        <div class="status-option" data-status="want_to_read" onclick="event.stopPropagation(); setBookStatus(${book.book_id}, 'want_to_read', this)">
                            <span class="status-icon">📚</span>Want to Read
                        </div>
                        <div class="status-option" data-status="currently_reading" onclick="event.stopPropagation(); setBookStatus(${book.book_id}, 'currently_reading', this)">
                            <span class="status-icon">📖</span>Currently Reading
                        </div>
                        <div class="status-option" data-status="finished" onclick="event.stopPropagation(); setBookStatus(${book.book_id}, 'finished', this)">
                            <span class="status-icon">✅</span>Finished
                        </div>
                    </div>
                </div>
            </div> -->
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    // Adaugă stelele pline
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }

    // Adaugă steaua pe jumătate dacă e cazul
    if (hasHalfStar) {
        stars += '☆';
    }

    // Completează cu stele goale până la 5
    const totalStars = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = totalStars; i < 5; i++) {
        stars += '☆';
    }

    return stars;
}

// Funcții pentru filtrare și sortare
function filterGroupBooks() {
    const genreFilter = document.getElementById('genreFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const sortOrder = document.getElementById('sortOrder');

    if (!genreFilter || !ratingFilter || !sortOrder) return;

    currentFilters = {
        genre: genreFilter.value,
        rating: ratingFilter.value,
        sort: sortOrder.value
    };

    let filteredBooks = [...allGroupBooks];

    // Filtrează după gen
    if (currentFilters.genre) {
        filteredBooks = filteredBooks.filter(book => book.genre === currentFilters.genre);
    }

    // Filtrează după rating
    if (currentFilters.rating) {
        const minRating = parseFloat(currentFilters.rating);
        filteredBooks = filteredBooks.filter(book => (book.avg_rating || 0) >= minRating);
    }

    // Sortează
    filteredBooks.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'rating_desc':
                return (b.avg_rating || 0) - (a.avg_rating || 0);
            case 'rating_asc':
                return (a.avg_rating || 0) - (b.avg_rating || 0);
            case 'readers_desc':
                return (b.reader_count || 0) - (a.reader_count || 0);
            case 'title_asc':
                return (a.title || '').localeCompare(b.title || '');
            default:
                return 0;
        }
    });

    displayGroupBooks(filteredBooks);
}

// Funcții pentru view mode
function setViewMode(mode) {
    currentViewMode = mode;

    // Actualizează butoanele
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${mode}"]`).classList.add('active');

    // Re-afișează cărțile cu noul view mode
    const container = document.getElementById('groupBooksContainer');
    container.className = `group-books-container ${mode}-view`;
}

// Funcții pentru gestionarea statusului cărților
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

        const response = await fetch('../../backend/api/update_book_status.php', {
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

        const response = await fetch(`../../backend/api/get_book_status.php?user_id=${user.user_id}&book_id=${bookId}`);
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

function showBookDetails(bookId) {
    // Poți redirecta către o pagină de detalii sau deschide un modal
    console.log('Show details for book:', bookId);
    alert(`Book details for ID: ${bookId} - Feature coming soon!`);
}

function updateGroupUI(group, members) {
    // Actualizează titlul și descrierea
    const groupTitle = document.querySelector('.group-title');
    const groupSubtitle = document.querySelector('.group-subtitle');

    if (groupTitle) {
        groupTitle.textContent = sanitizeHtml(group.name);
    }

    if (groupSubtitle) {
        groupSubtitle.textContent = sanitizeHtml(group.description || 'No description available.');
    }

    // Actualizează genurile
    updateGenres(group.genres);

    // Actualizează vârsta
    updateAgeRequirement(group.min_age, group.max_age);

    // Actualizează lista de membri
    updateMembersList(members);
}

function updateGenres(genres) {
    const genresContainer = document.querySelector('.group-tags');

    if (genresContainer && genres) {
        genresContainer.innerHTML = '';

        // Împarte genurile după virgulă și creează tag-uri
        const genreList = genres.split(',').map(g => g.trim()).filter(g => g);

        genreList.forEach(genre => {
            const span = document.createElement('span');
            span.textContent = sanitizeHtml(genre);
            genresContainer.appendChild(span);
        });
    }
}

function updateAgeRequirement(minAge, maxAge) {
    const ageElement = document.querySelector('.group-age');

    if (ageElement && (minAge || maxAge)) {
        let ageText = 'Age requirement: ';

        if (minAge && maxAge) {
            ageText += `<strong>${minAge} - ${maxAge} years</strong>`;
        } else if (minAge) {
            ageText += `<strong>${minAge}+ years</strong>`;
        } else if (maxAge) {
            ageText += `<strong>Under ${maxAge} years</strong>`;
        }

        ageElement.innerHTML = ageText;
    }
}

function updateMembersList(members) {
    const membersList = document.querySelector('.group-members');

    if (membersList && members.length > 0) {
        membersList.innerHTML = '';

        members.forEach(member => {
            const li = document.createElement('li');
            const displayName = sanitizeHtml(member.real_name || member.username);
            const roleIcon = member.role === 'admin' ? '👑 ' : '';
            li.textContent = roleIcon + displayName;
            membersList.appendChild(li);
        });
    }
}

// Funcții pentru animații și scroll
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

// Funcții pentru search popup
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

function setCategory(category) {
    document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));
    const categoryElement = document.querySelector(`[onclick="setCategory('${category}')"]`);
    if (categoryElement) {
        categoryElement.classList.add('active');
    }
    const popularList = document.getElementById('popularList');
    if (popularList && data[category]) {
        popularList.innerHTML = data[category].map(item => `<div>${sanitizeHtml(item)}</div>`).join('');
    }
}

// Funcții pentru login
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
        const response = await fetch('../../backend/auth/login.php', {
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
            updateNavigation();

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

function navigateToCommunity() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.username) {
        window.location.href = '../communityPage/communityPage.html';
    } else {
        window.location.href = '../noCommunityPage/noCommunityPage.html';
    }
}

function setupAfterLoginNavigation() {
    // Funcționalitate pentru navigarea după login
    const settingsLinks = document.querySelectorAll('a[href="../settingsPage/settingsPage.html"]');
    settingsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../settingsPage/settingsPage.html';
        });
    });
}

async function logout() {
    try {
        const response = await fetch('../../backend/auth/logout.php', {
            method: 'POST',
            credentials: 'include'
        });

        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../mainPage/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../mainPage/index.html';
    }
}

// Event listeners
document.addEventListener('click', function(e) {
    // Închide search popup
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');
    if (popup && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }

    // Închide status slidere
    if (!e.target.closest('.book-status-container')) {
        document.querySelectorAll('.status-slider').forEach(slider => {
            slider.classList.remove('show');
        });
    }
});

window.onload = () => setCategory('Books');