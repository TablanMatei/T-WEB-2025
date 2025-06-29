// VERIFICARE AUTENTIFICARE
async function checkAuthBackend() {
    try {
        const response = await fetch('../../backend/auth/check_auth.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            sessionStorage.removeItem('jwt_token');
            window.location.href = '../authPage/authPage.html';
            return false;
        }

        const text = await response.text();
        console.log('Response text from backend:', text);

        // Încearcă să parsezi JSON doar dacă textul nu este gol
        const data = text ? JSON.parse(text) : null;
        return data && data.success;
    } catch (error) {
        console.error('Auth check failed:', error);
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../authPage/authPage.html';
        return false;
    }
}
document.addEventListener('DOMContentLoaded', async function() {
    if (!isUserLoggedIn()) {
        window.location.href = '../noCommunityPage/noCommunityPage.html';
        return;
    }

    // Verifică și cu backend dacă tokenul e valid
    const valid = await checkAuthBackend();
    if (!valid) return;

    initializeCommunityPage();
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
        window.location.href = '../noCommunityPage/noCommunityPage.html';
        return;
    }

    return response;
}


let allGroups = [];
let currentUser = null;

//  INIȚIALIZARE PAGINĂ
function initializeCommunityPage() {
    currentUser = getCurrentUser();
    updateNavigation();
    loadGroups();
    setupCommunityEventListeners();
    setupAfterLoginNavigation();
    setCategory('Books', document.querySelector('.category-list span'));
    console.log(`Welcome to Community page, ${currentUser.username}!`);
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

//  FUNCȚII PENTRU GRUPURI
async function loadGroups() {
    try {
        const response = await authenticatedFetch('/backend/community/get_groups.php');
        const data = await response.json();

        if (data.success) {
            allGroups = data.groups;
            displayGroups(allGroups);
        } else {
            console.error('Error loading groups:', data.error);
            showMessage('Error loading groups', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error loading groups', 'error');
        handleAuthError(error);
    }
}

async function joinGroup(groupId) {
    if (!currentUser) {
        showMessage('Please log in to join groups', 'error');
        return;
    }

    try {
        const response = await authenticatedFetch('/backend/community/join_group.php', {
            method: 'POST',
            body: JSON.stringify({
                group_id: groupId,
                user_id: currentUser.user_id
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Successfully joined the group!', 'success');

            // Actualizează numărul de membri în timp real
            updateGroupMemberCount(groupId, 1);

            // Opțional: reîncarcă toate grupurile pentru sincronizare completă
            // loadGroups();
        } else {
            showMessage(data.error || 'Failed to join group', 'error');
        }
    } catch (error) {
        console.error('Error joining group:', error);
        showMessage('Network error. Please try again.', 'error');
        handleAuthError(error);
    }
}

function updateGroupMemberCount(groupId, increment) {
    const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
    if (!groupCard) return;

    const memberCountElement = groupCard.querySelector('.group-meta');
    if (memberCountElement) {
        const currentText = memberCountElement.textContent;
        const memberMatch = currentText.match(/(\d+)\s+Members/);

        if (memberMatch) {
            const currentCount = parseInt(memberMatch[1]);
            const newCount = currentCount + increment;
            const newText = currentText.replace(/\d+\s+Members/, `${newCount} Members`);
            memberCountElement.textContent = newText;
        }
    }

    // Actualizează și în array-ul local
    const groupIndex = allGroups.findIndex(group => group.id == groupId);
    if (groupIndex !== -1) {
        allGroups[groupIndex].member_count = (allGroups[groupIndex].member_count || 0) + increment;
    }
}

// GESTIONARE ERORI
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '../noCommunityPage/noCommunityPage.html';
    }
}

// AFIȘARE GRUPURI
function displayGroups(groups) {
    const communitySection = document.querySelector('.community-section');
    const existingGroups = communitySection.querySelectorAll('.group-card');

    existingGroups.forEach(card => card.remove());

    if (groups.length === 0) {
        const noGroupsMessage = document.createElement('div');
        noGroupsMessage.className = 'no-groups-message';
        noGroupsMessage.innerHTML = `
            <p>No groups found. Be the first to create one!</p>
            <a href="../createGroupPage/createGroupPage.html" class="create-group-btn">➕ Create First Group</a>
        `;
        communitySection.appendChild(noGroupsMessage);
        return;
    }

    groups.forEach(group => {
        const groupCard = createGroupCard(group);
        communitySection.appendChild(groupCard);
    });
}

function createGroupCard(group) {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.dataset.category = 'books';
    groupCard.dataset.groupId = group.id; // Important pentru actualizarea numărului de membri

    groupCard.style.cursor = 'pointer';
    groupCard.onclick = () => navigateToGroup(group.id, group.name);

    const createdDate = new Date(group.created_at).toLocaleDateString();

    groupCard.innerHTML = `
        <div class="group-header">
            <div class="group-icon"></div>
            <div class="group-info">
                <h3>${sanitizeHtml(group.name)}</h3>
                <span class="group-meta">${group.member_count} Members · Created by ${sanitizeHtml(group.creator_name)} · ${createdDate}</span>
            </div>
        </div>
        <p class="group-description">
            ${sanitizeHtml(group.description || 'No description available.')}
        </p>
        <button class="join-btn" onclick="event.stopPropagation(); joinGroup(${group.id})">Join Group</button>
    `;

    return groupCard;
}

function navigateToGroup(groupId, groupName)
{
    window.location.href = `../groupPage/groupPage.html?groupId=${groupId}&groupName=${encodeURIComponent(groupName)}`;
}

//  FILTRARE ȘI CĂUTARE
function setupCommunityEventListeners() {
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    if (searchInput) {
        searchInput.addEventListener('input', filterGroups);
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', filterGroups);
    }
}

function filterGroups() {
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    if (!searchInput || !filterSelect) return;

    const searchValue = searchInput.value.toLowerCase();
    const selectedCategory = filterSelect.value;

    const filteredGroups = allGroups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchValue) ||
            (group.description && group.description.toLowerCase().includes(searchValue));
        const matchesCategory = selectedCategory === 'all' || selectedCategory === 'books';

        return matchesSearch && matchesCategory;
    });

    displayGroups(filteredGroups);
}

//MESAJE
function showMessage(message, type) {
    const existingMessage = document.querySelector('.community-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `community-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        padding: 12px 20px;
        margin: 10px 0;
        border-radius: 5px;
        font-weight: bold;
        text-align: center;
        ${type === 'success' ?
        'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' :
        'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
    `;

    const communitySection = document.querySelector('.community-section');
    communitySection.insertBefore(messageDiv, communitySection.firstChild);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
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

//  SEARCH POPUP
const data = {
    Books: ['The Great Gatsby', '1984', 'To Kill a Mockingbird', 'Pride and Prejudice', 'Harry Potter'],
    Authors: ['George Orwell', 'Jane Austen', 'J.K. Rowling', 'F. Scott Fitzgerald', 'Homer'],
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
    setCategory('Books', document.querySelector('.category-list span'));
}

function setCategory(category, element) {
    document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));

    if (element) {
        element.classList.add('active');
    } else {
        const categoryElement = document.querySelector(`[onclick*="setCategory('${category}'"]`);
        if (categoryElement) categoryElement.classList.add('active');
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

//  EVENT LISTENERS
document.addEventListener('click', (e) => {
    const popup = document.getElementById('searchPopup');
    const searchContainer = document.querySelector('.search-container');

    if (popup && searchContainer && !popup.contains(e.target) && !searchContainer.contains(e.target)) {
        popup.style.display = 'none';
        resetToBooks();
    }
});