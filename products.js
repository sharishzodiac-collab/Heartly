/**
 * Heartly E-Commerce Prototype - Single Source Product Manager
 * Loads products from product.json (with safe file:// fallback)
 * and dynamically renders products on items.html, category.html, and index.html.
 */

const HeartlyProducts = {
  // Built-in fallback matching product.json exactly (ensures 100% offline & file:// protocol support)
  FALLBACK_DATA: [
    {
      "id": 1,
      "title": "Golden Dairy Treat",
      "category": "Chocolates",
      "price": 28.00,
      "description": "Rich artisanal milk chocolates with a silky caramel finish.",
      "image": "image/dairy.jpeg"
    },
    {
      "id": 2,
      "title": "Forest Friendship Bouquet",
      "category": "Flowers",
      "price": 42.00,
      "description": "A fresh meadow mix with roses, eucalyptus and subtle wildflowers.",
      "image": "image/fox.jpeg"
    },
    {
      "id": 3,
      "title": "Candlelight Calm Kit",
      "category": "Wellness",
      "price": 33.00,
      "description": "A hand-poured candle and calming ritual set for cozy evenings.",
      "image": "image/lamp.jpeg"
    },
    {
      "id": 4,
      "title": "Morning Ritual Tea",
      "category": "Wellness",
      "price": 24.00,
      "description": "A bright tea blend designed to awaken the senses and inspire the day.",
      "image": "image/2cup.jpeg"
    },
    {
      "id": 5,
      "title": "Berry Charm Treat",
      "category": "Chocolates",
      "price": 26.00,
      "description": "Sweet berry bites with a creamy center and crisp shell.",
      "image": "image/bcup.jpeg"
    },
    {
      "id": 6,
      "title": "Delightful Keepsake Doll",
      "category": "Gifts",
      "price": 37.00,
      "description": "A handcrafted plush companion with artisanal details.",
      "image": "image/doll.jpeg"
    },
    {
      "id": 7,
      "title": "Serene Soap Trio",
      "category": "Wellness",
      "price": 19.00,
      "description": "Three scented botanical soaps made for gentle, luxurious care.",
      "image": "image/lamp.jpeg"
    },
    {
      "id": 8,
      "title": "Sunset Tea Set",
      "category": "Chocolates",
      "price": 49.00,
      "description": "An elegant tea set with artisan blends and a gift-ready box.",
      "image": "image/2cup.jpeg"
    },
    {
      "id": 9,
      "title": "Velvet Rose Arrangement",
      "category": "Flowers",
      "price": 58.00,
      "description": "Classic roses arranged in a luxurious velvet wrap.",
      "image": "image/fox.jpeg"
    },
    {
      "id": 10,
      "title": "Morning Bloom Basket",
      "category": "Flowers",
      "price": 47.00,
      "description": "A cheerful basket of seasonal flowers with fresh green accents.",
      "image": "image/dairy.jpeg"
    },
    {
      "id": 11,
      "title": "Lavender Rest Set",
      "category": "Wellness",
      "price": 34.00,
      "description": "A soothing set with lavender balm and botanical mist.",
      "image": "image/fox.jpeg"
    },
    {
      "id": 12,
      "title": "Sugar & Spice Treat",
      "category": "Chocolates",
      "price": 31.00,
      "description": "A warm baked-inspired collection for cozy celebrations.",
      "image": "image/2cup.jpeg"
    }
  ],

  products: [],
  activeCategory: 'all',
  activeSort: 'popular',

  // 1. Fetch & Load Products
  async loadProducts() {
    try {
      const response = await fetch('product.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        this.products = data;
      } else {
        this.products = this.FALLBACK_DATA;
      }
    } catch (err) {
      // In file:// protocol or offline, safely use the single-source fallback
      console.info('Loaded product dataset via local fallback (file:// protocol):', err.message);
      this.products = this.FALLBACK_DATA;
    }

    window.HEARTLY_PRODUCTS = this.products;
    return this.products;
  },

  getProductById(id) {
    return this.products.find(p => String(p.id) === String(id));
  },

  // 2. Render items.html ("All Items")
  renderItemsPage() {
    const grid = document.querySelector('.items-grid');
    if (!grid) return;

    const countHeader = document.querySelector('.section-header-content p');
    if (countHeader) {
      countHeader.textContent = `Discover ${this.products.length} premium items for your next handcrafted surprise.`;
    }

    grid.innerHTML = this.products.map(p => `
      <article class="product-card" data-id="${p.id}" data-category="${p.category.toLowerCase()}">
          <img src="${p.image}" alt="${p.title}" loading="lazy" />
          <div class="product-card-body">
              <div>
                  <h3 class="product-card-title">${p.title}</h3>
                  <p class="product-card-desc">${p.description}</p>
              </div>
              <div class="product-card-foot">
                  <span class="product-card-price">$${Number(p.price).toFixed(2)}</span>
                  <button class="btn-card" 
                          data-id="${p.id}" 
                          data-name="${p.title}" 
                          data-price="${p.price}" 
                          data-image="${p.image}" 
                          data-category="${p.category}">
                      Add
                  </button>
                  <span class="product-card-badge">${p.category}</span>
              </div>
          </div>
      </article>
    `).join('');

    // Re-bind cart listeners if HeartlyCart is loaded
    if (typeof HeartlyCart !== 'undefined' && HeartlyCart.bindAddButtons) {
      HeartlyCart.bindAddButtons();
    }
  },

  // 3. Render category.html ("Curated Collections")
  renderCategoryPage() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    // Update Category Counts in Sidebar
    const counts = {
      all: this.products.length,
      chocolates: this.products.filter(p => p.category.toLowerCase() === 'chocolates').length,
      flowers: this.products.filter(p => p.category.toLowerCase() === 'flowers').length,
      wellness: this.products.filter(p => p.category.toLowerCase() === 'wellness').length,
      gifts: this.products.filter(p => p.category.toLowerCase() === 'gifts').length
    };

    document.querySelectorAll('.cat-list .cat').forEach(catLink => {
      const catKey = (catLink.dataset.category || '').toLowerCase();
      const em = catLink.querySelector('em');
      if (em) {
        if (counts[catKey] !== undefined) {
          em.textContent = counts[catKey];
        } else if (catKey === 'new') {
          em.textContent = this.products.slice(0, 4).length;
        }
      }
    });

    // Render filtered and sorted list
    this.updateCategoryGrid();

    // Bind Category Filter clicks
    document.querySelectorAll('.cat-list .cat').forEach(catLink => {
      catLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.cat-list .cat').forEach(c => c.classList.remove('is-active'));
        catLink.classList.add('is-active');

        this.activeCategory = (catLink.dataset.category || 'all').toLowerCase();
        this.updateCategoryGrid();
      });
    });

    // Bind Sort dropdown
    const sortSelect = document.querySelector('.sort select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const val = e.target.value.toLowerCase();
        if (val.includes('low to high')) {
          this.activeSort = 'price-asc';
        } else if (val.includes('high to low')) {
          this.activeSort = 'price-desc';
        } else if (val.includes('newest')) {
          this.activeSort = 'newest';
        } else {
          this.activeSort = 'popular';
        }
        this.updateCategoryGrid();
      });
    }
  },

  updateCategoryGrid() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    let list = [...this.products];

    // Filter
    if (this.activeCategory && this.activeCategory !== 'all') {
      if (this.activeCategory === 'new') {
        list = list.slice(0, 4);
      } else {
        list = list.filter(p => p.category.toLowerCase() === this.activeCategory);
      }
    }

    // Sort
    if (this.activeSort === 'price-asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (this.activeSort === 'price-desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (this.activeSort === 'newest') {
      list.sort((a, b) => b.id - a.id);
    } else {
      // Popular (default order)
      list.sort((a, b) => a.id - b.id);
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #666;">
          <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌸</p>
          <h3>No gifts found in this category</h3>
          <p>Try exploring another collection.</p>
        </div>
      `;
    } else {
      grid.innerHTML = list.map(p => `
        <article class="card" data-id="${p.id}" data-category="${p.category.toLowerCase()}">
          <div class="card-media">
            <img src="${p.image}" alt="${p.title}" loading="lazy" />
            <button class="fav" aria-label="Save ${p.title}">
              <svg viewBox="0 0 24 24" class="icon"><path d="M12 21s-8-4.7-8-10a4.6 4.6 0 0 1 8-3.1A4.6 4.6 0 0 1 20 11c0 5.3-8 10-8 10z"/></svg>
            </button>
            <span class="badge">${p.category}</span>
          </div>
          <div class="card-body">
            <div class="card-head">
              <h3>${p.title}</h3>
              <span class="price">$${Number(p.price).toFixed(2)}</span>
            </div>
            <p>${p.description}</p>
            <button class="btn btn-primary btn-pill btn-block"
                    data-id="${p.id}" 
                    data-name="${p.title}" 
                    data-price="${p.price}" 
                    data-image="${p.image}" 
                    data-category="${p.category}">
              <svg viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              Add to Surprise
            </button>
          </div>
        </article>
      `).join('');
      // Add favorite toggle click listener
      grid.querySelectorAll('.fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          btn.classList.toggle('is-active');
        });
      });
    }

    // Update pagination count
    const paginationText = document.querySelector('.pagination p');
    if (paginationText) {
      paginationText.textContent = `Showing ${list.length} of ${this.products.length} artisanal gifts`;
    }

    // Re-bind cart listeners if HeartlyCart is loaded
    if (typeof HeartlyCart !== 'undefined' && HeartlyCart.bindAddButtons) {
      HeartlyCart.bindAddButtons();
    }
  },

  // 4. Update index.html Trending cards dynamically
  renderIndexPage() {
    const bentoGrid = document.querySelector('.bento-grid');
    if (!bentoGrid || this.products.length < 2) return;

    const largeCard = bentoGrid.querySelector('.card-large');
    const smallCard = bentoGrid.querySelector('.card-small');

    if (largeCard && this.products[1]) {
      const p1 = this.products[1]; // Forest Friendship Bouquet
      const img = largeCard.querySelector('img');
      const title = largeCard.querySelector('h3');
      const desc = largeCard.querySelector('.card-description');
      const price = largeCard.querySelector('.card-price');
      const btn = largeCard.querySelector('.btn-card, .btn');

      if (img) { img.src = p1.image; img.alt = p1.title; }
      if (title) title.textContent = p1.title;
      if (desc) desc.textContent = p1.description;
      if (price) price.textContent = `$${Number(p1.price).toFixed(2)}`;
      if (btn) {
        btn.dataset.id = p1.id;
        btn.dataset.name = p1.title;
        btn.dataset.price = p1.price;
        btn.dataset.image = p1.image;
        btn.dataset.category = p1.category;
      }
    }

    if (smallCard && this.products[0]) {
      const p0 = this.products[0]; // Golden Dairy Treat
      const img = smallCard.querySelector('img');
      const title = smallCard.querySelector('h3');
      const desc = smallCard.querySelector('.card-description');
      const price = smallCard.querySelector('.card-price');
      const btn = smallCard.querySelector('.btn-card, .btn');

      if (img) { img.src = p0.image; img.alt = p0.title; }
      if (title) title.textContent = p0.title;
      if (desc) desc.textContent = p0.description;
      if (price) price.textContent = `$${Number(p0.price).toFixed(2)}`;
      if (btn) {
        btn.dataset.id = p0.id;
        btn.dataset.name = p0.title;
        btn.dataset.price = p0.price;
        btn.dataset.image = p0.image;
        btn.dataset.category = p0.category;
      }
    }

    if (typeof HeartlyCart !== 'undefined' && HeartlyCart.bindAddButtons) {
      HeartlyCart.bindAddButtons();
    }
  },

  // 5. Initialize
  async init() {
    await this.loadProducts();

    const path = window.location.pathname.toLowerCase();
    if (document.querySelector('.items-grid') || path.includes('items.html')) {
      this.renderItemsPage();
    }
    if (document.querySelector('.product-grid') || path.includes('category.html')) {
      this.renderCategoryPage();
    }
    if (document.querySelector('.bento-grid') || path.includes('index.html') || path.endsWith('/') || path === '') {
      this.renderIndexPage();
    }

    window.dispatchEvent(new CustomEvent('heartly-products-loaded', { detail: { products: this.products } }));
  }
};

// Initialize once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HeartlyProducts.init());
} else {
  HeartlyProducts.init();
}
