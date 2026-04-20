const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'bibliotheca_secret_key_2024';

// -- MOCK DATABASE (Memory Storage) --
let DEMO_MODE = false;
let mockUsers = [
  { id: 1, name: 'Administrator', email: 'admin@bookstore.com', password: '', role: 'admin', created_at: new Date() }
];
let mockBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', price: 899, stock: 15, description: 'A story of wealth and love in the 1920s.', cover_color: '#6366f1', icon: '📖', rating: 4.5 },
  { id: 2, title: '1984', author: 'George Orwell', genre: 'Dystopian', price: 745, stock: 8, description: 'Big Brother is watching you.', cover_color: '#1a1a2e', icon: '👁️', rating: 4.8 },
  { id: 3, title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', price: 499, stock: 25, description: 'Follow your dreams.', cover_color: '#c9a84c', icon: '🌟', rating: 4.2 },
  { id: 4, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-help', price: 650, stock: 40, description: 'Tiny changes, remarkable results.', cover_color: '#10b981', icon: '⚡', rating: 4.9 },
  { id: 5, title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', price: 595, stock: 12, description: 'An unexpected journey.', cover_color: '#e85d75', icon: '🗡️', rating: 4.7 }
];
let mockOrders = [];

(async () => {
  const adminPw = await bcrypt.hash('admin123', 10);
  mockUsers[0].password = adminPw;
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bookstore',
  password: 'postgres',
  port: 5432,
});

// Test connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.log('⚠️ PostgreSQL not detected. Entering DEMO MODE (Memory storage).');
    DEMO_MODE = true;
  } else {
    console.log('✅ Connected to PostgreSQL successfully.');
  }
});

// -- AUTH ROUTES --

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPw = await bcrypt.hash(password, 10);
    if (DEMO_MODE) {
      if (mockUsers.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
      const newUser = { id: mockUsers.length + 1, name, email, password: hashedPw, role: 'user', created_at: new Date() };
      mockUsers.push(newUser);
      const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET);
      return res.json({ token, user: { id: newUser.id, name, email, role: 'user' } });
    }
    const result = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role', [name, email, hashedPw]);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user;
    if (DEMO_MODE) {
      user = mockUsers.find(u => u.email === email);
    } else {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    }

    if (!user) return res.status(400).json({ error: 'User not found.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password.' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const auth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch (err) { res.status(403).json({ error: 'Invalid token' }); }
};

const adminOnly = (req, res, next) => { if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' }); next(); };

// -- BOOKS API --

app.get('/api/books', async (req, res) => {
  if (DEMO_MODE) return res.json(mockBooks);
  try { res.json((await pool.query('SELECT * FROM books ORDER BY id DESC')).rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/books', auth, adminOnly, async (req, res) => {
  if (DEMO_MODE) {
    const newBook = { ...req.body, id: mockBooks.length + 1, icon: '📚', rating: 4.5 };
    mockBooks.unshift(newBook);
    return res.json(newBook);
  }
  const { title, author, genre, price, stock, description, cover_color } = req.body;
  try {
    const result = await pool.query('INSERT INTO books (title, author, genre, price, stock, description, cover_color) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [title, author, genre, price, stock, description, cover_color]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/books/:id', auth, adminOnly, async (req, res) => {
  const id = parseInt(req.params.id);
  if (DEMO_MODE) {
    const idx = mockBooks.findIndex(b => b.id === id);
    mockBooks[idx] = { ...mockBooks[idx], ...req.body };
    return res.json(mockBooks[idx]);
  }
  const { title, author, genre, price, stock, description, cover_color } = req.body;
  try {
    const result = await pool.query('UPDATE books SET title=$1, author=$2, genre=$3, price=$4, stock=$5, description=$6, cover_color=$7 WHERE id=$8 RETURNING *', [title, author, genre, price, stock, description, cover_color, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/books/:id', auth, adminOnly, async (req, res) => {
  if (DEMO_MODE) { mockBooks = mockBooks.filter(b => b.id !== parseInt(req.params.id)); return res.json({ success: true }); }
  await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// -- ORDERS API --

app.post('/api/orders', auth, async (req, res) => {
  const { book_id, quantity, total, address, phone, payment_mode } = req.body;
  if (DEMO_MODE) {
    const book = mockBooks.find(b => b.id === parseInt(book_id));
    if (!book || book.stock < quantity) return res.status(400).json({ error: 'Out of stock' });
    book.stock -= quantity;
    const order = { 
      id: mockOrders.length + 1, 
      user_id: req.user.id, 
      book_id, 
      quantity, 
      total, 
      address,
      phone,
      payment_mode,
      status: 'In Progress', 
      ordered_at: new Date() 
    };
    mockOrders.push(order);
    res.json(order);
  } else {
    try {
      await pool.query('UPDATE books SET stock = stock - $1 WHERE id = $2', [quantity, book_id]);
      const result = await pool.query(
        'INSERT INTO orders (user_id, book_id, quantity, total, address, phone, payment_mode) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', 
        [req.user.id, book_id, quantity, total, address, phone, payment_mode]
      );
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
});

app.get('/api/orders/my', auth, async (req, res) => {
  if (DEMO_MODE) {
    const my = mockOrders.filter(o => o.user_id === req.user.id).map(o => {
      const b = mockBooks.find(book => book.id === o.book_id);
      return { ...o, title: b.title, author: b.author, cover_color: b.cover_color, icon: b.icon };
    });
    return res.json(my);
  }
  const result = await pool.query('SELECT o.*, b.title, b.author, b.cover_color, b.icon FROM orders o JOIN books b ON o.book_id = b.id WHERE o.user_id = $1 ORDER BY o.id DESC', [req.user.id]);
  res.json(result.rows);
});

// -- ADMIN DATA --

app.get('/api/admin/stats', auth, adminOnly, async (req, res) => {
  if (DEMO_MODE) {
    return res.json({ 
      books: mockBooks.length, 
      users: mockUsers.length, 
      orders: mockOrders.length, 
      revenue: mockOrders.reduce((a, b) => a + parseFloat(b.total), 0),
      outOfStock: mockBooks.filter(b => b.stock <= 0).length
    });
  }
  const stats = {
    books: (await pool.query('SELECT COUNT(*) FROM books')).rows[0].count,
    users: (await pool.query('SELECT COUNT(*) FROM users')).rows[0].count,
    orders: (await pool.query('SELECT COUNT(*) FROM orders')).rows[0].count,
    revenue: (await pool.query('SELECT SUM(total) FROM orders')).rows[0].sum || 0,
    outOfStock: (await pool.query('SELECT COUNT(*) FROM books WHERE stock <= 0')).rows[0].count
  };
  res.json(stats);
});

app.get('/api/admin/orders', auth, adminOnly, async (req, res) => {
  if (DEMO_MODE) {
    return res.json(mockOrders.map(o => {
      const u = mockUsers.find(user => user.id === o.user_id);
      const b = mockBooks.find(book => book.id === o.book_id);
      return { ...o, user_name: u.name, user_email: u.email, book_title: b.title };
    }));
  }
  const result = await pool.query('SELECT o.*, b.title as book_title, u.name as user_name, u.email as user_email FROM orders o JOIN books b ON o.book_id = b.id JOIN users u ON o.user_id = u.id');
  res.json(result.rows);
});

app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  if (DEMO_MODE) return res.json(mockUsers.map(({ password, ...u }) => u));
  const result = await pool.query('SELECT id, name, email, role, created_at FROM users');
  res.json(result.rows);
});

// Serve frontend - fixed for Express 5
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(PORT, () => {
    console.log(`\n📚 Bibliotheca Server Running at http://localhost:${PORT}`);
});
