/**
 * Heartly E-Commerce Prototype - Shared Cart & Order State Manager
 * Handles localStorage persistence, cart calculations, navbar badges, 
 * dynamic checkout rendering, and live tracking data.
 */

const HeartlyCart = {
  STORAGE_KEY: 'heartly_cart',
  ORDER_KEY: 'heartly_last_order',

  // 1. Storage Helpers
  getItems() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading Heartly cart from localStorage:', e);
      return [];
    }
  },

  saveItems(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      this.updateCartBadges();
      window.dispatchEvent(new CustomEvent('heartly-cart-changed', { detail: { items } }));
    } catch (e) {
      console.error('Error saving Heartly cart to localStorage:', e);
    }
  },

  // 2. Cart Operations
  addItem(product) {
    let items = this.getItems();
    const id = product.id || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingIndex = items.findIndex(i => i.id === id || i.name === product.name);

    if (existingIndex > -1) {
      items[existingIndex].quantity += 1;
    } else {
      items.push({
        id: id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.image || 'image/g.jpeg',
        category: product.category || 'Artisanal Gift',
        quantity: 1
      });
    }

    this.saveItems(items);
    this.showToast(product.name);
  },

  removeItem(id) {
    let items = this.getItems().filter(item => item.id !== id);
    this.saveItems(items);
    if (window.location.pathname.includes('checkout.html')) {
      this.renderCheckoutSummary();
    }
  },

  updateQty(id, delta) {
    let items = this.getItems();
    const target = items.find(item => item.id === id);
    if (!target) return;

    target.quantity += delta;
    if (target.quantity <= 0) {
      items = items.filter(item => item.id !== id);
    }

    this.saveItems(items);
    if (window.location.pathname.includes('checkout.html')) {
      this.renderCheckoutSummary();
    }
  },

  clearCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartBadges();
  },

  getTotals() {
    const items = this.getItems();
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Free delivery over $100, $0 when cart is empty, otherwise $12.00
    const delivery = subtotal === 0 ? 0 : (subtotal >= 100 ? 0 : 12.00);
    // Joy insurance & estimated tax ~ 6%
    const tax = subtotal === 0 ? 0 : (subtotal * 0.06);
    const total = subtotal + delivery + tax;

    return {
      subtotal,
      delivery,
      tax,
      total,
      count
    };
  },

  // 3. UI Helpers
  updateCartBadges() {
    const totals = this.getTotals();
    const badges = document.querySelectorAll('.cart-badge, #cart-count');
    badges.forEach(badge => {
      badge.textContent = totals.count;
      badge.classList.remove('bump');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('bump');
      setTimeout(() => badge.classList.remove('bump'), 300);
    });
  },

  showToast(productName) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <span class="toast-icon">
        <svg viewBox="0 0 24 24" class="icon" style="width:20px; height:20px; stroke:#b7102a; fill:none; stroke-width:2;"><path d="M5.8 11.3L2 22l10.7-3.8M4 3h.01M22 8h.01M15 2h.01M22 20h.01M11 13l9-9"/></svg>
      </span>
      <div>
        <p class="toast-title" style="margin:0; font-weight:700;">Added to Surprise!</p>
        <p class="toast-text" style="margin:2px 0 0; font-size:13px; color:#555;">
          ${productName} saved. <a href="checkout.html" style="color:#b7102a; text-decoration:underline; font-weight:600;">Proceed to Checkout &rarr;</a>
        </p>
      </div>
    `;

    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  },

  // 4. Automatic Event Binding for Product Cards
  bindAddButtons() {
    // 1. category.html (.card)
    document.querySelectorAll('.card').forEach(card => {
      const btn = card.querySelector('.btn-primary, .card-body .btn');
      if (!btn || btn._cartBound) return;
      btn._cartBound = true;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const titleEl = card.querySelector('.card-head h3, h3');
        const priceEl = card.querySelector('.card-head .price, .price');
        const imgEl = card.querySelector('.card-media img, img');

        const name = btn.dataset.name || (titleEl ? titleEl.textContent.trim() : 'Artisanal Surprise');
        const price = parseFloat(btn.dataset.price) || (priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 45);
        const image = btn.dataset.image || (imgEl ? imgEl.getAttribute('src') : 'image/g.jpeg');
        const category = btn.dataset.category || 'Collections';

        HeartlyCart.addItem({
          id: btn.dataset.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          price,
          image,
          category
        });
      });
    });

    // 2. items.html (.product-card)
    document.querySelectorAll('.product-card').forEach(card => {
      const btn = card.querySelector('.btn-card');
      if (!btn || btn._cartBound) return;
      btn._cartBound = true;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const titleEl = card.querySelector('.product-card-title');
        const priceEl = card.querySelector('.product-card-price');
        const imgEl = card.querySelector('img');
        const badgeEl = card.querySelector('.product-card-badge');

        const name = btn.dataset.name || (titleEl ? titleEl.textContent.trim() : 'Artisanal Item');
        const price = parseFloat(btn.dataset.price) || (priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 28);
        const image = btn.dataset.image || (imgEl ? imgEl.getAttribute('src') : 'image/dairy.jpeg');
        const category = btn.dataset.category || (badgeEl ? badgeEl.textContent.trim() : 'Gift');

        HeartlyCart.addItem({
          id: btn.dataset.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          price,
          image,
          category
        });
      });
    });

    // 3. index.html trending cards (.card-large, .card-small)
    document.querySelectorAll('.card-large, .card-small').forEach(card => {
      const btn = card.querySelector('.btn-card, .btn-primary');
      if (!btn || btn._cartBound) return;
      btn._cartBound = true;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const titleEl = card.querySelector('h3');
        const priceEl = card.querySelector('.card-price');
        const imgEl = card.querySelector('img');

        const name = btn.dataset.name || (titleEl ? titleEl.textContent.trim() : 'Trending Surprise');
        const price = parseFloat(btn.dataset.price) || (priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 85);
        const image = btn.dataset.image || (imgEl ? imgEl.getAttribute('src') : 'image/box.jpeg');
        const category = btn.dataset.category || 'Trending';

        HeartlyCart.addItem({
          id: btn.dataset.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          price,
          image,
          category
        });
      });
    });
  },

  // 5. Checkout Page Dynamic Rendering
  renderCheckoutSummary() {
    const summaryAside = document.querySelector('.hy-summary');
    if (!summaryAside) return;

    const items = this.getItems();
    const totals = this.getTotals();

    // If cart is empty, provide a fallback or friendly prompt
    if (items.length === 0) {
      summaryAside.innerHTML = `
        <h2>Order Summary</h2>
        <div style="padding: 24px 12px; text-align: center; background: #fff; border-radius: 12px; border: 1px dashed #e4bebc; margin-bottom: 1.5rem;">
          <p style="font-size: 1.1rem; margin-bottom: 6px;">🎁</p>
          <p style="font-weight: 700; color: #1a1b1e; margin-bottom: 4px;">Your Surprise Box is Empty</p>
          <p style="font-size: 0.85rem; color: #6c6c78; margin-bottom: 14px;">Pick from our curated artisan collections to start your gift.</p>
          <a href="category.html" class="btn btn-primary btn-pill" style="display:inline-flex; text-decoration:none; padding:8px 18px; font-size:13px; background:#b7102a; color:#fff; border-radius:999px;">
            Browse Collections &rarr;
          </a>
        </div>
        <div class="hy-line"><span>Subtotal</span><strong>$0.00</strong></div>
        <div class="hy-line"><span>Delivery Fee</span><strong>$0.00</strong></div>
        <div class="hy-line"><span>Joy Insurance & Tax</span><strong>$0.00</strong></div>
        <div class="hy-total"><span>Total</span><b>$0.00</b></div>
        <button type="button" class="hy-cta" style="opacity: 0.5; cursor: not-allowed;" onclick="alert('Please add at least one gift item to your box before completing the order!')">
          Complete Joyful Order
        </button>
        <div class="hy-guarantee" style="margin-top: 1.5rem;">
          <span class="hy-badge">✨</span>
          <div>
            <h3>Heartly Happiness Guarantee</h3>
            <p>100% joyful handcrafted surprises with proof-of-delivery notice.</p>
          </div>
        </div>
      `;
      return;
    }

    // Build items HTML list
    const itemsHtml = items.map(item => `
      <div class="hy-item" data-id="${item.id}" style="align-items:center; margin-bottom: 0.85rem; padding-bottom: 0.85rem; border-bottom: 1px solid rgba(0,0,0,0.06);">
        <img class="hy-thumb" src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" />
        <div style="flex: 1; min-width: 0;">
          <p class="hy-item-name" style="margin: 0; font-weight: 600; font-size: 0.875rem;">${item.name}</p>
          <p class="hy-item-desc" style="margin: 2px 0 4px; font-size: 0.75rem; color: #888;">${item.category || 'Handcrafted'}</p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="hy-price" style="font-weight: 700; color: #b7102a; font-size: 0.875rem;">$${(item.price * item.quantity).toFixed(2)}</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" class="qty-btn" onclick="HeartlyCart.updateQty('${item.id}', -1)" style="width:22px; height:22px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">-</button>
              <span style="font-size:0.8rem; font-weight:600; min-width:16px; text-align:center;">${item.quantity}</span>
              <button type="button" class="qty-btn" onclick="HeartlyCart.updateQty('${item.id}', 1)" style="width:22px; height:22px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">+</button>
              <button type="button" onclick="HeartlyCart.removeItem('${item.id}')" title="Remove item" style="background:none; border:none; color:#999; cursor:pointer; font-size:14px; margin-left:4px;">&times;</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    summaryAside.innerHTML = `
      <h2>Order Summary (${totals.count} item${totals.count > 1 ? 's' : ''})</h2>
      <div class="hy-items-container" style="max-height: 280px; overflow-y: auto; margin-bottom: 1rem; padding-right: 4px;">
        ${itemsHtml}
      </div>
      <div class="hy-line"><span>Subtotal</span><strong>$${totals.subtotal.toFixed(2)}</strong></div>
      <div class="hy-line"><span>Delivery Fee</span><span class="${totals.delivery === 0 ? 'hy-free' : ''}">${totals.delivery === 0 ? 'FREE' : '$' + totals.delivery.toFixed(2)}</span></div>
      <div class="hy-line"><span>Joy Insurance & Tax</span><strong>$${totals.tax.toFixed(2)}</strong></div>
      <div class="hy-total"><span>Total</span><b>$${totals.total.toFixed(2)}</b></div>
      <button type="button" id="btn-complete-order" class="hy-cta" style="width:100%; border:none; border-radius:8px; background:#b7102a; color:#fff; padding:12px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Complete Joyful Order ($${totals.total.toFixed(2)})
      </button>
      <p class="hy-secure" style="display:flex; justify-content:center; align-items:center; gap:4px; font-size:12px; color:#888; margin-top:10px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3z"/><path d="m9 12 2 2 4-4"/></svg>
        256-bit Secure Encryption
      </p>
      <div class="hy-guarantee" style="margin-top:1rem;">
        <span class="hy-badge">✨</span>
        <div>
          <h3>Heartly Happiness Guarantee</h3>
          <p>Not 100% joyful? We'll replace it for free, no questions asked.</p>
        </div>
      </div>
    `;

    // Bind Order Submission
    const completeBtn = document.getElementById('btn-complete-order');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        this.processCheckout();
      });
    }
  },

  processCheckout() {
    const items = this.getItems();
    if (items.length === 0) {
      alert('Your cart is empty! Please select at least one gift item.');
      return;
    }

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const msgInput = document.getElementById('msg');
    const streetInput = document.getElementById('street');
    const cityInput = document.getElementById('city');
    const zipInput = document.getElementById('zip');

    const receiverName = (nameInput && nameInput.value.trim()) || 'Sarah Jenkins';
    const receiverPhone = (phoneInput && phoneInput.value.trim()) || '+1 (555) 234-5678';
    const receiverEmail = (emailInput && emailInput.value.trim()) || 'sarah@example.com';
    const giftMessage = (msgInput && msgInput.value.trim()) || 'Thinking of you today! Hope this artisanal surprise brings pure joy to your day.';
    const street = (streetInput && streetInput.value.trim()) || '123 Artisan Way';
    const city = (cityInput && cityInput.value.trim()) || 'Nashville';
    const zip = (zipInput && zipInput.value.trim()) || '37201';

    const totals = this.getTotals();
    const orderNumber = 'HTLY-' + Math.floor(10000 + Math.random() * 90000);

    const orderData = {
      orderId: orderNumber,
      receiverName,
      receiverPhone,
      receiverEmail,
      giftMessage,
      address: `${street}, ${city}, ${zip}`,
      items,
      totals,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Out for Delivery'
    };

    try {
      localStorage.setItem(this.ORDER_KEY, JSON.stringify(orderData));
      
      // If a user is logged in, link this order to their profile history!
      if (typeof HeartlyAuth !== 'undefined' && HeartlyAuth.recordOrderForCurrentUser) {
        HeartlyAuth.recordOrderForCurrentUser(orderData);
      }

      // Clear active cart once placed
      this.clearCart();
    } catch (e) {
      console.error('Error saving order:', e);
    }

    // Redirect to tracking page
    window.location.href = 'track.html';
  },

  // 6. Tracking Page Dynamic Update
  renderTrackingPage() {
    try {
      const orderJson = localStorage.getItem(this.ORDER_KEY);
      if (!orderJson) return;
      const order = JSON.parse(orderJson);

      // 1. Update Order # & Receiver Name in subhead
      const pageSub = document.querySelector('.page-sub');
      if (pageSub) {
        const phoneSnippet = order.receiverPhone ? ` &bull; 📞 ${order.receiverPhone}` : '';
        pageSub.innerHTML = `Order <strong>#${order.orderId}</strong> &bull; Sent to <strong>${order.receiverName}</strong>${phoneSnippet}`;
      }

      // 2. Update Gift Message in Preview Card
      const previewText = document.querySelector('.preview-text');
      if (previewText && order.giftMessage) {
        previewText.textContent = `"${order.giftMessage}"`;
      }

      // 3. Update Progress Panel / Items Ordered
      const progressPanel = document.querySelector('.progress-panel');
      if (progressPanel && order.items && order.items.length > 0) {
        let itemsSnippet = document.getElementById('track-ordered-items');
        if (!itemsSnippet) {
          itemsSnippet = document.createElement('div');
          itemsSnippet.id = 'track-ordered-items';
          itemsSnippet.style.cssText = 'border-top: 1px solid #f0f0f0; margin-top: 16px; padding-top: 16px;';
          progressPanel.appendChild(itemsSnippet);
        }

        const itemsList = order.items.map(it => `
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-size:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${it.image}" alt="${it.name}" style="width:24px; height:24px; border-radius:4px; object-fit:cover;" />
              <span style="font-weight:600; color:#333;">${it.name} &times; ${it.quantity}</span>
            </div>
            <span style="color:#b7102a; font-weight:700;">$${(it.price * it.quantity).toFixed(2)}</span>
          </div>
        `).join('');

        itemsSnippet.innerHTML = `
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#999; margin-bottom:8px;">
            Items in This Surprise (${order.items.length})
          </div>
          ${itemsList}
          <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:6px; border-top:1px dashed #eee; font-weight:700; font-size:12px;">
            <span>Total Paid</span>
            <span style="color:#b7102a;">$${order.totals.total.toFixed(2)}</span>
          </div>
        `;
      }
    } catch (e) {
      console.error('Error rendering tracking details:', e);
    }
  },

  // 7. Initialize
  init() {
    this.updateCartBadges();
    this.bindAddButtons();

    const path = window.location.pathname.toLowerCase();
    if (path.includes('checkout.html')) {
      this.renderCheckoutSummary();
    } else if (path.includes('track.html')) {
      this.renderTrackingPage();
    }
  }
};

// Re-bind when dynamic catalog finishes loading
window.addEventListener('heartly-products-loaded', () => {
  HeartlyCart.bindAddButtons();
});

// Initialize once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HeartlyCart.init());
} else {
  HeartlyCart.init();
}
