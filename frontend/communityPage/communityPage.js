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

// În afterLoginPage.js, adaugă la sfârșitul fișierului:

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

window.onload = () => setCategory('Books');



  const searchInput = document.querySelector('.search-input');
  const filterSelect = document.querySelector('.filter-select');
  const groupCards = document.querySelectorAll('.group-card');

  function filterGroups() {
    const searchValue = searchInput.value.toLowerCase();
    const selectedCategory = filterSelect.value;

    groupCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const category = card.dataset.category;

      const matchesSearch = title.includes(searchValue);
      const matchesCategory = selectedCategory === 'all' || selectedCategory === category;

      card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
  }

  searchInput.addEventListener('input', filterGroups);
  filterSelect.addEventListener('change', filterGroups);

