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
    
    // Deschide sau închide popup-ul
    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
        resetToBooks(); // Resetează la Books când se închide
    }
}

// Resetează la Books
function resetToBooks() {
    setCategory('Books');
}

function setCategory(category) {
        document.querySelectorAll('.category-list span').forEach(span => span.classList.remove('active'));
        document.querySelector(`[onclick="setCategory('${category}')"]`).classList.add('active');
        const popularList = document.getElementById('popularList');
        popularList.innerHTML = data[category].map(item => `<div>${item}</div>`).join('');
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
// Verifică autentificarea
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    console.log('Token:', token);
    console.log('IsLoggedIn:', isLoggedIn);

    // Verifică fie token-ul, fie isLoggedIn
    if (!token && isLoggedIn !== 'true') {
        console.log('No authentication found, redirecting...');
        window.location.href = '/frontend/index.html';
        return false;
    }
    return true;
}

// Încarcă notificările din backend

async function loadNotifications() {
    try {
        const response = await fetch('/backend/api/get_notifications.php', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            displayNotifications(result.notifications);
        } else {
            console.error('Error loading notifications:', result.message);
            showErrorMessage('Failed to load notifications');
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        showErrorMessage('Network error while loading notifications');
    }
}

/*
async function loadNotifications() {
    console.log('Starting to load notifications...');

    try {
        console.log('Making fetch request...');
        const response = await fetch('../backend/api/get_notifications.php', {
            method: 'GET',
            credentials: 'include'
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        // Să vedem ce returnează serverul înainte de a face parse JSON
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        // Încearcă să parsezi JSON doar dacă răspunsul pare să fie JSON
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const result = JSON.parse(responseText);
            console.log('Parsed JSON:', result);

            if (result.success) {
                console.log('Success! Displaying notifications...');
                displayNotifications(result.notifications);
            } else {
                console.error('API returned error:', result.message);
                showErrorMessage('Failed to load notifications: ' + result.message);
            }
        } else {
            console.error('Server returned non-JSON response:', responseText);
            showErrorMessage('Server error: Invalid response format');
        }
    } catch (error) {
        console.error('Fetch error details:', error);
        showErrorMessage('Network error while loading notifications');
    }
}
*/

// Afișează notificările în interfață
function displayNotifications(notifications) {
    const notificationList = document.querySelector('.notification-list');

    if (!notifications || notifications.length === 0) {
        notificationList.innerHTML = `  
            <li class="notification-item no-notifications">  
                <div class="notif-content">  
                    <p>No notifications yet</p>  
                    <span class="notif-time">You're all caught up!</span>  
                </div>  
            </li>  
        `;
        return;
    }

    notificationList.innerHTML = notifications.map(notification => {
        const timeAgo = formatTimeAgo(notification.created_at);
        const icon = getNotificationIcon(notification.type);
        const readClass = notification.is_read ? 'read' : 'unread';

        return `  
            <li class="notification-item ${readClass}" data-id="${notification.id}">  
                ${icon}  
                <div class="notif-content">  
                    <p>${notification.message}</p>  
                    <span class="notif-time">${timeAgo}</span>  
                </div>  
                ${!notification.is_read ? '<div class="unread-indicator"></div>' : ''}  
            </li>  
        `;
    }).join('');

    // Adaugă event listeners pentru marcarea ca citite
    addNotificationClickListeners();
}

// Returnează iconul corespunzător tipului de notificare
function getNotificationIcon(type) {
    const icons = {
        message: `<svg class="notif-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2">  
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />  
            <path d="M13.73 21a2 2 0 01-3.46 0" />  
        </svg>`,
        goal: `<svg class="notif-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2">  
            <path d="M20 6L9 17l-5-5" />  
        </svg>`,
        stats: `<svg class="notif-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2">  
            <circle cx="12" cy="12" r="10" />  
            <path d="M12 6v6l4 2" />  
        </svg>`,
        default: `<svg class="notif-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7a4e3e" stroke-width="2">  
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />  
            <path d="M13.73 21a2 2 0 01-3.46 0" />  
        </svg>`
    };

    return icons[type] || icons.default;
}

// Formatează timpul în format "time ago"
function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
}

// Adaugă event listeners pentru notificări
function addNotificationClickListeners() {
    const notificationItems = document.querySelectorAll('.notification-item[data-id]');

    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            const notificationId = this.dataset.id;
            markAsRead(notificationId, this);
        });
    });
}

// Marchează notificarea ca citită
async function markAsRead(notificationId, element) {
    try {
        const response = await fetch('/backend/api/mark_notification_read.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ notification_id: notificationId })
        });

        const result = await response.json();

        if (result.success) {
            element.classList.remove('unread');
            element.classList.add('read');
            const indicator = element.querySelector('.unread-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Afișează mesaje de eroare
function showErrorMessage(message) {
    const notificationList = document.querySelector('.notification-list');
    notificationList.innerHTML = `    
        <li class="notification-item error">    
            <div class="notif-content">    
                <p class="error-message">${message}</p>    
                <span class="notif-time">Please try again later</span>    
            </div>    
        </li>    
    `;
}

// Configurează navigarea
function setupNavigation() {
    // Configurează link-urile de navigare
    const settingsLink = document.querySelector('a[href="#settings"]');
    const notificationsLink = document.querySelector('a[href="#notifications"]');
    const signoutLink = document.querySelector('a[href="#signout"]');

    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../settingsPage/settingsPage.html';
        });
    }

    if (notificationsLink) {
        notificationsLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Suntem deja pe pagina de notificări, doar reîncarcă
            loadNotifications();
        });
    }

    if (signoutLink) {
        signoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Funcție de logout
async function logout() {
    try {
        const response = await fetch('/backend/auth/logout.php', {
            method: 'POST',
            credentials: 'include'
        });

        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/frontend/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/frontend/index.html';
    }
}

// Inițializare la încărcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    if (checkAuthentication()) {
        loadNotifications();
        setupNavigation();
        setCategory('Books'); // Pentru search popup
    }
});

window.onload = () => {
    if (checkAuthentication()) {
        setCategory('Books');
    }
};
