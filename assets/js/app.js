/* ============================================================
   AquaLease · App shell · i18n · shared interactions
   ============================================================ */
(function () {
  'use strict';

  const STORAGE = {
    LANG: 'al.lang',
    CART: 'al.cart',
    DRAFT: 'al.checkout.draft',
    PAYMENT: 'al.payment.cache',
    ORDER: 'al.order',
    ORDERS: 'al.orders',
    AGREEMENT: 'al.agreement.signed',
    AUTH: 'al.auth.user',
    PROFILE: 'al.profile',
    ADDRESSES: 'al.addresses',
    PREFS: 'al.prefs',
  };

  /* ---------- Auth state ---------- */
  const Auth = {
    get user() {
      try { return JSON.parse(localStorage.getItem(STORAGE.AUTH) || 'null'); }
      catch { return null; }
    },
    set user(v) {
      if (v == null) localStorage.removeItem(STORAGE.AUTH);
      else localStorage.setItem(STORAGE.AUTH, JSON.stringify(v));
    },
    isLoggedIn() { return !!this.user; },
    login(user) {
      this.user = user;
      window.dispatchEvent(new CustomEvent('al:authchange', { detail: { user } }));
    },
    logout() {
      this.user = null;
      // also clear any order/payment/agreement draft that belongs to this session
      // (keeps the logged-out state consistent for next visitor)
      window.dispatchEvent(new CustomEvent('al:authchange', { detail: { user: null } }));
    },
  };
  window.Auth = Auth;

  const Money = {
    format(n) {
      if (n == null) return '—';
      return '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    formatShort(n) {
      if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
      if (n >= 1_000) return '₦' + Math.round(n / 1000) + 'K';
      return '₦' + n;
    },
  };

  const T = {
    get current() { return localStorage.getItem(STORAGE.LANG) || 'en'; },
    set current(v) { localStorage.setItem(STORAGE.LANG, v); },
    get dict() { return (window.I18N && window.I18N[this.current]) || window.I18N.en; },
    /** tr('hero.title_a') */
    tr(path, params) {
      const dict = this.dict;
      const parts = path.split('.');
      let v = dict;
      for (const p of parts) { if (v == null) return path; v = v[p]; }
      if (v == null) return path;
      if (typeof v === 'string' && params) for (const [k, val] of Object.entries(params)) v = v.replaceAll(`{${k}}`, val);
      return v;
    },
    /** trArray('hero.items') — returns an array (or null) */
    trArray(path) {
      const dict = this.dict;
      const parts = path.split('.');
      let v = dict;
      for (const p of parts) { if (v == null) return null; v = v[p]; }
      return Array.isArray(v) ? v : null;
    },
    /** t('Home') — auto picks from active lang, falls back to English */
    pick(en) {
      const cur = this.dict;
      const parts = en.split('.');
      let v = cur; for (const p of parts) { if (v == null) { v = null; break; } v = v[p]; }
      if (typeof v === 'string') return v;
      let f = window.I18N.en; for (const p of parts) { if (f == null) return en; f = f[p]; }
      return typeof f === 'string' ? f : en;
    },
  };
  window.T = T;
  window.Money = Money;

  /* ---------- Format helpers ---------- */
  function fmtDate(d) {
    if (typeof d === 'string' || typeof d === 'number') d = new Date(d);
    if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(T.current === 'zh' ? 'zh-CN' : 'en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function fmtNum(n) { return new Intl.NumberFormat(T.current === 'zh' ? 'zh-CN' : 'en-GB').format(n); }
  window.fmtDate = fmtDate; window.fmtNum = fmtNum;

  /* ---------- Header render ---------- */
  function renderHeader(active) {
    const inverted = document.body.dataset.header === 'inverted';
    const cur = T.current;
    const langs = ['en', 'zh', 'ha', 'yo', 'ig'];
    const user = Auth.user;
    const loggedIn = !!user;
    const navItems = [
      ['home', T.tr('nav.home'), 'index.html'],
      ['products', T.tr('nav.products'), 'products.html'],
      ['mall', T.tr('nav.mall'), 'mall.html'],
      ['service', T.tr('nav.service'), 'service.html'],
      ['about', T.tr('nav.about'), 'about.html'],
    ];
    const accountLabel = T.tr('nav.account');
    const accountHref = loggedIn ? 'account.html' : 'login.html';
    const accountActive = active === 'account' || (active === 'login' && !loggedIn);
    const headerHTML = `
      <header class="site-header ${inverted ? 'inverted' : ''}">
        <div class="container bar">
          <a href="index.html" class="brand" aria-label="AquaLease">
            <span class="mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3 C 8 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-2-6-6-12z"></path>
              </svg>
            </span>
            <span class="word">
              AquaLease
              <small>Water · on terms</small>
            </span>
          </a>
          <nav class="nav" aria-label="Primary">
            ${navItems.map(([k, label, href]) => `<a href="${href}" class="${active === k ? 'active' : ''}">${label}</a>`).join('')}
            <a href="${accountHref}" class="${accountActive ? 'active' : ''}">${accountLabel}</a>
          </nav>
          <div class="header-actions">
            <div class="lang-switch">
              <button class="lang-btn" id="langBtn" aria-haspopup="listbox" aria-expanded="false">
                <span>${T.dict.short}</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5l3 3 3-3"/></svg>
              </button>
              <div class="lang-menu" id="langMenu" role="listbox">
                ${langs.map(l => `<button data-lang="${l}" class="${l === cur ? 'active' : ''}">${window.I18N[l].name}<span class="tag">${window.I18N[l].short}</span></button>`).join('')}
              </div>
            </div>
            ${loggedIn ? `
              <button class="icon-btn" aria-label="Notifications" data-tip="3 alerts">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
                <span class="dot"></span>
              </button>
              <a href="account.html" class="btn btn-dark btn-sm btn-account" title="${T.tr('nav.account')}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>${T.tr('nav.account')}</span>
              </a>
              <button class="btn btn-ghost btn-sm" id="headerLogout" data-i18n="common.logout">${T.tr('common.logout')}</button>
            ` : `
              <a href="login.html" class="btn btn-dark btn-sm" data-i18n="common.sign_in">${T.tr('common.sign_in')}</a>
              <a href="signup.html" class="btn btn-ghost btn-sm" data-i18n="common.sign_up">${T.tr('common.sign_up')}</a>
            `}
            <button class="hamburger" id="openDrawer" aria-label="Menu"><span></span></button>
          </div>
        </div>
      </header>
      <div class="drawer" id="drawer" aria-hidden="true">
        <div class="drawer-panel">
          <div class="drawer-head">
            <a href="index.html" class="brand">
              <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 C 8 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-2-6-6-12z"/></svg></span>
              <span class="word">AquaLease<small>Water · on terms</small></span>
            </a>
            <button class="icon-btn" id="closeDrawer" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          </div>
          <nav class="drawer-nav">
            ${navItems.map(([k, label, href]) => `<a href="${href}" class="${active === k ? 'active' : ''}">${label}</a>`).join('')}
            <a href="${accountHref}" class="${accountActive ? 'active' : ''}">${accountLabel}</a>
          </nav>
          <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
            ${langs.map(l => `<button data-lang="${l}" class="btn ${l === cur ? 'btn-primary' : 'btn-light'} btn-sm" style="font-family:var(--font-mono)">${window.I18N[l].short}</button>`).join('')}
          </div>
        </div>
      </div>
      <a class="wa-fab" href="https://wa.me/2348000000000" target="_blank" rel="noopener" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2.5C6.8 2.5 2.6 6.7 2.6 12c0 1.7.5 3.4 1.5 4.8L2.5 21.5l4.8-1.6c1.4.8 3 1.2 4.7 1.2 5.2 0 9.4-4.2 9.4-9.4 0-2.5-1-4.9-2.8-6.6-1.7-1.8-4.1-2.8-6.6-2.8z"/></svg>
      </a>
    `;
    const host = document.getElementById('app-header');
    if (host) host.innerHTML = headerHTML;
    wireHeader();
  }

  function wireHeader() {
    const langBtn = document.getElementById('langBtn');
    const langMenu = document.getElementById('langMenu');
    if (langBtn && langMenu) {
      langBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = langMenu.classList.toggle('show');
        langBtn.setAttribute('aria-expanded', open);
      });
      document.addEventListener('click', () => langMenu.classList.remove('show'));
      langMenu.addEventListener('click', e => {
        const btn = e.target.closest('button[data-lang]');
        if (btn) {
          T.current = btn.dataset.lang;
          location.reload();
        }
      });
    }
    const drawer = document.getElementById('drawer');
    document.getElementById('openDrawer')?.addEventListener('click', () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); });
    document.getElementById('closeDrawer')?.addEventListener('click', () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); });
    drawer?.addEventListener('click', e => { if (e.target === drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); } });
    drawer?.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { T.current = b.dataset.lang; location.reload(); }));

    // Header logout (when signed in)
    document.getElementById('headerLogout')?.addEventListener('click', () => {
      Auth.logout();
      window.toast('Signed out. See you soon.', 'success');
      // small delay so the toast is visible before navigation
      setTimeout(() => { window.location.href = 'index.html'; }, 400);
    });

    // Cross-page auth state sync: re-render the header if login state changes
    window.addEventListener('al:authchange', () => {
      renderHeader(document.body.dataset.page);
    });
  }

  /* ---------- Footer render ---------- */
  function renderFooter() {
    const host = document.getElementById('app-footer');
    if (!host) return;
    host.innerHTML = `
      <footer class="site-footer">
        <div class="grain"></div>
        <div class="container">
          <div class="footer-top">
            <div class="footer-brand">
              <a href="index.html" class="brand">
                <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 C 8 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-2-6-6-12z"/></svg></span>
                <span class="word">AquaLease<small>Water · on terms</small></span>
              </a>
              <p>${T.tr('about.sub')}</p>
            </div>
            <div>
              <h5>Product</h5>
              <ul>
                <li><a href="products.html">${T.tr('nav.products')}</a></li>
                <li><a href="mall.html">${T.tr('nav.mall')}</a></li>
                <li><a href="service.html">${T.tr('nav.service')}</a></li>
              </ul>
            </div>
            <div>
              <h5>Company</h5>
              <ul>
                <li><a href="about.html">${T.tr('nav.about')}</a></li>
                <li><a href="account.html">${T.tr('nav.account')}</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            <div>
              <h5>Support</h5>
              <ul>
                <li><a href="#">Help centre</a></li>
                <li><a href="https://wa.me/2348000000000" target="_blank" rel="noopener">WhatsApp</a></li>
                <li><a href="mailto:hello@aqualease.ng">hello@aqualease.ng</a></li>
                <li><a href="#">+234 800 000 0000</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2026 AquaLease Nigeria · Reg. RC-1938472</span>
            <div class="pay">
              <span class="chip">VISA</span>
              <span class="chip">MASTERCARD</span>
              <span class="chip">USSD</span>
              <span class="chip">PAYSTACK</span>
              <span class="chip">FLUTTERWAVE</span>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  /* ---------- Toast ---------- */
  function toast(msg, kind) {
    let host = document.querySelector('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
    const el = document.createElement('div');
    el.className = 'toast' + (kind === 'success' ? ' toast-success' : '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = 'all .2s'; setTimeout(() => el.remove(), 220); }, 2600);
  }
  window.toast = toast;

  /* ---------- Offline indicator ---------- */
  function wireOffline() {
    const bar = document.getElementById('offline-banner');
    if (!bar) return;
    const update = () => bar.classList.toggle('show', !navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }

  /* ---------- Loading button helper ---------- */
  function bindLoadingBtns() {
    document.querySelectorAll('[data-loading]').forEach(btn => {
      btn.addEventListener('click', e => {
        if (btn.getAttribute('aria-busy') === 'true') return;
        if (btn.dataset.confirm && !window.confirm(btn.dataset.confirm)) { e.preventDefault(); return; }
        btn.setAttribute('aria-busy', 'true');
        const label = btn.querySelector('[data-label]');
        const old = label ? label.innerHTML : btn.innerHTML;
        if (label) label.innerHTML = `<span class="spinner"></span> ${T.tr('common.loading')}`;
        else btn.innerHTML = `<span class="spinner"></span> ${T.tr('common.loading')}`;
        setTimeout(() => { btn.setAttribute('aria-busy', 'false'); if (label) label.innerHTML = old; else btn.innerHTML = old; }, 1600);
      });
    });
  }

  /* ---------- Auth gate: redirect to login if user clicks order/checkout while signed out ---------- */
  function wireAuthGate() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href*="checkout.html"]');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('data-no-auth-gate')) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (Auth.isLoggedIn()) return;
      e.preventDefault();
      if (window.toast) window.toast(window.T.tr('login.need_signin'));
      const next = encodeURIComponent(new URL(href, location.href).pathname + new URL(href, location.href).search);
      setTimeout(() => { location.href = `login.html?next=${next}`; }, 220);
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(document.body.dataset.page);
    renderFooter();
    wireOffline();
    bindLoadingBtns();
    wireAuthGate();
  });

  /* ---------- Public helpers ---------- */
  window.AL = {
    Money, T, STORAGE, fmtDate, fmtNum, toast,
    /** lease math: down + monthly + total + BV (BV is simplified: 1 BV per 1000 NGN of total) */
    calcLease(totalPrice, term) {
      const down = Math.round(totalPrice * 0.20);
      const remaining = totalPrice - down;
      const monthly = Math.round(remaining / term);
      const realTotal = down + monthly * term;
      const bv = Math.round(realTotal / 1000);
      return { down, monthly, total: realTotal, bv };
    },
    saveOrder(o) { localStorage.setItem(STORAGE.ORDER, JSON.stringify(o)); },
    loadOrder() { try { return JSON.parse(localStorage.getItem(STORAGE.ORDER) || 'null'); } catch { return null; } },
    /** All orders (array). Newest first. */
    loadOrders() { try { return JSON.parse(localStorage.getItem(STORAGE.ORDERS) || '[]'); } catch { return []; } },
    saveOrders(arr) { localStorage.setItem(STORAGE.ORDERS, JSON.stringify(arr)); },
    /** Push an order into the orders array. Keeps the latest one in `al.order` for back-compat. */
    pushOrder(o) {
      const list = this.loadOrders();
      // dedupe by id (update if exists, otherwise prepend)
      const i = list.findIndex(x => x.id === o.id);
      if (i >= 0) list[i] = o; else list.unshift(o);
      this.saveOrders(list);
      this.saveOrder(o);
    },
    /* ---------- Profile / addresses / preferences ---------- */
    loadProfile() {
      try { return JSON.parse(localStorage.getItem(STORAGE.PROFILE) || 'null') || this._profileFromAuth(); }
      catch { return this._profileFromAuth(); }
    },
    saveProfile(p) { localStorage.setItem(STORAGE.PROFILE, JSON.stringify(p)); },
    _profileFromAuth() {
      const u = Auth.user; if (!u) return null;
      return {
        firstName: u.firstName || (u.name || '').split(/\s+/)[0] || '',
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        type: u.type || 'home',
        state: u.state || '',
        city: u.city || '',
        address: u.address || '',
        verified: true,
        signedInAt: u.signedInAt || Date.now(),
        memberSince: u.signedInAt || Date.now(),
      };
    },
    loadAddresses() {
      try { return JSON.parse(localStorage.getItem(STORAGE.ADDRESSES) || 'null'); }
      catch { return null; }
    },
    saveAddresses(arr) { localStorage.setItem(STORAGE.ADDRESSES, JSON.stringify(arr)); },
    /** Returns a non-empty addresses list, seeded from auth/profile on first use. */
    getAddresses() {
      let arr = this.loadAddresses();
      if (arr) return arr;
      const u = Auth.user;
      if (!u) return [];
      const seed = {
        id: 'a_default',
        label: 'Home',
        recipient: u.name || '',
        phone: u.phone || '',
        street: u.address || '',
        city: u.city || '',
        state: u.state || '',
        isDefault: true,
      };
      arr = [seed];
      this.saveAddresses(arr);
      return arr;
    },
    upsertAddress(a) {
      const arr = this.getAddresses();
      if (a.isDefault) arr.forEach(x => x.isDefault = false);
      const i = arr.findIndex(x => x.id === a.id);
      if (i >= 0) arr[i] = { ...arr[i], ...a };
      else arr.push({ ...a, id: a.id || 'a_' + Date.now() });
      this.saveAddresses(arr);
    },
    removeAddress(id) {
      const arr = this.getAddresses().filter(x => x.id !== id);
      // ensure one default
      if (arr.length && !arr.some(x => x.isDefault)) arr[0].isDefault = true;
      this.saveAddresses(arr);
    },
    loadPrefs() {
      try { return JSON.parse(localStorage.getItem(STORAGE.PREFS) || 'null') || { email: true, sms: true, wa: true, billing: true, marketing: false }; }
      catch { return { email: true, sms: true, wa: true, billing: true, marketing: false }; }
    },
    savePrefs(p) { localStorage.setItem(STORAGE.PREFS, JSON.stringify(p)); },
    cachePay(data) {
      const all = JSON.parse(localStorage.getItem(STORAGE.PAYMENT) || '{}');
      Object.assign(all, data);
      localStorage.setItem(STORAGE.PAYMENT, JSON.stringify(all));
    },
    loadPay() { try { return JSON.parse(localStorage.getItem(STORAGE.PAYMENT) || '{}'); } catch { return {}; } },
  };
})();
