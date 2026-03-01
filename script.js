// Underflow landing page

const API = 'https://api.underflow.music';

// ---- i18n ----

const DEFAULT_LANG = navigator.language.startsWith('ru') ? 'ru' : 'en';
let currentLang = localStorage.getItem('uf-lang') || DEFAULT_LANG;
let translations = {};

async function loadTranslations(lang) {
  try {
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) return;
    translations = await res.json();

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = key.split('.').reduce((obj, k) => obj?.[k], translations);
      if (text == null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });

    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  } catch { /* silent */ }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem('uf-lang', currentLang);
    loadTranslations(currentLang);
  });
});

loadTranslations(currentLang);

// ---- Nav: glassmorphism on scroll ----

const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ---- Smooth scroll for anchor links ----

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
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
    const input = notifyForm.querySelector('input[type="email"]');
    const btn = notifyForm.querySelector('button');
    const email = input.value;
    btn.disabled = true;
    btn.style.minWidth = btn.offsetWidth + 'px';

    try {
      // TODO: Replace with actual API endpoint when ready
      // await fetch(`${API}/api/newsletter`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      const successText = translations?.download?.notify_success || "You're on the list!";
      btn.textContent = successText;
      btn.style.background = '#10b981';
      btn.style.borderColor = '#10b981';
      input.disabled = true;
    } catch {
      btn.textContent = 'Error';
      btn.style.background = '#e05555';
      btn.style.borderColor = '#e05555';
      setTimeout(() => {
        btn.textContent = translations?.download?.notify_btn || 'Notify Me';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.disabled = false;
      }, 2000);
    }
  });
}

// ---- Populate download buttons from server ----

async function loadDownloadLinks() {
  const versionEl = document.getElementById('dl-version');
  const dlWin     = document.getElementById('dl-win');
  const dlMacX    = document.getElementById('dl-mac-intel');
  const dlMacA    = document.getElementById('dl-mac-arm');

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
