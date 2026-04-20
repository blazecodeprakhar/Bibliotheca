# 📚 Bibliotheca - Modern Online Bookstore

**Bibliotheca** is a premium, full-stack online bookstore application. Designed with modern web aesthetics (glassmorphism, vibrant colors, and smooth animations), it provides a complete e-commerce experience from browsing titles to managing a shopping cart and completing purchases. 

Under the hood, it features a robust Node.js backend with JWT-based authentication and a dual-database architecture: it seamlessly connects to PostgreSQL for production environments, but intelligently falls back to an "In-Memory Demo Mode" if a database isn't available, right out of the box!

---

## 🚀 About The Project

This project was built to demonstrate a flawless, high-fidelity e-commerce platform. 

**Key Highlights:**
- **Zero-Config Demo Mode:** Download and run immediately without needing a database. The server detects the environment and spins up mock data automatically.
- **Indian Market Localization:** All pricing, revenue tracking, and checkout systems are localized with the Indian Rupee (₹) symbol and Indian number formatting (`en-IN`).
- **Receipt-Style Order History:** Users get a beautifully formatted, receipt-like view of their past orders.
- **Advanced Admin Oversight:** A dedicated dashboard for administrators to monitor gross revenue, track exactly which books are **Out of Stock**, and actively manage the inventory through a secure API.

---

## 📋 What You Need To Install

To run this project on your PC, you need at least **Node.js**. A database is optional but recommended.

### 1. Node.js (Required)
Node.js is the runtime environment that runs the backend server.
*   **Download:** [https://nodejs.org/](https://nodejs.org/)
*   **Recommendation:** Download the **LTS (Long Term Support)** version.
*   **How to check if it's installed:** Open your Command Prompt (cmd) or Terminal and type `node -v` and `npm -v`. If numbers appear, you are good to go!

### 2. PostgreSQL (Optional but Recommended)
PostgreSQL is the database system used to permanently save users, books, and orders.
*   **Download:** [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
*   **Setup Note:** During installation, it will ask you to create a password for the default `postgres` user. Remember this password!
*   **Why optional?** If you don't install this, the app uses its built-in **Demo Mode** to temporarily store data in your computer's RAM while the server is running.

---

## ⚡ How To Run The Project

Follow these exact steps to launch the application:

### Step 1: Open the Project
1. Extract or download the project folder.
2. Open your preferred Terminal or Command Prompt.
3. Navigate into the project folder using the `cd` command (e.g., `cd path/to/bookstore`).

### Step 2: Install Dependencies
Tell Node.js to download all the required background packages by running this command:
```bash
npm install
```

### Step 3: Set up the Database (Skip if using Demo Mode)
If you installed PostgreSQL, you need to create the database holding tank. Run:
```bash
psql -U postgres -c "CREATE DATABASE bookstore;"
```
*(Note: If your PostgreSQL password is not `postgres`, you may need to update the credentials at the very top of `server.js`)*

### Step 4: Start the Server
With everything installed, start the backend engine:
```bash
npm start
```
*Look at your terminal!*
*   If you see `✅ Connected to PostgreSQL successfully.`, your database is working!
*   If you see `⚠️ PostgreSQL not detected. Entering DEMO MODE.`, the app intelligently bypassed the database and loaded the sample data.

### Step 5: Open the Webpage
Open Chrome, Edge, or Firefox and navigate to:
👉 **http://localhost:3000**

---

## 🔐 Default Logins

Want to explore the Admin Dashboard? Use these credentials on the Sign In page:

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | admin@bookstore.com     | admin123   |
| User  | *Just register a new account!* | *Any* |

---

## 🗂️ Project Structure

For developers looking to explore the code:
```text
bookstore/
 ├── server.js          # The Node.js Express server & Database connection
 ├── package.json       # Project metadata and dependencies (`npm install`)
 ├── setup.sql          # SQL Schema (Auto-executed by server.js if needed)
 ├── index.html         # The main UI (Single Page Application)
 ├── style.css          # All design, themes, CSS variables, and animations
 └── app.js             # The Frontend logic (API fetching, Cart, Auth state)
```

---

## 🛠 Tech Stack

| Layer | Tools Used |
| :--- | :--- |
| **Frontend UI** | HTML5, CSS3 (Custom Variables), Vanilla JavaScript |
| **Backend API** | Node.js, Express.js |
| **Database** | PostgreSQL `pg` (with In-Memory Fallback Array) |
| **Security** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Typography** | Google Fonts (Playfair Display for headings, DM Sans for text) |
