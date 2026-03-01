// Underflow landing page

const API = 'https://api.underflow.music';

// Nav: glassmorphism on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Populate download buttons from server (no GitHub URLs exposed)
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
