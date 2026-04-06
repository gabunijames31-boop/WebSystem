document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const tableBody = document.querySelector('.books-table tbody');
    const addBtn = document.querySelector('.btn-add');
    const modal = document.getElementById('addBookModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const form = document.getElementById('addBookForm');
    const totalBooksEl = document.querySelector('.stat-number');

    // 1. Fetch & Render Catalog
    const loadBooks = async () => {
        try {
            const res = await fetch('/api/books');
            const data = await res.json();
            
            if (data.success) {
                // Wipe hardcoded HTML rows
                tableBody.innerHTML = '';
                
                // Update Statistic
                if (totalBooksEl) totalBooksEl.textContent = data.books.length;

                // Render dynamic rows
                data.books.forEach(book => {
                    const year = book.release_date ? book.release_date.split('-')[0] : 'N/A';
                    const coverSrc = book.cover_image_url || 'https://via.placeholder.com/60x76/2c3e50/ffffff?text=No+Cover';
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="book-info">
                                <div class="book-cover" style="overflow: hidden;">
                                    <img src="${coverSrc}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div>
                                    <p class="book-title">${book.title}</p>
                                    <span class="book-rating">⭐ New</span>
                                </div>
                            </div>
                        </td>
                        <td>${book.author}</td>
                        <td><span class="badge">${book.genre || 'Uncategorized'}</span></td>
                        <td class="text-secondary">DB-ID-${book.id}</td>
                        <td class="text-secondary">${year}</td>
                        <td class="action-buttons">
                            <button class="btn-icon btn-delete" onclick="deleteBook(${book.id})">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error('Failed to fetch books:', err);
        }
    };

    // 2. Modal Controls
    addBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
    });

    // 3. Create Book (FormData bypasses JSON for File Uploads)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable button to prevent double-clicks
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Publishing...';
        submitBtn.disabled = true;

        const formData = new FormData(form);

        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                body: formData // Automatically sets correct multipart headers
            });
            const data = await res.json();
            
            if (data.success) {
                modal.style.display = 'none';
                form.reset();
                loadBooks(); // Re-render the table with the new book
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            alert('Network error while uploading.');
            console.error(err);
        } finally {
            submitBtn.textContent = 'Publish Book';
            submitBtn.disabled = false;
        }
    });

    // 4. Global Delete Function
    window.deleteBook = async (bookId) => {
        if (!confirm('Are you absolutely sure you want to delete this book? This action cannot be undone.')) return;
        
        try {
            const res = await fetch('/api/books/' + bookId, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (data.success) {
                loadBooks(); // Re-render to show deletion
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // Initialize Dashboard
    loadBooks();
});
