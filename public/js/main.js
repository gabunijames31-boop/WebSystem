
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        
        if (email.endsWith('@gmail.com')) {

            window.location.href = 'homepage.html';
        } else if (email === 'admin@com') {

            window.location.href = 'admin.html';
        } else {

            alert('Please use a valid @gmail.com email or admin credentials.');
        }
    });

    const eyeIcon = document.querySelector('.eye-icon');
    const passwordInput = document.getElementById('password');
    
    if (eyeIcon) {
        eyeIcon.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }
});

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });

    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    const submitBtn = document.getElementById('submitBtn');

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }

    function showSuccess(message) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
    }

    function clearMessages() {
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();
        
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = passwordInput.value;
        const rememberMe = document.getElementById('remember-me-checkbox').checked;
        
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }
        
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Signing in...';
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    rememberMe: rememberMe
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccess('Login successful! Redirecting...');
                
                if (rememberMe) {
                    localStorage.setItem('userEmail', data.email);
                    localStorage.setItem('userRole', data.role);
                }
          
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
            } else {
                showError(data.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Sign in';
        }
    });

    async function checkSession() {
        try {
            const response = await fetch('/api/check-session');
            const data = await response.json();
            
            if (data.loggedIn) {

                if (data.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/homepage.html';
                }
            }
        } catch (error) {
            console.log('No active session');
        }
    }
    
    checkSession();
    
    const rememberedEmail = localStorage.getItem('userEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember-me-checkbox').checked = true;
    }

document.addEventListener('DOMContentLoaded', function() {

    async function checkSession() {
        try {
            const response = await fetch('/api/check-session');
            const data = await response.json();
            
            if (!data.loggedIn) {
                document.getElementById('access-denied').style.display = 'flex';
                document.querySelector('.navbar').style.display = 'none';
                document.querySelector('.main-content').style.display = 'none';
                return;
            }

            document.getElementById('userEmail').textContent = data.email;
            document.getElementById('userRole').textContent = data.role;
            
        } catch (error) {
            console.error('Session check error:', error);
            document.getElementById('access-denied').style.display = 'flex';
        }
    }
    
    async function logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    checkSession();

    let currentUserId = null;
    
    async function checkSession() {
        try {
            const response = await fetch('/api/check-session');
            const data = await response.json();
            
            if (!data.loggedIn) {
                showAccessDenied();
                return;
            }
 
            if (data.role !== 'admin') {
                showAccessDenied();
                return;
            }
            
            currentUserId = data.userId;

            document.getElementById('userEmail').textContent = data.email;
            document.getElementById('userRole').textContent = data.role;
            
            loadUsers();
            
        } catch (error) {
            console.error('Session check error:', error);
            showAccessDenied();
        }
    }
    
    function showAccessDenied() {
        document.getElementById('access-denied').style.display = 'flex';
        document.querySelector('.navbar').style.display = 'none';
        document.querySelector('.main-content').style.display = 'none';
    }

    async function loadUsers() {
        const container = document.getElementById('usersTableContainer');
        container.innerHTML = '<div class="loading">Loading users...</div>';
        
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            
            if (data.error) {
                container.innerHTML = `<div class="loading">Error: ${data.error}</div>`;
                return;
            }
            
            const users = data.users || [];
            
            document.getElementById('totalUsers').textContent = users.length;
            document.getElementById('adminUsers').textContent = users.filter(u => u.role === 'admin').length;
            document.getElementById('regularUsers').textContent = users.filter(u => u.role === 'user').length;
            
            const today = new Date().toDateString();
            const newToday = users.filter(u => {
                const userDate = new Date(u.created_at).toDateString();
                return userDate === today;
            }).length;
            document.getElementById('newToday').textContent = newToday;
            
            if (users.length === 0) {
                container.innerHTML = '<div class="loading">No users found</div>';
                return;
            }
            
            const tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="role-tag role-${user.role}">${user.role}</span>
                                </td>
                                <td>${new Date(user.created_at).toLocaleString()}</td>
                                <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                                <td>
                                    <button class="delete-btn" 
                                            onclick="deleteUser(${user.id})" 
                                            ${user.id === currentUserId ? 'disabled' : ''}>
                                        ${user.id === currentUserId ? 'You' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            container.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Load users error:', error);
            container.innerHTML = '<div class="loading">Error loading users</div>';
        }
    }
    
    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('User deleted successfully');
                loadUsers();
            } else {
                alert('Error: ' + (data.error || 'Failed to delete user'));
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Error deleting user');
        }
    }
    
    async function logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    checkSession();
});
function toggleNav(){
    const nav = document.getElementById("sidenav");
    const main = document.getElementById("main");

    nav.classList.toggle("closed");
    main.classList.toggle("full");
}
function toggleNav(){

    const sidenav = document.getElementById("sidenav");

    if(!open){
        sidenav.style.left = "0";
        open = true;
    }else{
        sidenav.style.left = "-270px";
        open = false;
    }
}
let book = [];

function loadBooks() {
    fetch("fetch_books.php")
        .then(response => response.json())
        .then(data => {
            books = data;
            renderBooks();
        });
}
const books = [
    {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Classic Fiction",
        date: "1925-04-10",
        cover: "https://covers.openlibrary.org/b/id/8228691-L.jpg"
    },
    {
        id: 2,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Classic Fiction",
        date: "1960-07-11",
        cover: "https://covers.openlibrary.org/b/id/8228691-L.jpg"
    },
    {
        id: 3,
        title: "1984",
        author: "George Orwell",
        genre: "Dystopian",
        date: "1949-06-08",
        cover: "https://covers.openlibrary.org/b/id/10521270-L.jpg"
    },
    {
        id: 4,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Romance",
        date: "1813-01-28",
        cover: "https://covers.openlibrary.org/b/id/8231990-L.jpg"
    },
    {
        id: 5,
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        genre: "Fantasy",
        date: "1997-06-26",
        cover: "https://covers.openlibrary.org/b/id/14627267-L.jpg"
    },
    {
        id: 6,
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        genre: "Fantasy",
        date: "1937-09-21",
        cover: "https://covers.openlibrary.org/b/id/8406786-L.jpg"
    },
    {
        id: 7,
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        genre: "Literary Fiction",
        date: "1951-07-16",
        cover: "https://covers.openlibrary.org/b/id/8775116-L.jpg"
    },
    {
        id: 8,
        title: "Brave New World",
        author: "Aldous Huxley",
        genre: "Dystopian",
        date: "1932-08-01",
        cover: "https://covers.openlibrary.org/b/id/8091016-L.jpg"
    },
    {
        id: 9,
        title: "The Da Vinci Code",
        author: "Dan Brown",
        genre: "Thriller",
        date: "2003-03-18",
        cover: "https://covers.openlibrary.org/b/id/8769647-L.jpg"
    },
    {
        id: 10,
        title: "Gone Girl",
        author: "Gillian Flynn",
        genre: "Mystery",
        date: "2012-06-05",
        cover: "https://covers.openlibrary.org/b/id/8479576-L.jpg"
    },
    {
        id: 11,
        title: "The Alchemist",
        author: "Paulo Coelho",
        genre: "Fiction",
        date: "1988-04-01",
        cover: "https://covers.openlibrary.org/b/id/8235726-L.jpg"
    },
    {
        id: 12,
        title: "Dune",
        author: "Frank Herbert",
        genre: "Science Fiction",
        date: "1965-08-01",
        cover: "https://covers.openlibrary.org/b/id/8814602-L.jpg"
    }
];

document.addEventListener('DOMContentLoaded', function() {
    renderBooks(books);

    document.getElementById('searchInput').addEventListener('input', debounce(performSearch, 300));

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function renderBooks(booksToRender) {
    const grid = document.getElementById('bookGrid');
    const noResults = document.getElementById('noResults');

    const existingCards = grid.querySelectorAll('.book-card');
    existingCards.forEach(card => card.remove());

    if (booksToRender.length === 0) {
        noResults.classList.add('show');
        return;
    }

    noResults.classList.remove('show');

    booksToRender.forEach((book, index) => {
        const card = createBookCard(book, index);
        grid.appendChild(card);
    });
}

function createBookCard(book, index) {
    const article = document.createElement('article');
    article.className = 'book-card';
    article.style.animationDelay = `${index * 0.05}s`;
    article.dataset.title = book.title.toLowerCase();
    article.dataset.author = book.author.toLowerCase();
    article.dataset.genre = book.genre.toLowerCase();
    article.dataset.date = book.date;

    const formattedDate = new Date(book.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    article.innerHTML = `
        <div class="book-cover">
            <img src="${book.cover}" alt="${book.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/667eea/ffffff?text=${encodeURIComponent(book.title)}'">
        </div>
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <span class="book-genre">${book.genre}</span>
            <p class="book-date">Released: ${formattedDate}</p>
        </div>
    `;

    article.addEventListener('click', () => {
        showBookDetails(book);
    });

    return article;
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const genreFilter = document.getElementById('genre-select').value.toLowerCase();

    let filteredBooks = books.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm);

        const matchesGenre = genreFilter === 'all' || 
            book.genre.toLowerCase() === genreFilter;

        return matchesSearch && matchesGenre;
    });

    const sortValue = document.getElementById('sort-select').value;
    filteredBooks = sortBooksArray(filteredBooks, sortValue);

    renderBooks(filteredBooks);
}

function filterByGenre() {
    performSearch();
}

function sortBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const genreFilter = document.getElementById('genre-select').value.toLowerCase();
    const sortValue = document.getElementById('sort-select').value;

    let filteredBooks = books.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm);

        const matchesGenre = genreFilter === 'all' || 
            book.genre.toLowerCase() === genreFilter;

        return matchesSearch && matchesGenre;
    });

    filteredBooks = sortBooksArray(filteredBooks, sortValue);
    renderBooks(filteredBooks);
}

function sortBooksArray(booksArray, sortType) {
    const sorted = [...booksArray];

    switch(sortType) {
        case 'title-asc':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            sorted.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date-asc':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        default:
            sorted.sort((a, b) => a.id - b.id);
    }

    return sorted;
}

function showBookDetails(book) {
    const formattedDate = new Date(book.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    alert(`📖 ${book.title}\n\n👤 Author: ${book.author}\n\n📚 Genre: ${book.genre}\n\n📅 Released: ${formattedDate}`);
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        document.getElementById('searchInput').value = '';
        document.getElementById('genre-select').value = 'all';
        document.getElementById('sort-select').value = 'default';
        renderBooks(books);
    }
}

document.querySelector('.btn-logout').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        alert('Logged out successfully!');
    }
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const text = this.textContent;
        alert(`Navigating to ${text}...`);
    });
});
document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('active');
            });
        });

        const bookData = {
            stone: {
                title: "Harry Potter and the Philosopher's Stone",
                content: `
                    <h4>Chapter 1: The Boy Who Lived</h4>
                    <p>Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.</p>
                    <p>Harry Potter, the Boy Who Lived, has been living with his dreadful aunt and uncle, the Dursleys, since his parents were killed by the dark wizard Voldemort. On his eleventh birthday, Harry receives a letter from Hogwarts School of Witchcraft and Wizardry, delivered by the giant Hagrid.</p>
                    
                    <h4>Chapter 2: The Vanishing Glass</h4>
                    <p>Harry learns that he is a wizard and that his parents were murdered by Voldemort, who failed to kill Harry as a baby. This left Harry with a lightning-shaped scar on his forehead and made him famous in the wizarding world.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Introduction to the Wizarding World</li>
                        <li>Platform 9¾ and the Hogwarts Express</li>
                        <li>The Sorting Hat and House Selection</li>
                        <li>Learning Magic: Spells and Potions</li>
                        <li>The Forbidden Corridor and the Three-Headed Dog</li>
                        <li>The Mirror of Erised and Desires</li>
                        <li>Protecting the Philosopher's Stone</li>
                        <li>Confrontation with Professor Quirrell/Voldemort</li>
                    </ul>
                `
            },
            chamber: {
                title: "Harry Potter and the Chamber of Secrets",
                content: `
                    <h4>The Chamber Opens</h4>
                    <p>A mysterious warning appears on the wall: "The Chamber of Secrets has been opened. Enemies of the heir, beware." Students begin to be petrified, and Harry hears a voice no one else can hear.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Dobby the House-Elf's Warnings</li>
                        <li>Flying Car to Hogwarts</li>
                        <li>The Whomping Willow</li>
                        <li>Mandrakes and Their Cure</li>
                        <li>Tom Riddle's Diary</li>
                        <li>The Heir of Slytherin</li>
                        <li>Basilisk and Parseltongue</li>
                        <li>Gilderoy Lockhart's Fraud</li>
                        <li>Fawkes the Phoenix</li>
                        <li>The Sword of Gryffindor</li>
                    </ul>
                `
            },
            azkaban: {
                title: "Harry Potter and the Prisoner of Azkaban",
                content: `
                    <h4>The Escape</h4>
                    <p>Sirius Black has escaped from Azkaban prison after twelve years, and the Dementors are searching for him. Harry learns more about his parents' past and their friends.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Dementors and Their Effect</li>
                        <li>The Knight Bus</li>
                        <li>Divination with Professor Trelawney</li>
                        <li>Care of Magical Creatures (Hippogriffs)</li>
                        <li>The Marauder's Map</li>
                        <li>Animagus Transformations</li>
                        <li>Time-Turners</li>
                        <li>The Truth About Sirius Black</li>
                        <li>Werewolves (Lupin)</li>
                        <li>Patronus Charms</li>
                    </ul>
                `
            },
            goblet: {
                title: "Harry Potter and the Goblet of Fire",
                content: `
                    <h4>The Triwizard Tournament</h4>
                    <p>Despite being underage, Harry's name mysteriously emerges from the Goblet of Fire, forcing him to compete in the dangerous Triwizard Tournament alongside champions from Beauxbatons and Durmstrang.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>The Quidditch World Cup</li>
                        <li>Death Eaters and the Dark Mark</li>
                        <li>The Triwizard Champions</li>
                        <li>First Task: Dragons</li>
                        <li>Yule Ball and Romance</li>
                        <li>Second Task: Merpeople and the Lake</li>
                        <li>Third Task: The Maze</li>
                        <li>Portkeys and Traps</li>
                        <li>The Return of Voldemort</li>
                        <li>Priori Incantato</li>
                        <li>Cedric Diggory's Death</li>
                    </ul>
                `
            },
            phoenix: {
                title: "Harry Potter and the Order of the Phoenix",
                content: `
                    <h4>The Order Reassembles</h4>
                    <p>The Ministry of Magic denies Voldemort's return and launches a smear campaign against Harry and Dumbledore. Harry must deal with a new Defense Against the Dark Arts teacher who refuses to teach practical magic.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Dementor Attack in Little Whinging</li>
                        <li>Number Twelve, Grimmauld Place</li>
                        <li>The Order of the Phoenix</li>
                        <li>Dolores Umbridge and Educational Decrees</li>
                        <li>Dumbledore's Army (D.A.)</li>
                        <li>The Room of Requirement</li>
                        <li>Occlumency Lessons with Snape</li>
                        <li>Department of Mysteries</li>
                        <li>Prophecy and Its Meaning</li>
                        <li>Sirius Black's Death</li>
                        <li>The Battle at the Ministry</li>
                    </ul>
                `
            },
            prince: {
                title: "Harry Potter and the Half-Blood Prince",
                content: `
                    <h4>Horcruxes</h4>
                    <p>Dumbledore begins private lessons with Harry, showing him memories of Tom Riddle's past to understand how Voldemort achieved immortality through Horcruxes.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Horcruxes and Immortality</li>
                        <li>Tom Riddle's Childhood</li>
                        <li>The Gaunt Family</li>
                        <li>Slughorn's Memory</li>
                        <li>The Half-Blood Prince's Textbook</li>
                        <li>Advanced Potion-Making</li>
                        <li>Unbreakable Vow</li>
                        <li>Draco Malfoy's Mission</li>
                        <li>The Cave and Inferi</li>
                        <li>Dumbledore's Death</li>
                        <li>Severus Snape's Betrayal</li>
                        <li>The Funeral</li>
                    </ul>
                `
            },
            hallows: {
                title: "Harry Potter and the Deathly Hallows",
                content: `
                    <h4>The Final Battle</h4>
                    <p>Harry, Ron, and Hermione leave Hogwarts to hunt down and destroy Voldemort's remaining Horcruxes. The wizarding world falls under Voldemort's control as they search for the keys to his defeat.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>The Seven Potters</li>
                        <li>Fall of the Ministry</li>
                        <li>The Wedding and Escape</li>
                        <li>Godric's Hollow</li>
                        <li>The Tale of the Three Brothers</li>
                        <li>The Deathly Hallows</li>
                        <li>Xenophilius Lovegood</li>
                        <li>Malfoy Manor</li>
                        <li>Dobby's Sacrifice</li>
                        <li>Gringotts Break-in</li>
                        <li>Battle of Hogwarts</li>
                        <li>Snape's Memories</li>
                        <li>Harry's Sacrifice</li>
                        <li>The Elder Wand</li>
                        <li>Nineteen Years Later</li>
                    </ul>
                `
            },
            beasts1: {
                title: "Fantastic Beasts and Where to Find Them",
                content: `
                    <h4>New York, 1926</h4>
                    <p>Newt Scamander arrives in New York with a case full of magical creatures. When some escape, he must recapture them while navigating the tense relationship between the magical and non-magical communities.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Magical Creatures and Their Care</li>
                        <li>Niffler and His Treasure Hunting</li>
                        <li>Bowtruckles (Pickett)</li>
                        <li>Thunderbirds (Frank)</li>
                        <li>Obscurus and Obscurials</li>
                        <li>MACUSA (Magical Congress)</li>
                        <li>No-Maj (Non-Magical People)</li>
                        <li>Second Salemers</li>
                        <li>The Blind Pig Speakeasy</li>
                        <li>Memory Charms</li>
                        <li>Newt's Conservation Mission</li>
                    </ul>
                `
            },
            beasts2: {
                title: "Fantastic Beasts: The Crimes of Grindelwald",
                content: `
                    <h4>The Rise of Darkness</h4>
                    <p>Gellert Grindelwald escapes custody and begins gathering followers to his cause of wizarding supremacy. Newt is recruited by Dumbledore to help stop him.</p>
                    
                    <h4>Key Topics</h4>
                    <ul class="chapter-list">
                        <li>Grindelwald's Escape</li>
                        <li>The Lestrange Family</li>
                        <li>Credence Barebone's Identity</li>
                        <li>Nagini's Origin</li>
                        <li>The Philosopher's Stone (Nicolas Flamel)</li>
                        <li>Dumbledore's Blood Pact</li>
                        <li>French Ministry of Magic</li>
                        <li>The Circus Arcanus</li>
                        <li>Grindelwald's Rally</li>
                        <li>The Leta Lestrange Sacrifice</li>
                        <li>Aurelius Dumbledore Revelation</li>
                    </ul>
                `
            }
        };

        function openModal(bookId) {
            const modal = document.getElementById('modal');
            const title = document.getElementById('modal-title');
            const body = document.getElementById('modal-body');
            
            const book = bookData[bookId];
            title.textContent = book.title;
            body.innerHTML = book.content;
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            const modal = document.getElementById('modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        window.onclick = function(event) {
            const modal = document.getElementById('modal');
            if (event.target == modal) {
                closeModal();
            }
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
        function logout() {
    let confirmLogout = confirm("Are you sure you want to log out and clear your session?");
    
    if (confirmLogout) {
        localStorage.removeItem("user"); 
        sessionStorage.clear();

        window.location.href = "main.html";
    }
}
if (!localStorage.getItem("user")) {
    window.location.href = "main.html";
}
localStorage.setItem("user", "loggedIn");
