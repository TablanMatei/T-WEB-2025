//VERIFICARE AUTENTIFICARE
document.addEventListener('DOMContentLoaded', function() {
    if (!isUserLoggedIn()) {
        window.location.href = '../authPage/authPage.html';
        return;
    }
    initializeGroupPage();
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

//  VARIABILE GLOBALE
let allGroupBooks = [];
let currentFilters = {
    genre: '',
    rating: '',
    sort: 'rating_desc'
};
let currentViewMode = 'grid';

// INIȚIALIZARE PAGINĂ
function initializeGroupPage() {
    updateNavigation();
    loadGroupData();
    setupAfterLoginNavigation();
    setCategory('Books');
    console.log(`Welcome to Group page, ${getCurrentUser().username}!`);
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


async function loadGroupData() {


    // Verifică dacă avem un grup specific din URL
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');



    if (groupId) {

        // Încarcă grupul specific din URL
        loadSpecificGroup(groupId);
        return;
    }


    // Altfel, încarcă grupurile utilizatorului pentru selecție
    await loadUserGroupsForSelection();
}


async function loadSpecificGroup(groupId) {
    try {
        const response = await authenticatedFetch(`/backend/community/get_group_details.php?group_id=${groupId}`);
        const data = await response.json();

        if (data.success) {
            updateGroupUI(data.group, data.members);
            loadGroupBooks(groupId);
        } else {
            console.error('Error loading group:', data.error);
            alert('Error loading group details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error loading group');
        handleAuthError(error);
    }
}

async function loadUserGroupsForSelection() {
    try {
        const user = getCurrentUser();


        const response = await authenticatedFetch(`/backend/community/get_user_groups.php?user_id=${user.user_id}`);



        const responseText = await response.text();


        // Încearcă să parsezi JSON-ul
        let data;
        try {
            data = JSON.parse(responseText);

        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response was:', responseText);
            alert('Server returned invalid response. Check console for details.');
            return;
        }

        if (data.success && data.groups && data.groups.length > 0) {


            if (data.groups.length === 1) {

                loadSpecificGroup(data.groups[0].id);
            } else {

                displayGroupSelection(data.groups);
            }
        } else {

            window.location.href = '../noCommunityPage/noCommunityPage.html';
        }
    } catch (error) {
        console.error('Error loading user groups:', error);
        handleAuthError(error);
    }
}

function displayGroupSelection(groups) {
    const container = document.getElementById('groupBooksContainer');

    hideGroupStaticSections()
    let html = `
        <div class="group-selection">
            <h2>Select a Group</h2>
            <p>You are a member of ${groups.length} groups. Choose one to view:</p>
            <div class="groups-list">
    `;

    groups.forEach(group => {
        html += `
            <div class="group-card" onclick="selectGroup(${group.id}, '${group.name}')">
                <h3>${sanitizeHtml(group.name)}</h3>
                <p>${sanitizeHtml(group.description || 'No description')}</p>
                <div class="group-stats">
                    <span>👥 ${group.member_count} members</span>
                    <span>📚 ${group.book_count || 0} books</span>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function hideGroupStaticSections() {
    // Ascunde hero section cu date hard-codate
    const heroSection = document.querySelector('.group-hero');
    if (heroSection) {
        heroSection.style.display = 'none';
    }

    // Ascunde secțiunea principală cu date hard-codate
    const mainSection = document.querySelector('.group-main');
    if (mainSection) {
        mainSection.style.display = 'none';
    }
}

// FUNCȚIE pentru a afișa din nou secțiunile când selectezi un grup
function showGroupStaticSections() {
    const heroSection = document.querySelector('.group-hero');
    if (heroSection) {
        heroSection.style.display = 'block';
    }

    const mainSection = document.querySelector('.group-main');
    if (mainSection) {
        mainSection.style.display = 'block';
    }
}

function selectGroup(groupId, groupName) {
    // Navighează la grupul selectat
    window.location.href = `/frontend/groupPage/groupPage.html?groupId=${groupId}&groupName=${encodeURIComponent(groupName)}`;
}
async function loadGroupBooks(groupId) {
    const container = document.getElementById('groupBooksContainer');
    container.innerHTML = '<div class="loading-message">Loading community books...</div>';

    try {
        const response = await authenticatedFetch(`/backend/community/get_group_books.php?group_id=${groupId}`);
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
        handleAuthError(error);
    }
}

// STATUS CĂRȚI
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

//  GESTIONARE ERORI
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
    }
}

// FILTRE ȘI AFIȘARE
function populateFilters(books) {
    const genreFilter = document.getElementById('genreFilter');
    if (!genreFilter || !books.length) return;

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
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }

    if (hasHalfStar) {
        stars += '☆';
    }

    const totalStars = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = totalStars; i < 5; i++) {
        stars += '☆';
    }

    return stars;
}

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

    if (currentFilters.genre) {
        filteredBooks = filteredBooks.filter(book => book.genre === currentFilters.genre);
    }

    if (currentFilters.rating) {
        const minRating = parseFloat(currentFilters.rating);
        filteredBooks = filteredBooks.filter(book => (book.avg_rating || 0) >= minRating);
    }

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

// UI HELPERS
function setViewMode(mode) {
    currentViewMode = mode;

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const viewBtn = document.querySelector(`[data-view="${mode}"]`);
    if (viewBtn) viewBtn.classList.add('active');

    const container = document.getElementById('groupBooksContainer');
    if (container) {
        container.className = `group-books-container ${mode}-view`;
    }
}

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

function showBookDetails(bookId) {
    console.log('Show details for book:', bookId);
    alert(`Book details for ID: ${bookId} - Feature coming soon!`);
}

// UPDATE GROUP UI
function updateGroupUI(group, members) {
    showGroupStaticSections();
    const groupTitle = document.querySelector('.group-title');
    const groupSubtitle = document.querySelector('.group-subtitle');

    if (groupTitle) {
        groupTitle.textContent = sanitizeHtml(group.name);
    }

    if (groupSubtitle) {
        groupSubtitle.textContent = sanitizeHtml(group.description || 'No description available.');
    }

    updateGenres(group.genres);
    updateAgeRequirement(group.min_age, group.max_age);
    updateMembersList(members);
}

function updateGenres(genres) {
    const genresContainer = document.querySelector('.group-tags');

    if (genresContainer && genres) {
        genresContainer.innerHTML = '';
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

// NAVIGARE
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

function setupAfterLoginNavigation() {
    const settingsLinks = document.querySelectorAll('a[href="../settingsPage/settingsPage.html"]');
    settingsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../settingsPage/settingsPage.html';
        });
    });
}

// ===== SEARCH POPUP =====
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

// ANIMAȚII CARDS
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


function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// EVENT LISTENERS
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