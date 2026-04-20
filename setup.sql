-- Run this in psql as superuser to set up the bookstore database

-- 1. Create database
CREATE DATABASE bookstore;

-- 2. Connect to it
\c bookstore

-- (Tables are auto-created by the Node.js server on first run)
-- But you can run this manually if preferred:

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150) NOT NULL,
  genre VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  description TEXT,
  cover_color VARCHAR(20) DEFAULT '#6366f1',
  rating DECIMAL(3,2) DEFAULT 4.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  book_id INT REFERENCES books(id),
  quantity INT DEFAULT 1,
  total DECIMAL(10,2),
  status VARCHAR(30) DEFAULT 'pending',
  ordered_at TIMESTAMP DEFAULT NOW()
);
