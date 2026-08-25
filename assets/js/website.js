/* ============================================================
   Product catalog data & rendering for products.html
   ============================================================ */
(function() {
  'use strict';

  /* ---------- Product catalog (12 selected) ---------- */
  const allProducts = [
    // Health & Wellness (3)
    { id: 'hw2', name: 'Calmag', category: 'health-wellness', tag: 'Calms Restful Sleep', price: 38000, img: 'calmag.webp', desc: 'Calming magnesium for restful sleep and relaxation.' },
    { id: 'hw3', name: 'Elken Spirulina', category: 'health-wellness', tag: 'Daily Nutrition', price: 52000, img: 'elken-spirulina.webp', desc: 'Premium spirulina for daily energy and immunity.' },
    { id: 'hw1', name: 'C-Joie Flex', category: 'health-wellness', tag: 'Joint Support', price: 45000, img: 'c-joie-flex.webp', desc: 'Flexible joint support for active lifestyles.' },

    // Beauty & Skincare (2)
    { id: 'bs1', name: 'Advanced Age Recovery', category: 'beauty-skincare', tag: 'Anti-Aging', price: 68000, img: 'advanced-age-recovery.webp', desc: 'Advanced anti-aging formula for youthful skin.' },
    { id: 'bs5', name: 'Naru Hydra', category: 'beauty-skincare', tag: 'Deep Hydration', price: 48000, img: 'naru-hydra.webp', desc: 'Intense hydration for dry, thirsty skin.' },

    // Home Appliances (3)
    { id: 'ha2', name: 'Bio Pure N200', category: 'home-appliances', tag: '200 GPD UV', price: 560000, img: 'bio-pure-n200.webp', desc: 'UV sterilization with alkaline boost.' },
    { id: 'ha3', name: 'Bio Pure N300', category: 'home-appliances', tag: '300 GPD Hot/Cold', price: 1240000, img: 'bio-pure-n300.webp', desc: 'Hot and cold drinking water for offices.' },
    { id: 'ha6', name: 'Hydromi NH101', category: 'home-appliances', tag: '101 GPD Coin', price: 720000, img: 'hydromi-nh101.webp', desc: 'Coin-operated public water dispenser.' },

    // Food & Beverage (1)
    { id: 'fb1', name: 'Elcafe', category: 'food-beverage', tag: 'Coffee', price: 25000, img: 'elcafe.webp', desc: 'Premium instant coffee blend.' },

    // Personal & Home Care (2)
    { id: 'ph1', name: 'Body Basics', category: 'personal-home-care', tag: 'Daily Care', price: 15000, img: 'body-basics.webp', desc: 'Gentle body wash for everyday freshness.' },
    { id: 'ph6', name: 'Tricho Pro', category: 'personal-home-care', tag: 'Hair Care', price: 16000, img: 'tricho-pro.webp', desc: 'Professional hair care treatment.' },

    // Wellness Devices (1)
    { id: 'wd1', name: 'Bes Massage Device', category: 'wellness-devices', tag: 'Massage', price: 95000, img: 'bes-massage-device.webp', desc: 'Portable massage device for muscle relief.' },
  ];

  /* ---------- Category metadata ---------- */
  const categories = {
    'health-wellness': { label: 'Health & Wellness', eyebrow: '健康营养', color: '#26a57b' },
    'beauty-skincare': { label: 'Beauty & Skincare', eyebrow: '美容护肤', color: '#c2185b' },
    'home-appliances': { label: 'Home Appliances', eyebrow: '家居设备', color: '#1976d2' },
    'food-beverage': { label: 'Food & Beverage', eyebrow: '食品饮品', color: '#ff9800' },
    'personal-home-care': { label: 'Personal & Home Care', eyebrow: '个护与家居护理', color: '#7b1fa2' },
    'wellness-devices': { label: 'Wellness Devices', eyebrow: '健康设备', color: '#00796b' },
  };

  /* ---------- Cart & Order (web checkout) ---------- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem('al.cart') || '[]'); }
    catch { return []; }
  }
  function saveCart(cart) { localStorage.setItem('al.cart', JSON.stringify(cart)); window.dispatchEvent(new CustomEvent('al:cartchange')); }

  /* ---------- Country dial codes ---------- */
  const COUNTRY_CODES = [
    { code: '+234', label: 'Nigeria (+234)' },
    { code: '+60', label: 'Malaysia (+60)' },
    { code: '+65', label: 'Singapore (+65)' },
    { code: '+62', label: 'Indonesia (+62)' },
    { code: '+66', label: 'Thailand (+66)' },
    { code: '+63', label: 'Philippines (+63)' },
    { code: '+86', label: 'China (+86)' },
    { code: '+91', label: 'India (+91)' },
    { code: '+1', label: 'USA / Canada (+1)' },
    { code: '+44', label: 'United Kingdom (+44)' },
  ];
  const DEFAULT_DIAL = '+234';
  // Reusable "dial code + number" phone field
  function phoneFieldHTML(selected, name) {
    const opts = COUNTRY_CODES.map(c =>
      `<option value="${c.code}"${c.code === selected ? ' selected' : ''}>${c.label}</option>`
    ).join('');
    return `
      <div class="phone-input-wrap">
        <select class="select phone-dial" name="${name}_dial" aria-label="Country code">${opts}</select>
        <input class="input phone-number" name="${name}" type="tel" required inputmode="tel" placeholder="123 456 789" />
      </div>`;
  }
  function readPhone(form, baseName) {
    const dial = (form.querySelector(`[name="${baseName}_dial"]`) || {}).value || DEFAULT_DIAL;
    const num = ((form.querySelector(`[name="${baseName}"]`) || {}).value || '').trim().replace(/[^\d]/g, '');
    if (!num) return '';
    return dial + ' ' + num;
  }
  // Show a stored phone (+60 123456789) in a dial+number pair, e.g. when editing
  function fillPhoneFields(host, value) {
    if (!host) return;
    const dial = host.querySelector('.phone-dial');
    const num = host.querySelector('.phone-number');
    if (!dial || !num) return;
    const m = String(value || '').match(/^(\+\d{1,4})?\s*(.*)$/);
    const code = m && m[1] ? m[1] : DEFAULT_DIAL;
    const digits = m ? m[2].trim() : String(value || '');
    if (dial.value !== code) {
      const opt = Array.from(dial.options).find(o => o.value === code);
      if (opt) dial.value = code;
    }
    num.value = digits;
  }

  /* ---------- BV rewards ---------- */
  // 1 BV per N1,000 of product value (round down to whole BV)
  function getBV(product) {
    if (!product) return 0;
    if (typeof product.bv === 'number') return Math.max(0, Math.round(product.bv));
    return Math.max(0, Math.round((product.price || 0) / 1000));
  }
  function getBVTotal() {
    return getMyOrders().reduce((s, o) => s + (o.bv || 0), 0);
  }

  /* ---------- Member ID & account-bound orders ---------- */
  // 10-digit member ID: "NG" + 8 random digits, e.g. NG12345678
  function genMemberId() {
    let digits = '';
    for (let i = 0; i < 8; i++) digits += Math.floor(Math.random() * 10);
    return 'NG' + digits;
  }
  function getCurrentMemberId() {
    const u = window.Auth && window.Auth.user;
    if (u && u.memberId) return u.memberId;
    // fall back to email-based stable id, else generate one
    if (u) {
      const id = genMemberId();
      u.memberId = id;
      window.Auth.user = u;
      return id;
    }
    return null;
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem('al.orders') || '[]'); }
    catch { return []; }
  }
  // Orders belonging to the signed-in account only.
  // Legacy orders without a memberId are excluded ("clear existing data").
  function getMyOrders() {
    const mid = getCurrentMemberId();
    if (!mid) return [];
    return getOrders().filter(o => o.memberId === mid);
  }
  // Physically remove orders not tied to any account (pre-binding leftovers).
  function pruneOrphanOrders() {
    const orders = getOrders().filter(o => !!o.memberId);
    localStorage.setItem('al.orders', JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('al:orderschange'));
  }
  function addOrder(order) {
    const orders = getOrders();
    order.memberId = order.memberId || getCurrentMemberId();
    orders.unshift(order);
    localStorage.setItem('al.orders', JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('al:orderschange'));
    return order;
  }
  function genOrderId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'AQ-' + s;
  }

  /* ---------- Render products page ---------- */
  function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');

    const listing = document.getElementById('productListing');
    const chooser = document.getElementById('categoryChooser');

    if (cat && categories[cat]) {
      chooser.hidden = true;
      listing.hidden = false;
      document.title = `${categories[cat].label} · AquaLife`;

      const catTitle = document.getElementById('categoryTitle');
      const catIntro = document.getElementById('categoryIntro');
      if (catTitle) catTitle.textContent = categories[cat].label;
      if (catIntro) catIntro.textContent = categories[cat].eyebrow;

      const filtered = allProducts.filter(p => p.category === cat);
      renderProductCards(grid, filtered);
    } else {
      chooser.hidden = true;
      listing.hidden = false;
      document.title = 'Products · AquaLife';

      const catTitle = document.getElementById('categoryTitle');
      const catIntro = document.getElementById('categoryIntro');
      if (catTitle) catTitle.textContent = 'All Products';
      if (catIntro) catIntro.textContent = 'Browse our full range of health, beauty, and home products.';

      renderProductCards(grid, allProducts);
    }
  }

  function renderProductCards(container, products) {
    if (!container) return;
    const loggedIn = !!(window.Auth && window.Auth.isLoggedIn());
    container.innerHTML = products.map(p => {
      const detailUrl = `product-detail.html?name=${encodeURIComponent(p.name)}&category=${p.category}`;
      return `
      <div class="demo-product-card" data-detail="${detailUrl}">
        <div class="pic">
          <img src="assets/img/products/${p.category}/${p.img}" alt="${p.name}" loading="lazy" />
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
        </div>
        <div class="body">
          <h3>${p.name}</h3>
          <p class="desc">${p.desc}</p>
          <div class="price-row">
            <span class="price">N${p.price.toLocaleString()}</span>
            ${loggedIn ? `<span class="bv-chip" title="Rewards you earn with this purchase">${getBV(p)} BV</span>` : ''}
          </div>
          <div class="card-actions">
            <button type="button" class="btn btn-primary btn-sm card-order-btn" data-product="${p.id}">Order Now<span class="phase-badge">二期</span></button>
            <a href="${detailUrl}" class="btn btn-outline btn-sm card-detail-btn">Details</a>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Wire "Order Now" buttons → checkout page (login gated)
    container.querySelectorAll('.card-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.product;
        const product = allProducts.find(x => x.id === id);
        if (product) goCheckout(product);
      });
    });

    // Make the whole product card (image/title area) navigate to detail, except the action buttons
    container.querySelectorAll('.demo-product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        const url = card.dataset.detail;
        if (url) location.href = url;
      });
    });
  }

  /* ---------- Home popular tiles: category-tile style, links to detail, no order button ---------- */
  function renderPopularTiles(container, products) {
    if (!container) return;
    container.innerHTML = (products || []).map(p => {
      const detailUrl = `product-detail.html?name=${encodeURIComponent(p.name)}&category=${p.category}`;
      const price = `N${Number(p.price || 0).toLocaleString()}`;
      return `
      <a class="category-tile popular-tile" href="${detailUrl}">
        <img src="assets/img/products/${p.category}/${p.img}" alt="${p.name}" loading="lazy" />
        <span><strong>${p.name}</strong><small>${price}</small></span>
      </a>`;
    }).join('');
  }

  /* ---------- Cart badge ---------- */
  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const cart = getCart();
    const total = cart.reduce((s, c) => s + c.qty, 0);
    if (badge) {
      badge.textContent = total || '';
      badge.style.display = total ? '' : 'none';
    }
  }
  window.addEventListener('al:cartchange', updateCartBadge);
  window.updateCartBadge = updateCartBadge;

  /* ---------- Checkout redirect helper (login gate) ---------- */
  function goCheckout(product) {
    const url = 'checkout.html?id=' + encodeURIComponent(product.id) + '&qty=1';
    if (!(window.Auth && window.Auth.isLoggedIn())) {
      location.href = 'login.html?next=' + encodeURIComponent(url);
      return;
    }
    location.href = url;
  }
  window.goCheckout = goCheckout;


  /* ---------- Expose globally ---------- */
  window.ProductCatalog = {
    allProducts,
    categories,
    render: renderProducts,
    renderCards: renderProductCards,
    renderPopularTiles,
    getOrders,
    getMyOrders,
    pruneOrphanOrders,
    addOrder,
    getBV,
    getBVTotal,
    genMemberId,
    getCurrentMemberId,
    COUNTRY_CODES,
    DEFAULT_DIAL,
    phoneFieldHTML,
    readPhone,
    fillPhoneFields,
  };

  /* ---------- Init on DOM ready ---------- */
  if (document.body.dataset.page === 'products') {
    document.addEventListener('DOMContentLoaded', renderProducts);
  }

  /* ---------- Listen for language changes & auth changes ---------- */
  window.addEventListener('al:langchange', renderProducts);
  window.addEventListener('al:authchange', renderProducts);

})();
