const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

// Initialize Environment Variables
dotenv.config();

// Ensure the database initializes and connection is verified
const db = require('./database.js');

const app = express();

// Configure Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Ensure static files are served from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Set the Root Route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Configure Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// --- DATABASE PROMISE WRAPPERS ---
const runDb = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));
const getDb = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); }));

// --- ADMIN MIDDLEWARE ---
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required.' });
};

// --- MULTER CONFIGURATION ---
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate a secure, unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// --- AUTHENTICATION ROUTES ---

app.post('/api/signup', async (req, res) => {
    try {
        // Note: We expect the frontend to map these correctly despite HTML ID typos
        const { firstName, lastName, email, password } = req.body;
        
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, error: 'All fields are required.' });
        }

        const existingUser = await getDb('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already exists.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await runDb(
            'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword, 'user']
        );

        res.json({ success: true, redirect: '/main.html' });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Admin Bypass Validation (Strict .env check, zero DB access)
        if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            req.session.userId = 'admin_id';
            req.session.role = 'admin';
            return res.json({ success: true, role: 'admin', redirect: 'admin.html' });
        }

        // 2. Standard User Validation (SQLite)
        const user = await getDb('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        // Establish User Session
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.email = user.email;
        res.json({ success: true, role: 'user', redirect: '/homepage.html' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

app.get('/api/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            loggedIn: true, 
            role: req.session.role, 
            email: req.session.email, 
            userId: req.session.userId 
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Could not log out.' });
        }
        res.clearCookie('connect.sid'); // Cleanly sever the client-side cookie
        res.json({ success: true, redirect: '/main.html' });
    });
});

// --- BOOK CRUD ROUTES ---

// READ ALL (Public/Logged In Users)
app.get('/api/books', async (req, res) => {
    try {
        db.all('SELECT * FROM books ORDER BY created_at DESC', [], (err, rows) => {
            if (err) return res.status(500).json({ success: false, error: 'Database error' });
            res.json({ success: true, books: rows });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// CREATE (Admin Only) - Expects multipart/form-data
app.post('/api/books', requireAdmin, upload.single('coverImage'), async (req, res) => {
    try {
        const { title, author, genre, release_date, description } = req.body;
        
        if (!title || !author) {
            return res.status(400).json({ success: false, error: 'Title and Author are required.' });
        }

        const cover_image_url = req.file ? `/public/uploads/${req.file.filename}` : null;

        await runDb(
            'INSERT INTO books (title, author, genre, release_date, cover_image_url, description) VALUES (?, ?, ?, ?, ?, ?)',
            [title, author, genre, release_date, cover_image_url, description]
        );

        res.json({ success: true, message: 'Book published successfully.' });
    } catch (error) {
        console.error('Create Book Error:', error);
        res.status(500).json({ success: false, error: 'Failed to publish book.' });
    }
});

// UPDATE (Admin Only) - Allows partial updates, retains old image if no new one provided
app.put('/api/books/:id', requireAdmin, upload.single('coverImage'), async (req, res) => {
    try {
        const bookId = req.params.id;
        const { title, author, genre, release_date, description } = req.body;
        
        const existingBook = await getDb('SELECT cover_image_url FROM books WHERE id = ?', [bookId]);
        if (!existingBook) return res.status(404).json({ success: false, error: 'Book not found.' });

        const cover_image_url = req.file ? `/public/uploads/${req.file.filename}` : existingBook.cover_image_url;

        await runDb(
            'UPDATE books SET title = ?, author = ?, genre = ?, release_date = ?, cover_image_url = ?, description = ? WHERE id = ?',
            [title, author, genre, release_date, cover_image_url, description, bookId]
        );

        res.json({ success: true, message: 'Book updated successfully.' });
    } catch (error) {
        console.error('Update Book Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update book.' });
    }
});

// DELETE (Admin Only)
app.delete('/api/books/:id', requireAdmin, async (req, res) => {
    try {
        const bookId = req.params.id;
        
        // Fetch book to get image path before deletion
        const book = await getDb('SELECT cover_image_url FROM books WHERE id = ?', [bookId]);
        
        await runDb('DELETE FROM books WHERE id = ?', [bookId]);

        // Cleanup the physical file to save local storage space
        if (book && book.cover_image_url) {
            const physicalPath = path.join(__dirname, book.cover_image_url);
            if (fs.existsSync(physicalPath)) {
                fs.unlinkSync(physicalPath);
            }
        }

        res.json({ success: true, message: 'Book deleted successfully.' });
    } catch (error) {
        console.error('Delete Book Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete book.' });
    }
});

// Boot Log
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}. WAL mode active.`);
});
