// --- GLOBAL STATE ---
let allBooks = [];

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const submitBtn = document.getElementById('submitBtn');

    // 1. Unified Session Check (Redirect if already logged in)
    async function checkSession() {
        try {
            const response = await fetch('/api/check-session');
            const data = await response.json();
            if (data.loggedIn) {
                window.location.href = data.role === 'admin' ? 'admin.html' : 'homepage.html';
            }
        } catch (err) { console.log("Session clear."); }
    }
    if (loginForm) checkSession();

    // 2. Password Visibility Toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }

    // 3. Unified Login Logic (Handles both Admin and User)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = passwordInput.value;
            const rememberMe = document.getElementById('remember-me-checkbox')?.checked;

            if (submitBtn) {
                submitBtn.textContent = 'Signing in...';
                submitBtn.disabled = true;
            }

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, rememberMe })
                });
                const data = await response.json();

                if (data.success) {
                    if (rememberMe) localStorage.setItem('userEmail', email);
                    window.location.href = data.redirect;
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (err) {
                alert('Network error. Check server.');
            } finally {
                if (submitBtn) {
                    submitBtn.textContent = 'Sign in';
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // 4. Catalog Initialization (Only runs on pages with a book grid)
    if (document.getElementById('bookGrid')) {
        initCatalog();
        document.getElementById('searchInput')?.addEventListener('input', debounce(performSearch, 300));
    }
});

// --- HELPER FUNCTIONS ---
async function initCatalog() {
    try {
        const res = await fetch('/api/books');
        const data = await res.json();
        if (data.success) {
            allBooks = data.books;
            renderBooks(allBooks);
        }
    } catch (err) { console.error('Catalog fetch error:', err); }
}

function renderBooks(booksToRender) {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;
    grid.innerHTML = '';
    booksToRender.forEach((book, index) => {
        const card = createBookCard(book, index);
        grid.appendChild(card);
    });
}

function createBookCard(book, index) {
    const article = document.createElement('article');
    article.className = 'book-card';
    const coverSrc = book.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Cover';
    article.innerHTML = `
        <div class="book-cover"><img src="${coverSrc}" loading="lazy"></div>
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
        </div>
    `;
    return article;
}

function performSearch() {
    const termSnippet = document.getElementById('searchInput');
    if (!termSnippet) return;
    const term = termSnippet.value.toLowerCase();
    const filtered = allBooks.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term));
    renderBooks(filtered);
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
