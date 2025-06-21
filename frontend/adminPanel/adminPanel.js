// Funcție minimală pentru prevenirea XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Verifică dacă utilizatorul este admin
function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!isLoggedIn || !user.username) {
        alert('Please login first!');
        window.location.href = '/frontend/mainPage/index.html';
        return false;
    }

    if (!user.role || user.role !== 'admin') {
        alert('Access denied! Admin privileges required.');
        window.location.href = '/frontend/mainPage/index.html';
        return false;
    }

    return true;
}

// Încarcă statisticile pentru dashboard
async function loadStats() {
    try {
        const response = await fetch('/backend/admin/get_stats.php');
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.total_users || '0';
            document.getElementById('totalGroups').textContent = data.stats.total_groups || '0';
            document.getElementById('totalBooks').textContent = data.stats.total_books || '0';
        } else {
            console.error('Error loading stats:', data.error);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
        document.getElementById('totalUsers').textContent = 'Error';
        document.getElementById('totalGroups').textContent = 'Error';
        document.getElementById('totalBooks').textContent = 'Error';
    }
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');

    // Activate button
    event.target.classList.add('active');

    // Load content based on tab
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'groups') {
        loadGroups();
    }
}

// Load Users
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<div class="loading">Loading users...</div>';

    try {
        const response = await fetch('/backend/admin/manage_users.php');
        const data = await response.json();

        if (data.success) {
            displayUsers(data.users);
        } else {
            usersList.innerHTML = '<div class="error">Error loading users: ' + data.error + '</div>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<div class="error">Network error loading users</div>';
    }
}

// Display Users
function displayUsers(users) {
    const usersList = document.getElementById('usersList');

    if (users.length === 0) {
        usersList.innerHTML = '<div class="no-data">No users found</div>';
        return;
    }

    let html = '';
    users.forEach(user => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isCurrentUser = user.user_id == currentUser.user_id;

        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>${sanitizeHtml(user.username)} ${isCurrentUser ? '(You)' : ''}</h4>
                    <p>Email: ${sanitizeHtml(user.email)}</p>
                    <p>Role: <strong>${user.role}</strong> | Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
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

// Toggle User Role
async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
    }

    try {
        const response = await fetch('/backend/admin/manage_users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                role: newRole
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('User role updated successfully!');
            loadUsers(); // Reload users list
        } else {
            alert('Error updating user role: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        alert('Network error updating user role');
    }
}

// Delete User
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch('/backend/admin/manage_users.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('User deleted successfully!');
            loadUsers();
            loadStats();
        } else {
            alert('Error deleting user: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Network error deleting user');
    }
}

// Load Groups
async function loadGroups() {
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = '<div class="loading">Loading groups...</div>';

    try {
        const response = await fetch('/backend/admin/manage_groups.php');
        const data = await response.json();

        if (data.success) {
            displayGroups(data.groups);
        } else {
            groupsList.innerHTML = '<div class="error">Error loading groups: ' + data.error + '</div>';
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        groupsList.innerHTML = '<div class="error">Network error loading groups</div>';
    }
}


// Display Groups
function displayGroups(groups) {
    const groupsList = document.getElementById('groupsList');

    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="no-data">No groups found</div>';
        return;
    }

    let html = '';
    groups.forEach(group => {
        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>${sanitizeHtml(group.name)}</h4>
                    <p>${sanitizeHtml(group.description || 'No description')}</p>
                    <p>Members: <strong>${group.member_count}</strong> | Created by: ${sanitizeHtml(group.creator_name || 'Unknown')}</p>
                    <p>Created: ${new Date(group.created_at).toLocaleDateString()}</p>
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


    document.querySelectorAll('#groupsList .admin-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.getAttribute('data-group-id');
            const groupName = this.getAttribute('data-group-name');
            deleteGroup(groupId, groupName);
        });
    });
}

// Delete Group
async function deleteGroup(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete group "${groupName}"? This will remove all members and cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch('/backend/admin/manage_groups.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                group_id: groupId
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Group deleted successfully!');
            loadGroups();
            loadStats();
        } else {
            alert('Error deleting group: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Network error deleting group');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/frontend/mainPage/index.html';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Verifică accesul admin
    if (!checkAdminAccess()) {
        return;
    }

    loadStats();
    loadUsers();

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});