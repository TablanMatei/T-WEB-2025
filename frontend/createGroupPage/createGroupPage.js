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



// Configurează navigarea pentru pagina after login
document.addEventListener('DOMContentLoaded', function() {
    setupAfterLoginNavigation();
});


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
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../index.html';
    }
}
// Funcție pentru salvarea grupului
// Funcție pentru salvarea grupului
async function saveGroup(event) {
    event.preventDefault();

    // Colectează datele din formular
    const groupName = document.getElementById('group-name').value.trim();
    const groupDescription = document.getElementById('group-description').value.trim();
    const minAge = document.getElementById('min-age').value;
    const maxAge = document.getElementById('max-age').value;
    const isPublic = document.getElementById('public-group').checked;

    // Colectează genurile selectate
    const selectedGenres = [];
    const genreCheckboxes = document.querySelectorAll('input[name="genres"]:checked');
    genreCheckboxes.forEach(checkbox => {
        selectedGenres.push(checkbox.value);
    });

    // Validare de bază
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }

    if (!groupDescription) {
        alert('Please enter a group description');
        return;
    }

    if (selectedGenres.length === 0) {
        alert('Please select at least one genre');
        return;
    }

    // Verifică dacă utilizatorul este logat - folosește user_id în loc de id
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) {  // Schimbat de la user.id la user.user_id
        alert('You must be logged in to create a group');
        return;
    }

    // Construiește descrierea extinsă cu toate detaliile
    const extendedDescription = `${groupDescription}

Preferred Genres: ${selectedGenres.join(', ')}
${minAge || maxAge ? `Age Range: ${minAge || 'No min'} - ${maxAge || 'No max'}` : ''}`;

    try {
        const response = await fetch('../../backend/community/create_groups.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: groupName,
                description: extendedDescription,
                user_id: user.user_id,  // Schimbat de la user.id la user.user_id
                is_private: !isPublic
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Group created successfully!');
            // Redirecționează către pagina grupului sau comunității
            window.location.href = '../communityPage/communityPage.html';
        } else {
            alert('Error creating group: ' + (result.error || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.');
    }
}

// butonul de salvare
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.querySelector('.btn-primary');
    if (saveButton) {
        saveButton.addEventListener('click', saveGroup);
    }
});

window.onload = () => setCategory('Books');
