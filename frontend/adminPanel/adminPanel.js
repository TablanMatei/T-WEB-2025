// VERIFICARE AUTENTIFICARE ȘI ADMIN
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    if (!checkAdminAccess()) {
        return;
    }

    loadStats();
    loadUsers();
    setupEventListeners();
    console.log('Admin panel initialized');
}

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
        window.location.href = '/frontend/authPage/authPage.html';
        return;
    }

    return response;
}

//  VERIFICARE ACCES ADMIN
function checkAdminAccess() {
    if (!isUserLoggedIn()) {
        alert('Please login first!');
        window.location.href = '/frontend/authPage/authPage.html';
        return false;
    }

    const user = getCurrentUser();

    if (!user || !user.role || user.role !== 'admin') {
        alert('Access denied! Admin privileges required.');
        window.location.href = '/frontend/mainPage/index.html';
        return false;
    }

    return true;
}

// ÎNCĂRCARE STATISTICI
async function loadStats() {
    try {
        const response = await authenticatedFetch('/backend/admin/get_stats.php');
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.total_users || '0';
            document.getElementById('totalGroups').textContent = data.stats.total_groups || '0';
            document.getElementById('totalBooks').textContent = data.stats.total_books || '0';
        } else {
            console.error('Error loading stats:', data.error);
            showErrorStats();
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
        showErrorStats();
        handleAuthError(error);
    }
}

function showErrorStats() {
    document.getElementById('totalUsers').textContent = 'Error';
    document.getElementById('totalGroups').textContent = 'Error';
    document.getElementById('totalBooks').textContent = 'Error';
}

//  MANAGEMENT TAB-URI
function showTab(tabName) {
    // Ascunde toate tab-urile
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Elimină active de la toate butoanele
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Afișează tab-ul selectat
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Activează butonul
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Încarcă conținutul bazat pe tab
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'groups') {
        loadGroups();
    }
}

// MANAGEMENT UTILIZATORI
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML = '<div class="loading">Loading users...</div>';

    try {
        const response = await authenticatedFetch('/backend/admin/manage_users.php');
        const data = await response.json();

        if (data.success) {
            displayUsers(data.users);
        } else {
            usersList.innerHTML = '<div class="error">Error loading users: ' + sanitizeHtml(data.error) + '</div>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<div class="error">Network error loading users</div>';
        handleAuthError(error);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    if (!users || users.length === 0) {
        usersList.innerHTML = '<div class="no-data">No users found</div>';
        return;
    }

    const currentUser = getCurrentUser();
    let html = '';

    users.forEach(user => {
        const isCurrentUser = user.user_id == currentUser.user_id;

        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>${sanitizeHtml(user.username)} ${isCurrentUser ? '(You)' : ''}</h4>
                    <p>Email: ${sanitizeHtml(user.email)}</p>
                    <p>Role: <strong>${sanitizeHtml(user.role)}</strong> | Joined: ${formatDate(user.created_at)}</p>
                    ${user.real_name ? `<p>Name: ${sanitizeHtml(user.real_name)}</p>` : ''}
                </div>
                <div class="admin-actions">
                    ${!isCurrentUser ? `
                        <button class="admin-btn role" onclick="toggleUserRole(${user.user_id}, '${user.role}')">
                            ${user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button class="admin-btn delete" onclick="deleteUser(${user.user_id}, '${sanitizeHtml(user.username)}')">
                            Delete
                        </button>
                    ` : '<span style="color: #666;">Current User</span>'}
                </div>
            </div>
        `;
    });

    usersList.innerHTML = html;
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
    }

    try {
        const response = await authenticatedFetch('/backend/admin/manage_users.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                role: newRole
            })
        });

        const data = await response.json();

        if (data.success) {
            showAdminMessage('User role updated successfully!', 'success');
            loadUsers();
        } else {
            showAdminMessage('Error updating user role: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        showAdminMessage('Network error updating user role', 'error');
        handleAuthError(error);
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await authenticatedFetch('/backend/admin/manage_users.php', {
            method: 'DELETE',
            body: JSON.stringify({
                user_id: userId
            })
        });

        const data = await response.json();

        if (data.success) {
            showAdminMessage('User deleted successfully!', 'success');
            loadUsers();
            loadStats();
        } else {
            showAdminMessage('Error deleting user: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAdminMessage('Network error deleting user', 'error');
        handleAuthError(error);
    }
}

//  MANAGEMENT GRUPURI
async function loadGroups() {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;

    groupsList.innerHTML = '<div class="loading">Loading groups...</div>';

    try {
        const response = await authenticatedFetch('/backend/admin/manage_groups.php');
        const data = await response.json();

        if (data.success) {
            displayGroups(data.groups);
        } else {
            groupsList.innerHTML = '<div class="error">Error loading groups: ' + sanitizeHtml(data.error) + '</div>';
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        groupsList.innerHTML = '<div class="error">Network error loading groups</div>';
        handleAuthError(error);
    }
}

function displayGroups(groups) {
    const groupsList = document.getElementById('groupsList');


    if (!groupsList) {
        return;
    }

    if (!groups || groups.length === 0) {
        groupsList.innerHTML = '<div class="no-data">No groups found</div>';
        return;
    }


    let html = '';

    groups.forEach((group, index) => {


        html += `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${sanitizeHtml(group.name)}</h4>
                <p>${sanitizeHtml(group.description || 'No description')}</p>
                <p>Members: <strong>${group.member_count || 0}</strong> | Created by: ${sanitizeHtml(group.creator_name || 'Unknown')}</p>
                <p>Created: ${formatDate(group.created_at)}</p>
            </div>
            <div class="admin-actions">
                <button class="admin-btn delete" data-group-id="${group.id}" data-group-name="${sanitizeHtml(group.name)}">
                    Delete Group
                </button>
            </div>
        </div>
        `;
    });


    groupsList.innerHTML = html;


    // Adaugă event listeners pentru butoanele de delete
    const deleteButtons = document.querySelectorAll('#groupsList .admin-btn.delete');


    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.getAttribute('data-group-id');
            const groupName = this.getAttribute('data-group-name');
            deleteGroup(groupId, groupName);
        });
    });
}

async function deleteGroup(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete group "${groupName}"? This will remove all members and cannot be undone.`)) {
        return;
    }

    try {
        const response = await authenticatedFetch('/backend/admin/manage_groups.php', {
            method: 'DELETE',
            body: JSON.stringify({
                group_id: groupId
            })
        });

        const data = await response.json();

        if (data.success) {
            showAdminMessage('Group deleted successfully!', 'success');
            loadGroups();
            loadStats();
        } else {
            showAdminMessage('Error deleting group: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        showAdminMessage('Network error deleting group', 'error');
        handleAuthError(error);
    }
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
        window.location.href = '/frontend/authPage/authPage.html';
    }
}

// EVENT LISTENERS
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Setup tab buttons cu event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            console.log('Tab button clicked:', tabName);
            showTab(tabName);
        });
    });
}

// MESAJE ADMIN
function showAdminMessage(message, type) {
    const existingMessage = document.querySelector('.admin-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `admin-message ${type}`;
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

//  GESTIONARE ERORI
function handleAuthError(error) {
    if (error.message && (error.message.includes('authentication') || error.message.includes('token'))) {
        sessionStorage.removeItem('jwt_token');
        window.location.href = '/frontend/authPage/authPage.html';
    }
}

// UTILITĂȚI
function sanitizeHtml(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
    }
}

// FUNCȚII GLOBALE PENTRU ONCLICK
window.toggleUserRole = toggleUserRole;
window.deleteUser = deleteUser;
window.deleteGroup = deleteGroup;
window.showTab = showTab;
window.logout = logout;