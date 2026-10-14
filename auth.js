/**
 * Heartly E-Commerce Prototype - User Authentication & Accounting Manager
 * Handles User Registration, Login Sessions, Profile Management,
 * Order History binding, and Navbar User State.
 */

const HeartlyAuth = {
  USERS_KEY: 'heartly_users',
  SESSION_KEY: 'heartly_current_user',

  // 1. Storage Helpers
  getUsers() {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      if (data) return JSON.parse(data);

      // Default seed demo account for Harish
      const seedUsers = [
        {
          id: 'USR-10001',
          fullName: 'Harish Kumar',
          email: 'harish@heartly.gift',
          password: 'password123',
          phone: '+91 98765 43210',
          joinedDate: 'Oct 2024',
          avatar: 'H',
          addresses: [
            {
              id: 'addr-1',
              title: 'Primary Residence',
              receiverName: 'Harish Kumar',
              street: '42 Blossom Boulevard, Suite 3B',
              city: 'Bengaluru',
              zip: '560001',
              isDefault: true
            }
          ],
          orders: [
            {
              orderId: 'HTLY-99283',
              receiverName: 'Sarah Jenkins',
              date: 'May 12, 10:30 AM',
              status: 'Out for Delivery',
              total: 107.45,
              giftMessage: 'Hope these artisanal blooms bring as much light to your day as you bring to mine!',
              items: [
                { id: 'the-midnight-bloom', name: 'The Midnight Bloom', price: 85.00, quantity: 1, image: 'image/box.jpeg' },
                { id: 'morning-ritual-tea', name: 'Morning Ritual Tea', price: 24.00, quantity: 1, image: 'image/2cup.jpeg' }
              ]
            }
          ]
        }
      ];

      localStorage.setItem(this.USERS_KEY, JSON.stringify(seedUsers));
      return seedUsers;
    } catch (e) {
      console.error('Error reading users from localStorage:', e);
      return [];
    }
  },

  saveUsers(users) {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  },

  getCurrentUser() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      console.error('Error reading current session:', e);
      return null;
    }
  },

  setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
      this.updateNavUI();
      window.dispatchEvent(new CustomEvent('heartly-auth-changed', { detail: { user } }));
    } catch (e) {
      console.error('Error updating current session:', e);
    }
  },

  // 2. Auth Actions
  register({ fullName, email, password, phone = '' }) {
    if (!fullName || !email || !password) {
      return { success: false, message: 'Please fill in all required fields.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please sign in.' };
    }

    const initials = fullName.trim().charAt(0).toUpperCase();
    const newUser = {
      id: 'USR-' + Math.floor(10000 + Math.random() * 90000),
      fullName: fullName.trim(),
      email: cleanEmail,
      password: password, // For MySQL integration later, this will be hashed with bcrypt
      phone: phone.trim(),
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatar: initials || 'U',
      addresses: [],
      orders: []
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  login({ email, password }) {
    if (!email || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user || user.password !== password) {
      return { success: false, message: 'Incorrect email or password. Please try again.' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  },

  logout() {
    this.setCurrentUser(null);
    window.location.href = 'index.html';
  },

  // 3. Profile Updates
  updateProfile({ fullName, phone }) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user is signed in.' };

    currentUser.fullName = fullName.trim() || currentUser.fullName;
    currentUser.phone = phone.trim() || currentUser.phone;
    currentUser.avatar = currentUser.fullName.charAt(0).toUpperCase();

    // Update in users array
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx > -1) {
      users[idx] = { ...users[idx], ...currentUser };
      this.saveUsers(users);
    }

    this.setCurrentUser(currentUser);
    return { success: true, user: currentUser };
  },

  addAddress({ title, receiverName, street, city, zip }) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    if (!currentUser.addresses) currentUser.addresses = [];
    const newAddr = {
      id: 'addr-' + Date.now(),
      title: title || 'Saved Address',
      receiverName: receiverName || currentUser.fullName,
      street,
      city,
      zip,
      isDefault: currentUser.addresses.length === 0
    };

    currentUser.addresses.push(newAddr);

    // Save in storage
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx > -1) {
      users[idx].addresses = currentUser.addresses;
      this.saveUsers(users);
    }
    this.setCurrentUser(currentUser);
    return true;
  },

  recordOrderForCurrentUser(orderData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    if (!currentUser.orders) currentUser.orders = [];

    const orderRecord = {
      orderId: orderData.orderId,
      receiverName: orderData.receiverName,
      date: orderData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: orderData.status || 'Out for Delivery',
      total: orderData.totals ? orderData.totals.total : (orderData.total || 0),
      giftMessage: orderData.giftMessage,
      address: orderData.address,
      items: orderData.items || []
    };

    currentUser.orders.unshift(orderRecord);

    // Persist to users array
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx > -1) {
      users[idx].orders = currentUser.orders;
      this.saveUsers(users);
    }

    this.setCurrentUser(currentUser);
  },

  // 4. Navbar UI Synchronization
  updateNavUI() {
    const user = this.getCurrentUser();
    const containers = document.querySelectorAll('.nav-auth-slot');

    containers.forEach(container => {
      if (user) {
        container.innerHTML = `
          <a href="profile.html" class="nav-user-pill" title="View Profile (${user.fullName})">
            <span class="user-avatar-badge">${user.avatar || 'U'}</span>
            <span class="user-name-text">${user.fullName.split(' ')[0]}</span>
          </a>
        `;
      } else {
        container.innerHTML = `
          <a href="auth.html" class="nav-login-btn" title="Sign In or Register">
            <svg viewBox="0 0 24 24" class="nav-user-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Sign In</span>
          </a>
        `;
      }
    });
  },

  // 5. Auth Page Form Logic
  initAuthPage() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const alertBox = document.getElementById('auth-alert');

    const showAlert = (message, isError = true) => {
      if (!alertBox) return;
      alertBox.textContent = message;
      alertBox.className = 'auth-alert ' + (isError ? 'error' : 'success');
      alertBox.style.display = 'block';
    };

    const clearAlert = () => {
      if (alertBox) alertBox.style.display = 'none';
    };

    // Tab switching
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        clearAlert();
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        if (formLogin) formLogin.style.display = 'block';
        if (formRegister) formRegister.style.display = 'none';
      });

      tabRegister.addEventListener('click', () => {
        clearAlert();
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        if (formLogin) formLogin.style.display = 'none';
        if (formRegister) formRegister.style.display = 'block';
      });
    }

    // Login Form Submit
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlert();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        const res = this.login({ email, password: pass });
        if (res.success) {
          showAlert(`Welcome back, ${res.user.fullName}! Redirecting...`, false);
          setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect') || 'profile.html';
            window.location.href = redirect;
          }, 800);
        } else {
          showAlert(res.message, true);
        }
      });
    }

    // Quick Demo Login Button
    const demoBtn = document.getElementById('btn-demo-login');
    if (demoBtn) {
      demoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const res = this.login({ email: 'harish@heartly.gift', password: 'password123' });
        if (res.success) {
          showAlert(`Signed in as Demo User: Harish Kumar! Redirecting...`, false);
          setTimeout(() => {
            window.location.href = 'profile.html';
          }, 600);
        }
      });
    }

    // Register Form Submit
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlert();
        const fullName = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-password').value;
        const confirmPass = document.getElementById('reg-confirm').value;

        if (pass !== confirmPass) {
          showAlert('Passwords do not match. Please verify.', true);
          return;
        }

        const res = this.register({ fullName, email, password: pass, phone });
        if (res.success) {
          showAlert(`Welcome to Heartly, ${res.user.fullName}! Your account has been created.`, false);
          setTimeout(() => {
            window.location.href = 'profile.html';
          }, 900);
        } else {
          showAlert(res.message, true);
        }
      });
    }
  },

  // 6. Profile Page Rendering Logic
  initProfilePage() {
    const user = this.getCurrentUser();
    const guestState = document.getElementById('profile-guest-state');
    const authState = document.getElementById('profile-auth-state');

    if (!user) {
      if (guestState) guestState.style.display = 'block';
      if (authState) authState.style.display = 'none';
      return;
    }

    if (guestState) guestState.style.display = 'none';
    if (authState) authState.style.display = 'block';

    // Populate User Details
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const phoneEl = document.getElementById('user-display-phone');
    const joinedEl = document.getElementById('user-display-joined');
    const avatarEl = document.getElementById('user-large-avatar');

    if (nameEl) nameEl.textContent = user.fullName;
    if (emailEl) emailEl.textContent = user.email;
    if (phoneEl) phoneEl.textContent = user.phone || 'No phone added';
    if (joinedEl) joinedEl.textContent = `Member since ${user.joinedDate || '2024'}`;
    if (avatarEl) avatarEl.textContent = user.avatar || user.fullName.charAt(0).toUpperCase();

    // Stats
    const orders = user.orders || [];
    const totalSpent = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
    const activeCount = orders.filter(ord => ord.status && ord.status.toLowerCase().includes('delivery')).length;

    const countOrdersEl = document.getElementById('stat-total-orders');
    const countActiveEl = document.getElementById('stat-active-deliveries');
    const totalSpentEl = document.getElementById('stat-total-spent');

    if (countOrdersEl) countOrdersEl.textContent = orders.length;
    if (countActiveEl) countActiveEl.textContent = activeCount;
    if (totalSpentEl) totalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;

    // Populate Orders List
    const ordersContainer = document.getElementById('profile-orders-list');
    if (ordersContainer) {
      if (orders.length === 0) {
        ordersContainer.innerHTML = `
          <div class="empty-state-card">
            <span class="empty-icon">🎁</span>
            <h3>No Surprises Sent Yet</h3>
            <p>Ready to make someone's heart skip a beat? Browse our curated collections.</p>
            <a href="category.html" class="btn btn-primary btn-pill">Start a Surprise &rarr;</a>
          </div>
        `;
      } else {
        ordersContainer.innerHTML = orders.map(ord => {
          const itemsHtml = (ord.items || []).map(it => `
            <div class="profile-order-item-thumb">
              <img src="${it.image}" alt="${it.name}" />
              <span>${it.name} &times; ${it.quantity}</span>
            </div>
          `).join('');

          return `
            <div class="profile-order-card">
              <div class="order-card-header">
                <div>
                  <span class="order-id-badge">#${ord.orderId}</span>
                  <span class="order-date">${ord.date}</span>
                </div>
                <div class="order-status-pill status-${(ord.status || 'Delivered').toLowerCase().replace(/\s+/g, '-')}">
                  ${ord.status || 'Confirmed'}
                </div>
              </div>
              <div class="order-card-body">
                <div class="order-recipient-info">
                  <strong>Receiver:</strong> ${ord.receiverName}
                </div>
                ${ord.giftMessage ? `<p class="order-message-preview">"${ord.giftMessage}"</p>` : ''}
                <div class="order-items-row">
                  ${itemsHtml}
                </div>
              </div>
              <div class="order-card-footer">
                <div class="order-total-amount">
                  Total: <strong>$${(ord.total || 0).toFixed(2)}</strong>
                </div>
                <a href="track.html" class="btn-track-order">
                  View Tracking &rarr;
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Populate Saved Addresses
    const addressesContainer = document.getElementById('profile-addresses-list');
    if (addressesContainer) {
      const addrs = user.addresses || [];
      if (addrs.length === 0) {
        addressesContainer.innerHTML = `
          <div class="empty-state-card" style="padding:1.5rem;">
            <p style="color:#777; margin-bottom:12px;">No addresses saved yet.</p>
          </div>
        `;
      } else {
        addressesContainer.innerHTML = addrs.map(a => `
          <div class="profile-address-card">
            <div class="address-title">
              <strong>${a.title}</strong>
              ${a.isDefault ? '<span class="default-badge">Default</span>' : ''}
            </div>
            <p class="address-text">${a.street}<br>${a.city}, ${a.zip}</p>
          </div>
        `).join('');
      }
    }

    // Handle Edit Profile Form
    const editForm = document.getElementById('form-edit-profile');
    if (editForm) {
      const editName = document.getElementById('edit-name');
      const editPhone = document.getElementById('edit-phone');
      if (editName) editName.value = user.fullName;
      if (editPhone) editPhone.value = user.phone || '';

      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const res = this.updateProfile({
          fullName: editName.value,
          phone: editPhone.value
        });
        if (res.success) {
          alert('Profile successfully updated!');
          this.initProfilePage();
        }
      });
    }

    // Handle Add Address Form
    const addAddrForm = document.getElementById('form-add-address');
    if (addAddrForm) {
      addAddrForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('addr-title').value;
        const street = document.getElementById('addr-street').value;
        const city = document.getElementById('addr-city').value;
        const zip = document.getElementById('addr-zip').value;

        if (this.addAddress({ title, street, city, zip })) {
          alert('Address saved!');
          addAddrForm.reset();
          this.initProfilePage();
        }
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to sign out?')) {
          this.logout();
        }
      });
    }
  },

  // 7. Initialize
  init() {
    this.updateNavUI();

    const path = window.location.pathname.toLowerCase();
    if (path.includes('auth.html')) {
      this.initAuthPage();
    } else if (path.includes('profile.html')) {
      this.initProfilePage();
    }
  }
};

// Initialize once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HeartlyAuth.init());
} else {
  HeartlyAuth.init();
}
