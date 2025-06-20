document.addEventListener('DOMContentLoaded', function() {
loadGroupData();
setupAfterLoginNavigation();
});

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

    try {
        const response = await fetch(`../../backend/community/get_group_books.php?group_id=${groupId}`);
        const data = await response.json();

        if (data.success) {
            displayGroupBooks(data.books);
        } else {
            console.error('Error loading group books:', data.error);
            container.innerHTML = '<div class="no-books-message"><h3>📚 No Community Books Yet</h3><p>Be the first to finish and rate books to build your group</p></div>';
        }
    } catch (error) {
        console.error('Error loading group books:', error);
        container.innerHTML = '<div class="no-books-message"><h3>❌ Error Loading Books</h3><p>There was a problem loading the community books. Please try again later.</p></div>';
    }
}

function displayGroupBooks(books) {
    const container = document.getElementById('groupBooksContainer');

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="no-books-message"><h3>📚 No Community Books Yet</h3><p>When members finish and rate books they will appear here </p></div>';
        return;
    }

    container.innerHTML = books.map(book => createGroupBookCard(book)).join('');
}

function createGroupBookCard(book) {
    const stars = generateStars(book.avg_rating);
    const genre = book.genre || 'Fiction';
    const readersList = book.readers || '';

    return `
    <div class="group-book-card" onclick="showBookDetails('${book.book_id}')">
    ${book.cover_image ?
        `<img src="${book.cover_image}" alt="${book.title}" class="group-book-cover" onerror="this.style.display='none';">`
        :
        `<div class="no-cover-placeholder">📚</div>`
    }
    
    <div class="group-book-genre">${genre}</div>
    
    <h3 class="group-book-title">${book.title}</h3>
    <p class="group-book-author">by ${book.author}</p>
    
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
    <strong>Read by:</strong> ${readersList}
    </div>
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

function showBookDetails(bookId) {

    // Poți redirecta către o pagină de detalii sau deschide un modal
    console.log('Show details for book:', bookId);

    // Exemplu de redirectare (adaptează calea după structura ta)
    // window.location.href = `../bookDetails/bookDetails.html?id=${bookId}`;

    // Sau poți afișa un alert temporar
    alert(`Book details for ID: ${bookId} - Feature coming soon!`);
}

function updateGroupUI(group, members) {
    // Actualizează titlul și descrierea
    const groupTitle = document.querySelector('.group-title');
    const groupSubtitle = document.querySelector('.group-subtitle');

    if (groupTitle) {
        groupTitle.textContent = group.name;
    }

    if (groupSubtitle) {
        groupSubtitle.textContent = group.description || 'No description available.';
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
            span.textContent = genre;
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
            const displayName = member.real_name || member.username;
            const roleIcon = member.role === 'admin' ? '👑 ' : '';
            li.textContent = roleIcon + displayName;
            membersList.appendChild(li);
        });
    }
}

function updateGroupInfo(group) {
    // Optional: logică pentru a actualiza alte informații
    // cum ar fi data creării, tipul grupului, etc.

    // Exemplu: actualizează vârsta minimă
}

async function loadGroupMembers(groupId) {
    // TODO: Implementează încărcarea membrilor din backend
    console.log('Loading members for group:', groupId);
}

async function loadGroupDiscussions(groupId) {
    // TODO: Implementează încărcarea discuțiilor din backend
    console.log('Loading discussions for group:', groupId);
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