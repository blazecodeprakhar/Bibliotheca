// 📚 Bibliotheca - Frontend Logic

// Global State
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentToken = localStorage.getItem('token') || null;
let allBooks = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentAdminTab = 'books';
let editBookId = null;
let currentCheckoutStep = 1;
let selectedPaymentMethod = null;

// ✨ Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    updateCartBadge();
    if (currentUser) {
        fetchBooks();
        if (currentUser.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
    }
});

// -- AUTH LOGIC --

function switchTab(type) {
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById('loginForm').classList.toggle('hidden', type !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', type !== 'register');
    event.target.classList.add('active');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) return showToast('Please fill all fields', 'error');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        saveAuth(data.user, data.token);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        checkAuthState();
        fetchBooks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) return showToast('Missing information', 'error');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        saveAuth(data.user, data.token);
        showToast('Account created successfully!', 'success');
        checkAuthState();
        fetchBooks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function saveAuth(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    currentUser = user;
    currentToken = token;
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
}

function checkAuthState() {
    const authOverlay = document.getElementById('authOverlay');
    const app = document.getElementById('app');
    const userBadge = document.getElementById('userBadge');

    if (currentUser && currentToken) {
        authOverlay.classList.add('hidden');
        app.classList.remove('hidden');
        userBadge.innerText = currentUser.name.charAt(0).toUpperCase();
        if(currentUser.role === 'admin') document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    } else {
        authOverlay.classList.remove('hidden');
        app.classList.add('hidden');
    }
}

// -- NAVIGATION --

function showPage(pageId) {
    console.log('Navigating to:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Deactivate all links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Page not found:', `${pageId}Page`);
        return;
    }

    // Set link active (find by onclick)
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link.getAttribute('onclick')?.includes(`'${pageId}'`)) {
            link.classList.add('active');
        }
    });

    if (pageId === 'orders') fetchMyOrders();
    if (pageId === 'admin') fetchAdminDashboard();
    if (pageId === 'store') renderBooks(allBooks);
}

// -- STORE LOGIC --

async function fetchBooks() {
    try {
        const response = await fetch('/api/books');
        allBooks = await response.json();
        renderGenres();
        renderBooks(allBooks);
    } catch (err) { console.error('Failed to fetch books'); }
}

function renderGenres() {
    const genres = ['All', ...new Set(allBooks.map(b => b.genre))];
    const genreBar = document.getElementById('genreBar');
    genreBar.innerHTML = genres.map(g => `
        <button class="genre-pill ${g === 'All' ? 'active' : ''}" onclick="filterByGenre('${g}')">${g}</button>
    `).join('');
}

function filterByGenre(genre) {
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    
    const filtered = genre === 'All' ? allBooks : allBooks.filter(b => b.genre === genre);
    renderBooks(filtered);
}

function debounceSearch() {
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(() => {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allBooks.filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.author.toLowerCase().includes(query)
    );
    renderBooks(filtered);
  }, 300);
}

function renderBooks(books) {
    const grid = document.getElementById('booksGrid');
    if (books.length === 0) {
        grid.innerHTML = '<div class="loading-state">No books found matching your criteria.</div>';
        return;
    }

    grid.innerHTML = books.map(book => `
        <div class="book-card" style="--delay: ${Math.random() * 0.2}s">
            <div class="book-cover" style="background-color: ${book.cover_color || '#6366f1'}">
                <div class="book-cover-icon">${book.icon || '📚'}</div>
                <div class="book-genre-tag">${book.genre}</div>
                <div class="book-stock-badge ${book.stock > 0 ? 'in-stock' : 'out-stock'}">
                    ${book.stock > 0 ? book.stock + ' in stock' : 'Out of Stock'}
                </div>
            </div>
            <div class="book-body">
                <h4 class="book-title" title="${book.title}">${book.title}</h4>
                <p class="book-author">${book.author}</p>
                <div class="book-rating">★ ★ ★ ★ ☆ <span>(4.5)</span></div>
                <p class="book-desc">${book.description || 'No description available for this masterpiece.'}</p>
                <div class="book-footer">
                    <div class="book-price">₹${book.price}</div>
                    <button class="buy-btn" ${book.stock <= 0 ? 'disabled' : ''} onclick="addToCart(${book.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// -- ORDERS LOGIC --

async function fetchMyOrders() {
    try {
        const response = await fetch('/api/orders/my', {
            headers: { 'Authorization': currentToken }
        });
        const data = await response.json();
        
        if (data.error) {
            if (response.status === 401 || response.status === 403) {
                showToast('Session expired. Please log in again.', 'error');
                logout();
                return;
            }
            throw new Error(data.error);
        }
        
        renderOrders(data);
    } catch (err) { 
        console.error('Failed to fetch orders:', err);
        showToast('Could not load orders.', 'error');
    }
}

function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    if (orders.length === 0) {
        list.innerHTML = `
            <div class="loading-state" style="padding: 100px 0;">
                <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 20px;">📦</div>
                <h3>Your library is waiting…</h3>
                <p>You haven't ordered any books yet. Start your journey in the store!</p>
                <button class="btn-primary" style="margin-top: 24px;" onclick="showPage('store')">Browse Books</button>
            </div>
        `;
        return;
    }

    list.innerHTML = orders.map(order => `
        <div class="order-card" onclick="openOrderDetail(${order.id})">
            <div class="order-color-bar" style="background: ${order.cover_color}"></div>
            <div class="order-icon-box">${order.icon || '📚'}</div>
            <div class="order-info">
                <div class="order-title">${order.title}</div>
                <div class="order-author">by ${order.author}</div>
                <div class="order-meta">
                    <div class="order-meta-item">
                        <span>Receipt ID</span>
                        <strong>#BK-${order.id}</strong>
                    </div>
                    <div class="order-meta-item">
                        <span>Quantity</span>
                        <strong>${order.quantity} Units</strong>
                    </div>
                    <div class="order-meta-item">
                        <span>Total Amount</span>
                        <strong style="color: var(--gold)">₹${parseFloat(order.total).toLocaleString()}</strong>
                    </div>
                    <div class="order-meta-item">
                        <span>Status</span>
                        <strong style="color: var(--emerald)">${order.status || 'Confirmed'}</strong>
                    </div>
                </div>
            </div>
            <div class="order-date-tag">
                <div class="label">Ordered On</div>
                <div class="date">${new Date(order.ordered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
            </div>
        </div>
    `).join('');
}

async function openOrderDetail(orderId) {
    try {
        const response = await fetch(`/api/orders/my`, {
            headers: { 'Authorization': currentToken }
        });
        const orders = await response.json();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;

        const body = document.getElementById('orderDetailBody');
        body.innerHTML = `
            <div class="order-detail-view">
                <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
                    <div style="font-size: 2.5rem;">${order.icon || '📚'}</div>
                    <div>
                        <h4 style="margin: 0;">${order.title}</h4>
                        <small>Order #BK-${order.id}</small>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h5>📍 Delivery Address</h5>
                    <p>${order.address || 'Address info not available'}</p>
                    <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                </div>

                <div class="detail-section">
                    <h5>💳 Payment Info</h5>
                    <p><strong>Mode:</strong> ${order.payment_mode || 'N/A'}</p>
                    <p><strong>Amount:</strong> ₹${parseFloat(order.total).toLocaleString()}</p>
                </div>

                <div class="detail-section">
                    <h5>🚚 Tracking Status</h5>
                    <div class="tracking-mini">
                        <div class="track-dot done"></div>
                        <div class="track-line done"></div>
                        <div class="track-dot active"></div>
                        <div class="track-line"></div>
                        <div class="track-dot"></div>
                        <p style="margin: 10px 0 0; font-size: 0.8rem; color: var(--emerald);">Out for delivery soon</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('orderDetailModal').classList.remove('hidden');
    } catch (err) {
        console.error(err);
    }
}

function closeOrderDetail() {
    document.getElementById('orderDetailModal').classList.add('hidden');
}

// -- CART LOGIC --

function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) renderCart();
}

function addToCart(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book || book.stock <= 0) return showToast('Out of stock!', 'error');

    const cartItem = cart.find(item => item.id === bookId);
    if (cartItem) {
        if (cartItem.qty >= book.stock) return showToast('Max stock reached!', 'error');
        cartItem.qty++;
    } else {
        cart.push({ ...book, qty: 1 });
    }

    saveCart();
    showToast(`"${book.title}" added to cart!`, 'success');
}

function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cartBadge').innerText = totalQty;
    document.getElementById('cartCount').innerText = `${totalQty} items`;
}

function renderCart() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    
    if (cart.length === 0) {
        body.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">🛒</div><p>Your cart is empty.</p></div>';
        footer.classList.add('hidden');
        return;
    }

    let total = 0;
    body.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="cart-item">
                <div class="order-color-bar btn-sm" style="background: ${item.cover_color}; height: 40px; width: 4px;"></div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-meta">₹${item.price} × ${item.qty}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    }).join('');

    document.getElementById('cartTotal').innerText = `₹${total.toLocaleString()}`;
    footer.classList.remove('hidden');
}

// -- CHECKOUT FLOW LOGIC --

function openCheckout() {
    if (cart.length === 0) return showToast('Your cart is empty!', 'error');
    toggleCart(); // Close cart modal
    document.getElementById('checkoutModal').classList.remove('hidden');
    goToStep(1);
    
    // Prefill user data if available
    document.getElementById('chkName').value = currentUser.name || '';
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.add('hidden');
}

function goToStep(step) {
    // Validation for Step 1 -> Step 2
    if (step === 2 && currentCheckoutStep === 1) {
        const name = document.getElementById('chkName').value;
        const phone = document.getElementById('chkPhone').value;
        const street = document.getElementById('chkStreet').value;
        const city = document.getElementById('chkCity').value;
        const pin = document.getElementById('chkPin').value;

        if (!name || !phone || !street || !city || !pin) {
            return showToast('Please fill all address fields', 'error');
        }
    }

    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active', 'done'));

    // Show current step
    document.getElementById(`checkoutStep${step}`).classList.remove('hidden');
    currentCheckoutStep = step;

    // Update indicators
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (i < step) indicator.classList.add('done');
        if (i === step) indicator.classList.add('active');
    }

    if (step === 2) {
        renderOrderSummaryMini();
    }
}

function selectPayment(input) {
    selectedPaymentMethod = input.value;
    
    // Reset highlights
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    input.closest('.payment-option').classList.add('selected');

    // Show relevant sub-sections
    document.getElementById('upiInputSection').classList.toggle('hidden', input.value !== 'UPI / Google Pay');
    document.getElementById('netBankingSection').classList.toggle('hidden', input.value !== 'Net Banking');
    document.getElementById('cardSection').classList.toggle('hidden', input.value !== 'Credit / Debit Card');
}

function renderOrderSummaryMini() {
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    document.getElementById('orderSummaryMini').innerHTML = `
        <div style="padding: 15px; background: var(--cream-dark); border-radius: 12px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Total Items:</span>
                <strong>${cart.length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700;">
                <span>Total Amount:</span>
                <span>₹${total.toLocaleString()}</span>
            </div>
        </div>
    `;
}

async function processPayment() {
    if (!selectedPaymentMethod) return showToast('Please select a payment method', 'error');

    // Simulate payment processing delay
    const payBtn = document.getElementById('payNowBtn');
    const originalText = payBtn.innerHTML;
    payBtn.disabled = true;
    payBtn.innerHTML = 'Processing Payment...';

    setTimeout(async () => {
        try {
            const address = {
                name: document.getElementById('chkName').value,
                phone: document.getElementById('chkPhone').value,
                street: document.getElementById('chkStreet').value,
                city: document.getElementById('chkCity').value,
                state: document.getElementById('chkState').value,
                pin: document.getElementById('chkPin').value
            };

            // Order all items
            for (const item of cart) {
                await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': currentToken
                    },
                    body: JSON.stringify({ 
                        book_id: item.id, 
                        quantity: item.qty, 
                        total: (item.price * item.qty).toFixed(2),
                        address: `${address.street}, ${address.city}, ${address.state} - ${address.pin}`,
                        phone: address.phone,
                        payment_mode: selectedPaymentMethod
                    })
                });
            }

            // Show Success Step
            goToStep(3);
            renderSuccessDetails(address);
            
            // Cleanup
            cart = [];
            saveCart();
            fetchBooks();
            fetchMyOrders();

        } catch (err) {
            showToast('Order failed: ' + err.message, 'error');
        } finally {
            payBtn.disabled = false;
            payBtn.innerHTML = originalText;
        }
    }, 1500);
}

function renderSuccessDetails(address) {
    document.getElementById('successDetails').innerHTML = `
        <div style="text-align: left; padding: 20px; background: #fff; border-radius: 16px; margin: 20px 0; border: 1px dashed var(--cream-dark);">
            <div style="margin-bottom: 10px;"><strong>Deliver to:</strong><br/>${address.name}</div>
            <div style="margin-bottom: 10px;"><strong>Address:</strong><br/>${address.street}, ${address.city}</div>
            <div><strong>Payment Mode:</strong><br/>${selectedPaymentMethod}</div>
        </div>
    `;
}

async function checkout() {
    // legacy checkout function, redirected to openCheckout
    openCheckout();
}

// -- ADMIN LOGIC --

async function fetchAdminDashboard() {
    try {
        const response = await fetch('/api/admin/stats', { headers: { 'Authorization': currentToken } });
        const stats = await response.json();
        
        if (stats.error) {
            showToast(stats.error, 'error');
            if (response.status === 403) showPage('store');
            return;
        }

        renderStats(stats);
        switchAdminTab(currentAdminTab);
    } catch (err) { console.error('Admin fetch failed:', err); }
}

function renderStats(stats) {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
        <div class="stat-card" style="--delay: 0s">
            <div class="stat-icon" style="color: var(--sky)">📚</div>
            <div class="stat-value">${stats.books}</div>
            <div class="stat-label">Total Books</div>
        </div>
        <div class="stat-card" style="--delay: 0.1s">
            <div class="stat-icon" style="color: var(--accent)">⚠️</div>
            <div class="stat-value">${stats.outOfStock || 0}</div>
            <div class="stat-label">Out of Stock</div>
        </div>
        <div class="stat-card" style="--delay: 0.3s">
            <div class="stat-icon" style="color: var(--gold)">🛍️</div>
            <div class="stat-value">${stats.orders}</div>
            <div class="stat-label">Sales Count</div>
        </div>
        <div class="stat-card" style="--delay: 0.4s">
            <div class="stat-icon" style="color: #6366f1">💰</div>
            <div class="stat-value">₹${parseFloat(stats.revenue).toLocaleString()}</div>
            <div class="stat-label">Gross Revenue</div>
        </div>
    `;
}

async function switchAdminTab(tab) {
    currentAdminTab = tab;
    
    // Manage tab styles
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.remove('active');
        if (t.getAttribute('onclick')?.includes(`'${tab}'`)) {
            t.classList.add('active');
        }
    });

    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    
    if (tab === 'books') {
        document.getElementById('adminBooks').classList.remove('hidden');
        renderAdminBooks();
    } else if (tab === 'orders') {
        document.getElementById('adminOrders').classList.remove('hidden');
        const res = await fetch('/api/admin/orders', { headers: { 'Authorization': currentToken } });
        const orders = await res.json();
        if (orders.error) return showToast(orders.error, 'error');
        renderAdminOrders(orders);
    } else if (tab === 'users') {
        document.getElementById('adminUsers').classList.remove('hidden');
        const res = await fetch('/api/admin/users', { headers: { 'Authorization': currentToken } });
        const users = await res.json();
        if (users.error) return showToast(users.error, 'error');
        renderAdminUsers(users);
    }
}

function renderAdminBooks() {
    const body = document.getElementById('adminBooksBody');
    body.innerHTML = allBooks.map(b => `
        <tr>
            <td><strong>${b.title}</strong></td>
            <td>${b.author}</td>
            <td><span class="genre-pill btn-sm">${b.genre}</span></td>
            <td>₹${b.price}</td>
            <td>${b.stock}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-ghost btn-sm" onclick="openBookModal(${b.id})">Edit</button>
                    <button class="btn-danger btn-sm" onclick="deleteBook(${b.id})">Del</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderAdminOrders(orders) {
    const body = document.getElementById('adminOrdersBody');
    body.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.user_name}<br/><small>${o.user_email}</small></td>
            <td>${o.book_title}</td>
            <td>${o.quantity}</td>
            <td>₹${o.total}</td>
            <td><span class="order-status status-completed">Completed</span></td>
            <td>${new Date(o.ordered_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function renderAdminUsers(users) {
    const body = document.getElementById('adminUsersBody');
    body.innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="genre-pill btn-sm">${u.role}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// -- BOOK MODAL (Add/Edit) --

function openBookModal(id = null) {
    editBookId = id;
    const modal = document.getElementById('bookModal');
    modal.classList.remove('hidden');

    if (id) {
        const book = allBooks.find(b => b.id === id);
        document.getElementById('modalTitle').innerText = 'Edit Book';
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookGenre').value = book.genre;
        document.getElementById('bookPrice').value = book.price;
        document.getElementById('bookStock').value = book.stock;
        document.getElementById('bookDesc').value = book.description;
        document.getElementById('bookColor').value = book.cover_color;
    } else {
        document.getElementById('modalTitle').innerText = 'Add New Book';
        document.getElementById('bookTitle').value = '';
        document.getElementById('bookAuthor').value = '';
        document.getElementById('bookGenre').value = '';
        document.getElementById('bookPrice').value = '';
        document.getElementById('bookStock').value = '';
        document.getElementById('bookDesc').value = '';
        document.getElementById('bookColor').value = '#6366f1';
    }
}

function closeBookModal() {
    document.getElementById('bookModal').classList.add('hidden');
}

async function saveBook() {
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        genre: document.getElementById('bookGenre').value,
        price: document.getElementById('bookPrice').value,
        stock: document.getElementById('bookStock').value,
        description: document.getElementById('bookDesc').value,
        cover_color: document.getElementById('bookColor').value,
    };

    const method = editBookId ? 'PUT' : 'POST';
    const url = editBookId ? `/api/books/${editBookId}` : '/api/books';

    try {
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': currentToken
            },
            body: JSON.stringify(bookData)
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        showToast('Book saved successfully!', 'success');
        closeBookModal();
        fetchBooks();
        if (currentAdminTab === 'books') fetchAdminDashboard();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
        const response = await fetch(`/api/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': currentToken }
        });
        showToast('Book deleted', 'success');
        fetchBooks();
        fetchAdminDashboard();
    } catch (err) { showToast('Failed to delete book', 'error'); }
}

// -- UTILS --

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}
