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


// NOUA FUNCȚIONALITATE PENTRU COMUNITATE
let allGroups = [];
let currentUser = null;

// Încarcă grupurile la încărcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    // Verifică dacă utilizatorul este logat
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.user_id) {
        currentUser = user;
        loadGroups();
        setupCommunityEventListeners();
    } else {
        // Redirect la pagina fără comunitate dacă nu e logat
        window.location.href = '../noCommunityPage/noCommunityPage.html';
    }

    setupAfterLoginNavigation();
    setCategory('Books');
});

// Încarcă grupurile din backend
async function loadGroups() {
    try {
        const response = await fetch('../../backend/community/get_groups.php');
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
    }
}

// Afișează grupurile în interfață
function displayGroups(groups) {
    const communitySection = document.querySelector('.community-section');
    const existingGroups = communitySection.querySelectorAll('.group-card');

    // Șterge grupurile statice existente
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

// Creează un card pentru grup
function createGroupCard(group) {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.dataset.category = 'books'; // Default category

    const createdDate = new Date(group.created_at).toLocaleDateString();

    groupCard.innerHTML = `  
        <div class="group-header">  
            <div class="group-icon">📚</div>  
            <div class="group-info">  
                <h3>${group.name}</h3>  
                <span class="group-meta">${group.member_count} Members · Created by ${group.creator_name} · ${createdDate}</span>  
            </div>  
        </div>  
        <p class="group-description">  
            ${group.description || 'No description available.'}  
        </p>  
        <button class="join-btn" onclick="joinGroup(${group.id})">Join Group</button>  
    `;

    return groupCard;
}

// Funcție pentru alăturarea la grup
async function joinGroup(groupId) {
    if (!currentUser) {
        showMessage('Please log in to join groups', 'error');
        return;
    }

    try {
        const response = await fetch('/backend/community/join_group.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                group_id: groupId,
                user_id: currentUser.user_id
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Successfully joined the group!', 'success');
            // Reîncarcă grupurile pentru a actualiza numărul de membri
            loadGroups();
        } else {
            showMessage(data.error || 'Failed to join group', 'error');
        }
    } catch (error) {
        console.error('Error joining group:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Configurează event listeners pentru filtrare
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

// Filtrează grupurile
function filterGroups() {
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    if (!searchInput || !filterSelect) return;

    const searchValue = searchInput.value.toLowerCase();
    const selectedCategory = filterSelect.value;

    const filteredGroups = allGroups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchValue) ||
            (group.description && group.description.toLowerCase().includes(searchValue));
        const matchesCategory = selectedCategory === 'all' || selectedCategory === 'books'; // Toate grupurile sunt de cărți pentru moment

        return matchesSearch && matchesCategory;
    });

    displayGroups(filteredGroups);
}

// Afișează mesaje către utilizator
function showMessage(message, type) {
    // Elimină mesajul anterior dacă există
    const existingMessage = document.querySelector('.community-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `community-message ${type}`;
    messageDiv.textContent = message;

    // Adaugă mesajul la începutul secțiunii de comunitate
    const communitySection = document.querySelector('.community-section');
    communitySection.insertBefore(messageDiv, communitySection.firstChild);

    // Elimină mesajul după 5 secunde
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Funcțiile pentru navigare
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

async function logout() {
    try {
        const response = await fetch('../backend/auth/logout.php', {
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