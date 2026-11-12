// Underflow landing page

const API = 'https://api.underflow.music';

// ---- Analytics (Plausible) ----
// The Plausible script is loaded with `defer` after this file, so a queue stub
// is defined first: any event fired before the real script arrives is replayed
// by it. track() swallows errors on purpose — analytics must never break a page.
// Event names must be added as Goals (and `os` / `location` / `lang` as custom
// properties) in the Plausible dashboard before they show up in reports.

window.plausible = window.plausible || function () {
  (window.plausible.q = window.plausible.q || []).push(arguments);
};

function track(name, props) {
  try {
    window.plausible(name, props ? { props } : undefined);
  } catch { /* ignore */ }
}

// ---- i18n ----

const DEFAULT_LANG = navigator.language.startsWith('ru') ? 'ru' : 'en';
let currentLang = localStorage.getItem('uf-lang') || DEFAULT_LANG;
let translations = {};

async function loadTranslations(lang) {
  try {
    // GitHub Pages serves these with max-age=600, so after a deploy a
    // returning visitor kept the old strings for up to ten minutes while
    // the HTML was already new — the pricing page rendered Russian chrome
    // around an English card. cache: 'no-cache' revalidates against the
    // ETag on every load: a 304 when nothing changed, fresh copy when it
    // did. These files are a few KB, so the round trip costs nothing.
    const res = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    translations = await res.json();

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = key.split('.').reduce((obj, k) => obj?.[k], translations);
      if (text == null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const text = key.split('.').reduce((obj, k) => obj?.[k], translations);
      if (text != null) el.setAttribute('aria-label', text);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      const text = key.split('.').reduce((obj, k) => obj?.[k], translations);
      if (text != null) el.setAttribute('alt', text);
    });

    document.documentElement.lang = lang;
    document.querySelectorAll('[data-localized-href]').forEach(a => a.setAttribute('href', (lang === 'ru' ? 'ru/' : '') + a.dataset.localizedHref));
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    // Re-apply currency after translations (in case i18n overwrote prices)
    if (typeof applyCurrency === 'function') applyCurrency(currentCurrency);
  } catch { /* silent */ }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem('uf-lang', currentLang);
    track('Language Switch', { lang: currentLang });
    loadTranslations(currentLang);
    // Keep currency in sync with visible language unless user chose a currency tab manually
    if (localStorage.getItem(CURRENCY_MANUAL_KEY) !== '1') {
      syncCurrencyWithLang(currentLang);
    } else if (currentLang === 'en' && localStorage.getItem('uf-currency') === 'rub') {
      localStorage.removeItem(CURRENCY_MANUAL_KEY);
      syncCurrencyWithLang(currentLang);
    }
  });
});

loadTranslations(currentLang);

// ---- Currency switcher ----
// `uf-currency-manual=1` means the user explicitly picked a currency tab; otherwise
// we keep currency aligned with the active UI language (en → USD, ru → RUB) and fix
// stale pairs like EN + ₽ from older versions.

const CURRENCY_MANUAL_KEY = 'uf-currency-manual';

const deriveDefaultCurrencyForLang = (lang) => (lang === 'ru' ? 'rub' : 'usd');

let currentCurrency;
const manualCurrency = localStorage.getItem(CURRENCY_MANUAL_KEY) === '1';
const storedCurrency = localStorage.getItem('uf-currency');

if (
  manualCurrency &&
  storedCurrency &&
  !(currentLang === 'en' && storedCurrency === 'rub')
) {
  currentCurrency = storedCurrency;
} else {
  if (manualCurrency && currentLang === 'en' && storedCurrency === 'rub') {
    localStorage.removeItem(CURRENCY_MANUAL_KEY);
  }
  currentCurrency = deriveDefaultCurrencyForLang(currentLang);
  localStorage.setItem('uf-currency', currentCurrency);
}

function applyCurrency(currency) {
  currentCurrency = currency;
  localStorage.setItem('uf-currency', currency);
  document.querySelectorAll('.pricing-price[data-price-' + currency + ']').forEach(el => {
    el.textContent = el.getAttribute('data-price-' + currency);
  });
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.currency === currency);
  });
}

document.querySelectorAll('.currency-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    localStorage.setItem(CURRENCY_MANUAL_KEY, '1');
    applyCurrency(btn.dataset.currency);
  });
});

// Auto-set currency on lang switch (unless user locked a non-default choice)
function syncCurrencyWithLang(lang) {
  applyCurrency(deriveDefaultCurrencyForLang(lang));
}

// Apply initial currency
applyCurrency(currentCurrency);

// ---- Nav: glassmorphism on scroll ----

const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ---- Smooth scroll for anchor links ----

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    // The listener is attached to every a[href^="#"] at load, but the href can
    // change later: the download buttons start as a bare "#" and get a real
    // https URL once the API answers. Only a real in-page anchor ("#faq") is a
    // selector; passing "#" or a URL to querySelector throws a SyntaxError on
    // every click. A bare "#" is a placeholder (a disabled button): swallow the
    // click instead of letting it jump the page to the top.
    if (!href || href.length < 2 || href[0] !== '#') {
      if (href === '#') e.preventDefault();
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---- Scroll-triggered fade-in ----

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section, .trust-strip').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// ---- Email notify form ----

const notifyForm = document.getElementById('notify-form');
if (notifyForm) {
  notifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = notifyForm.querySelector('input[name="email"]');
    const hp = notifyForm.querySelector('input[name="website"]');
    const btn = notifyForm.querySelector('button[type="submit"]');
    const email = input.value.trim();
    const notifyLabel =
      translations?.download?.notify_btn || 'Notify Me';
    btn.disabled = true;
    btn.style.minWidth = btn.offsetWidth + 'px';

    try {
      const res = await fetch(`${API}/api/marketing/notify-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          website: hp ? hp.value : '',
        }),
      });
      if (!res.ok) {
        throw new Error(`notify ${res.status}`);
      }
      track('Notify Signup');
      const successText =
        translations?.download?.notify_success || "You're on the list!";
      btn.textContent = successText;
      btn.style.background = '#10b981';
      btn.style.borderColor = '#10b981';
      input.disabled = true;
      if (hp) hp.disabled = true;
    } catch {
      const errText =
        translations?.download?.notify_error || 'Error — try later';
      btn.textContent = errText;
      btn.style.background = '#e05555';
      btn.style.borderColor = '#e05555';
      setTimeout(() => {
        btn.textContent = notifyLabel;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.disabled = false;
      }, 2600);
    }
  });
}

// ---- Funnel events ----

// Any link into the download block ("Download" in the nav, "Download Free" in
// the hero, the same links on the other pages): where on the page was it?
document.querySelectorAll('a[href$="#download"]').forEach(a => {
  a.addEventListener('click', () => {
    const where = a.classList.contains('nav-cta') ? 'nav'
      : a.classList.contains('btn-primary') ? 'hero'
      : 'other';
    track("Download CTA", { location: where });
  });
});

// The actual download buttons. Disabled ones (API not answered yet, or an OS
// with no build) have no real href and must not count.
document.querySelectorAll('.btn-download').forEach(a => {
  a.addEventListener('click', () => {
    if (a.classList.contains('btn-disabled')) return;
    const os = a.id === 'dl-win' ? 'windows'
      : a.id === 'dl-mac-arm' ? 'mac-arm'
      : 'mac-intel';
    track('Download', { os });
  });
});

// Landing -> explore
document.querySelectorAll('a[href="explore.html"]').forEach(a => {
  a.addEventListener('click', () => {
    track('Explore CTA', { location: a.classList.contains('hero-graph-cta') ? 'hero' : 'other' });
  });
});

// ---- Populate download buttons from server ----

async function loadDownloadLinks() {
  const versionEl = document.getElementById('dl-version');
  const dlWin     = document.getElementById('dl-win');
  const dlMacX    = document.getElementById('dl-mac-intel');
  const dlMacA    = document.getElementById('dl-mac-arm');

  // Only the landing page carries the download block. Everywhere else
  // these are null, and writing to versionEl threw — inside the try, so
  // the catch ran and threw again on the same null. Every page except
  // index logged an uncaught TypeError on load.
  if (!versionEl) return;

  try {
    const res  = await fetch(`${API}/api/updates/info`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    const { version, downloads } = data;
    versionEl.textContent = `v${version} — Latest Release`;

    if (downloads.windows_x64) {
      dlWin.href = `${API}${downloads.windows_x64}`;
      dlWin.classList.remove('btn-disabled');
    }
    if (downloads.mac_intel) {
      dlMacX.href = `${API}${downloads.mac_intel}`;
      dlMacX.classList.remove('btn-disabled');
    } else {
      dlMacX.querySelector('.btn-note').textContent = 'Coming soon';
    }
    if (downloads.mac_silicon) {
      dlMacA.href = `${API}${downloads.mac_silicon}`;
      dlMacA.classList.remove('btn-disabled');
    } else {
      dlMacA.querySelector('.btn-note').textContent = 'Coming soon';
    }
  } catch {
    versionEl.textContent = 'Download';
  }
}

loadDownloadLinks();

// ---- Beta program banner ----

const BETA_BANNER_LS = 'underflow_beta_banner_v2';

function initBetaBanner() {
  const row = document.getElementById('beta-banner');
  if (!row || row.dataset.betaInit === '1') return;
  row.dataset.betaInit = '1';
  if (localStorage.getItem(BETA_BANNER_LS) === '1') row.classList.add('is-dismissed');
  row.querySelector('.beta-banner-close')?.addEventListener('click', () => {
    localStorage.setItem(BETA_BANNER_LS, '1');
    row.classList.add('is-dismissed');
  });
}

initBetaBanner();

// ---- Fixed-nav height ----
//
// .nav is position:fixed, so every page has to start below it. That offset
// used to be hardcoded (176px on .hero, 196px on .legal-page) against a nav
// that is not a fixed height at all: the beta banner inside it wraps to two
// or three lines on narrow screens and in longer locales, and it disappears
// entirely once dismissed. Measured on the RU pricing page at 375px the nav
// was 212px against the 196px offset — the heading rendered underneath the
// banner. Publish --nav-h and let the CSS add its own breathing room on top.
function syncNavHeight() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const h = Math.round(nav.getBoundingClientRect().height);
  if (h > 0) document.documentElement.style.setProperty('--nav-h', h + 'px');
}

// A ResizeObserver covers every cause at once — viewport width, a language
// switch that relayouts the banner text, and the dismiss click — without
// each of them having to remember to call this.
(function watchNavHeight() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  syncNavHeight();
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(syncNavHeight).observe(nav);
  } else {
    window.addEventListener('resize', syncNavHeight);
  }
  // Webfonts land after first paint and change the banner's line count.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncNavHeight).catch(() => {});
  }
})();

// ---- App gallery (product tour) ----
// Tabs with a single stage: arrow keys, autoplay while visible (off for
// reduced-motion and after the first manual choice), preload of the other
// frames, click-to-enlarge in a native <dialog>.
function initGallery() {
  const root = document.getElementById('gallery');
  if (!root) return;
  const tabs = [...root.querySelectorAll('.gallery-tab')];
  const panels = [...root.querySelectorAll('.gallery-panel')];
  if (!tabs.length || tabs.length !== panels.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = 0, timer = null, manual = false, inView = false, lastVideo = null;

  function show(i, byUser) {
    idx = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === idx)); t.tabIndex = k === idx ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== idx; });
    syncVideo();
    if (byUser) {
      manual = true;
      stop();
      tabs[idx].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function stop() { if (timer) { clearTimeout(timer); timer = null; } }

  // The recording only plays while its tab is open and the gallery is on screen.
  function syncVideo() {
    panels.forEach((p, k) => {
      const v = p.querySelector('video');
      if (!v) return;
      if (reduce) { v.controls = true; v.pause(); return; }
      if (k === idx && inView) {
        if (lastVideo !== v) { try { v.currentTime = 0; } catch { /* not seekable yet */ } lastVideo = v; }
        v.preload = 'auto';
        const p2 = v.play(); if (p2 && p2.catch) p2.catch(() => {});
      } else {
        v.pause();
        if (k !== idx && lastVideo === v) lastVideo = null;
      }
    });
  }
  function dwell() { return Number(panels[idx].dataset.dwell) || 7000; }
  function tick() { timer = setTimeout(() => { show(idx + 1, false); tick(); }, dwell()); }
  function start() { if (reduce || manual || timer) return; tick(); }

  tabs.forEach((tab, k) => {
    tab.addEventListener('click', () => show(k, true));
    tab.addEventListener('keydown', e => {
      const map = { ArrowRight: idx + 1, ArrowLeft: idx - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      show(map[e.key], true);
      tabs[idx].focus();
    });
  });

  const stage = root.querySelector('.gallery-stage');
  stage.addEventListener('pointerenter', stop);
  stage.addEventListener('pointerleave', start);

  if ('IntersectionObserver' in window) {
    let preloaded = false;
    new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting;
      inView = visible;
      syncVideo();
      if (visible && !preloaded) {
        preloaded = true;
        root.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
      }
      visible ? start() : stop();
    }, { threshold: 0.35 }).observe(root);
  }

  // Click-to-enlarge
  let dialog = null;
  function openZoom(src, alt) {
    if (typeof HTMLDialogElement === 'undefined') { window.open(src, '_blank', 'noopener'); return; }
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'gallery-lightbox';
      dialog.innerHTML = '<img alt=""><button type="button"></button>';
      dialog.addEventListener('click', e => { if (e.target !== dialog.querySelector('img')) dialog.close(); });
      document.body.appendChild(dialog);
    }
    const label = translations?.gallery?.close || 'Close';
    dialog.querySelector('button').textContent = label + ' \u2715';
    const img = dialog.querySelector('img');
    img.src = src; img.alt = alt || '';
    dialog.showModal();
  }
  root.querySelectorAll('.gallery-shot').forEach(shot => {
    shot.addEventListener('click', () => {
      const img = shot.querySelector('img');
      if (!img) return;
      openZoom(img.currentSrc || img.src, img.alt);
    });
  });
}
initGallery();
