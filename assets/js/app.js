/* ============================================================
   AquaLife · App shell · i18n · shared interactions
   ============================================================ */
(function () {
  'use strict';

  const STORAGE = {
    LANG: 'al.lang',
    CART: 'al.cart',
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
    // English-only site: language switching is disabled.
    get current() { return 'en'; },
    set current(v) {},
    get dict() { return (window.I18N && window.I18N.en) || window.I18N.en; },
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
    /** 把 root 下所有带 data-i18n / data-i18n-ph / data-i18n-title 的节点，按当前 T.dict 替换文案。 */
    applyI18n(root) {
      const host = root || document.body;
      if (!host) return;
      host.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = this.tr(key);
        if (val && val !== key) {
          // 若元素内只有纯文本（无嵌套子标签），直接替换 textContent；
          // 若有嵌套（常见于 footer 的链接、tab 结构），保留子标签仅替换第一文本子节点会很危险，所以统一替换 textContent。
          // 对 <input>/<textarea> 使用 placeholder 通过 data-i18n-ph 处理，避免此处误覆盖。
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
          el.textContent = val;
        }
      });
      host.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        const val = this.tr(key);
        if (val && val !== key) el.setAttribute('placeholder', val);
      });
      host.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const val = this.tr(key);
        if (val && val !== key) el.setAttribute('title', val);
      });
      host.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const val = this.tr(key);
        if (val && val !== key) el.setAttribute('aria-label', val);
      });
      // 同步 <html lang>，避免浏览器对文档语言的判断过时
      document.documentElement.lang = this.current === 'zh' ? 'zh-CN' : this.current;
    },
    /** 切换语言：English-only 站点，no-op（保留以兼容旧调用） */
    switchLang(lang) {
      if (!lang || lang === 'en') return;
      return;
    },
  };
  window.T = T;
  window.Money = Money;
  document.documentElement.lang = T.current === 'zh' ? 'zh-CN' : T.current;

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
    const user = Auth.user;
    const loggedIn = !!user;
    const navItems = [
      ['home', T.tr('nav.home'), 'index.html'],
      ['contact', T.tr('nav.contact'), 'contact.html'],
      ['about', T.tr('nav.about'), 'about.html'],
    ];
    const headerHTML = `
      <header class="site-header ${inverted ? 'inverted' : ''}">
        <div class="container bar">
          <a href="index.html" class="brand" aria-label="AquaLife">
            <span class="mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3 C 8 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-2-6-6-12z"></path>
              </svg>
            </span>
            <span class="word">
              AquaLife
              <small>Better living</small>
            </span>
          </a>
          <nav class="nav" aria-label="Primary">
            <a href="index.html" class="${active === 'home' ? 'active' : ''}">${T.tr('nav.home')}</a>
            <a href="products.html" class="${active === 'products' ? 'active' : ''}">${T.tr('nav.products')}</a>
            ${navItems.slice(1).map(([k, label, href]) => `<a href="${href}" class="${active === k ? 'active' : ''}">${label}</a>`).join('')}
          </nav>
          <div class="header-actions">
            ${loggedIn ? `
              <a href="account.html" class="btn btn-dark btn-sm btn-account" title="${T.tr('nav.account')}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>${T.tr('nav.account')}<span class="phase-badge">二期</span></span>
              </a>
              <button class="btn btn-ghost btn-sm" id="headerLogout">${T.tr('common.logout')}<span class="phase-badge">二期</span></button>
            ` : `
              <a href="login.html" class="btn btn-dark btn-sm">${T.tr('common.sign_in')}<span class="phase-badge">二期</span></a>
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
              <span class="word">AquaLife<small>Better living</small></span>
            </a>
            <button class="icon-btn" id="closeDrawer" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          </div>
          <nav class="drawer-nav">
            <a href="index.html" class="${active === 'home' ? 'active' : ''}">${T.tr('nav.home')}</a>
            <a href="products.html" class="${active === 'products' ? 'active' : ''}">${T.tr('nav.products')}</a>
            ${navItems.slice(1).map(([k, label, href]) => `<a href="${href}" class="${active === k ? 'active' : ''}">${label}</a>`).join('')}
          </nav>
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
    const drawer = document.getElementById('drawer');
    document.getElementById('openDrawer')?.addEventListener('click', () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); });
    document.getElementById('closeDrawer')?.addEventListener('click', () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); });
    drawer?.addEventListener('click', e => { if (e.target === drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); } });
    const productToggle = drawer?.querySelector('.drawer-products-toggle');
    const productCategories = drawer?.querySelector('#drawerProductCategories');
    productToggle?.addEventListener('click', () => {
      const expanded = productToggle.getAttribute('aria-expanded') === 'true';
      productToggle.setAttribute('aria-expanded', String(!expanded));
      productCategories.hidden = expanded;
    });

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
      <footer class="site-footer v2">
        <div class="grain"></div>
        <div class="container">
          <div class="footer-top">
            <div class="footer-brand">
              <a href="index.html" class="brand" aria-label="AquaLife">
                <span class="mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3 C 8 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-2-6-6-12z"/>
                  </svg>
                </span>
                <span class="word">AquaLife<small>${T.tr('footer.tagline') || 'Better living'}</small></span>
              </a>
              <p class="footer-slogan">
                <span>${T.tr('footer.slogan_a') || 'Better Products.'}</span><br>
                <span>${T.tr('footer.slogan_b') || 'Better Living.'}</span>
              </p>
              <div class="footer-social">
                <a href="https://wa.me/2348000000000" target="_blank" rel="noopener" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2.5C6.8 2.5 2.6 6.7 2.6 12c0 1.7.5 3.4 1.5 4.8L2.5 21.5l4.8-1.6c1.4.8 3 1.2 4.7 1.2 5.2 0 9.4-4.2 9.4-9.4 0-2.5-1-4.9-2.8-6.6-1.7-1.8-4.1-2.8-6.6-2.8z"/></svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                </a>
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.3h-3.1V8.6c0-1 .3-1.6 1.6-1.6H17V4.2c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v2.5H7v3.3h2.8V22h3.7z"/></svg>
                </a>
                <a href="#" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-7.012L4.7 22H1.44l8.027-9.176L1 2h6.99l4.84 6.39L18.244 2zm-1.2 18h1.82L7.06 4H5.1l11.944 16z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h5>Contact</h5>
              <ul class="footer-contact">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.79a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.29-1.29a2 2 0 0 1 2.11-.45c.89.35 1.83.59 2.79.72A2 2 0 0 1 22 16.92z"/></svg>
                  <span>+234 800 000 0000</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                  <span>hello@aqualife.ng</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${T.tr('footer.cities') || 'Lagos · Abuja · Port Harcourt · Ibadan'}</span>
                </li>
              </ul>
            </div>

            <div>
              <h5>Company</h5>
              <ul>
                <li><a href="about.html">About Us</a></li>
              </ul>
            </div>

            <div>
              <h5>Legal</h5>
              <ul>
                <li><a href="privacy.html">Privacy Policy</a></li>
                <li><a href="terms.html">Terms of Service</a></li>
                <li><a href="refund.html">Refund Policy</a></li>
                <li><a href="shipping.html">Shipping Policy</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <span>© 2026 AquaLife Nigeria</span>
            <span class="footer-bottom-right">Crafted with care · Better living every day</span>
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
  }  /* ---------- Cookie consent (NDPR) ---------- */
  function renderCookieBanner() {
    if (document.getElementById('cookieBanner')) return;
    const host = document.createElement('div');
    host.id = 'cookieBanner';
    host.className = 'cookie-banner';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-label', 'Cookie consent');
    host.innerHTML = `
      <span class="cookie-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10c0-.46-.04-.92-.1-1.36a5.5 5.5 0 0 1-7.78-7.78A9.97 9.97 0 0 0 12 2Z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="14" cy="9" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
      </span>
      <div class="cookie-body">
        <strong data-i18n="cookie.title">${T.tr('cookie.title')}</strong>
        <span>${T.tr('cookie.text')} <a href="privacy.html" data-i18n="cookie.learn_more">${T.tr('cookie.learn_more')}</a></span>
      </div>
      <div class="cookie-actions">
        <button type="button" class="cb-btn" data-cookie="customise" data-i18n="cookie.custom">${T.tr('cookie.custom')}</button>
        <button type="button" class="cb-btn" data-cookie="reject" data-i18n="cookie.reject">${T.tr('cookie.reject')}</button>
        <button type="button" class="cb-btn cb-primary" data-cookie="accept" data-i18n="cookie.accept">${T.tr('cookie.accept')}</button>
      </div>
      <div class="cookie-prefs" aria-hidden="true">
        <div class="row">
          <div class="text">
            <strong>${T.tr('cookie.essential')}</strong>
            <small>${T.tr('cookie.essential_desc')}</small>
          </div>
          <div class="toggle on locked" data-cookie-pref="essential" aria-label="Essential cookies (always on)"></div>
        </div>
        <div class="row">
          <div class="text">
            <strong>${T.tr('cookie.analytics')}</strong>
            <small>${T.tr('cookie.analytics_desc')}</small>
          </div>
          <div class="toggle" data-cookie-pref="analytics" role="switch" aria-checked="false" tabindex="0"></div>
        </div>
        <div class="row">
          <div class="text">
            <strong>${T.tr('cookie.marketing')}</strong>
            <small>${T.tr('cookie.marketing_desc')}</small>
          </div>
          <div class="toggle" data-cookie-pref="marketing" role="switch" aria-checked="false" tabindex="0"></div>
        </div>
        <div class="cookie-actions" style="width:100%;justify-content:flex-end;padding-top:8px">
          <button type="button" class="cb-btn cb-primary" data-cookie="save" data-i18n="cookie.save">${T.tr('cookie.save')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(host);

    const STORAGE_KEY = 'al.cookies';
    const hasChoice = () => { try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; } };
    const save = (prefs) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, ts: Date.now() })); } catch {}
      host.classList.remove('show', 'show-prefs');
      document.dispatchEvent(new CustomEvent('al:cookiechange', { detail: prefs }));
    };
    const getPrefs = () => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
    };

    function syncToggles(prefs) {
      host.querySelectorAll('[data-cookie-pref]').forEach(t => {
        const k = t.dataset.cookiePref;
        const on = !!prefs[k];
        t.classList.toggle('on', on);
        if (t.getAttribute('role') === 'switch') t.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }

    host.addEventListener('click', (e) => {
      const reopen = e.target.closest('[data-cookie-reopen]');
      if (reopen) { e.preventDefault(); openBanner(true); return; }

      const btn = e.target.closest('[data-cookie]');
      if (btn) {
        const act = btn.dataset.cookie;
        if (act === 'accept') save({ essential: true, analytics: true, marketing: true });
        else if (act === 'reject') save({ essential: true, analytics: false, marketing: false });
        else if (act === 'customise') { host.classList.add('show-prefs'); syncToggles(getPrefs() || { essential: true, analytics: false, marketing: false }); }
        else if (act === 'save') {
          const prefs = { essential: true };
          host.querySelectorAll('[data-cookie-pref]').forEach(t => { if (t.dataset.cookiePref !== 'essential') prefs[t.dataset.cookiePref] = t.classList.contains('on'); });
          save(prefs);
        }
        return;
      }

      const tog = e.target.closest('[data-cookie-pref]');
      if (tog && !tog.classList.contains('locked')) {
        tog.classList.toggle('on');
        if (tog.getAttribute('role') === 'switch') tog.setAttribute('aria-checked', tog.classList.contains('on') ? 'true' : 'false');
      }
    });

    // Keyboard support for toggles
    host.querySelectorAll('[data-cookie-pref][role="switch"]').forEach(t => {
      t.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); t.click(); }
      });
    });

    function openBanner(force) {
      if (!force && hasChoice()) return;
      host.classList.add('show');
    }

    // Re-render text when language changes
    window.addEventListener('al:langchange', () => {
      const titleEl = host.querySelector('[data-i18n="cookie.title"]');
      if (titleEl) titleEl.textContent = T.tr('cookie.title');
      const learnEl = host.querySelector('[data-i18n="cookie.learn_more"]');
      if (learnEl) learnEl.textContent = T.tr('cookie.learn_more');
      const customiseEl = host.querySelector('[data-cookie="customise"]');
      if (customiseEl) customiseEl.textContent = T.tr('cookie.custom');
      const rejectEl = host.querySelector('[data-cookie="reject"]');
      if (rejectEl) rejectEl.textContent = T.tr('cookie.reject');
      const acceptEl = host.querySelector('[data-cookie="accept"]');
      if (acceptEl) acceptEl.textContent = T.tr('cookie.accept');
      const saveEl = host.querySelector('[data-cookie="save"]');
      if (saveEl) saveEl.textContent = T.tr('cookie.save');
      const body = host.querySelector('.cookie-body > span');
      if (body) {
        body.textContent = T.tr('cookie.text') + ' ';
        const a2 = document.createElement('a');
        a2.href = 'privacy.html';
        a2.textContent = T.tr('cookie.learn_more');
        body.appendChild(a2);
      }
    });

    // Expose for testing / external triggers
    window.ALCookies = { open: () => openBanner(true), get: getPrefs, clear: () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} openBanner(true); } };

    // Show on first visit (delay so it doesn't compete with page paint)
    setTimeout(() => openBanner(false), 600);
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(document.body.dataset.page);
    renderFooter();
    renderCookieBanner();
    wireOffline();
    bindLoadingBtns();
    // 首次加载：把所有 data-i18n 标记按当前语言填充
    T.applyI18n(document.body);
    // 语言切换：Header/Footer 用 JS 模板重渲，静态文案用 applyI18n，最后 dispatch 事件给页面级脚本（mall/products/等）二次渲染
    window.addEventListener('al:langchange', () => {
      renderHeader(document.body.dataset.page);
      renderFooter();
      T.applyI18n(document.body);
    });
  });

  /* ---------- Public helpers ---------- */
  window.AL = {
    Money, T, STORAGE, fmtDate, fmtNum, toast,
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
      try { return JSON.parse(localStorage.getItem(STORAGE.PREFS) || 'null') || { email: true, sms: true, wa: true }; }
      catch { return { email: true, sms: true, wa: true }; }
    },
    savePrefs(p) { localStorage.setItem(STORAGE.PREFS, JSON.stringify(p)); },
  };
})();
