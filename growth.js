/* Funnel analytics + sticky download bar. No dependencies; every call is wrapped so it can never break a page. */
(function () {
  'use strict';
  window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  function track(name, props) { try { window.plausible(name, props ? { props: props } : undefined); } catch (e) {} }
  var page = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  var ru = document.documentElement.lang === 'ru';

  // 1. Which sections people actually reach (once per page view)
  if ('IntersectionObserver' in window) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id; if (!id || seen[id]) return; seen[id] = 1; io.unobserve(en.target);
        track(en.target.classList.contains('feat') ? 'Feature View' : 'Section View', { id: id, page: page });
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.feat[id], #gallery, #how-it-works, #features, #comparison, #faq, #download').forEach(function (el) { io.observe(el); });
  }

  // 2. Which feature videos get watched
  var played = {};
  document.querySelectorAll('.feat video').forEach(function (v) {
    v.addEventListener('playing', function () {
      var sec = v.closest('.feat'); var id = sec && sec.id; if (!id || played[id]) return; played[id] = 1;
      track('Feature Video', { id: id });
    });
  });

  // 3. Scroll depth 75% (once)
  var deep = false;
  window.addEventListener('scroll', function () {
    if (deep) return;
    var h = document.documentElement; var max = h.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max > 0.75) { deep = true; track('Scroll 75', { page: page }); }
  }, { passive: true });

  // CTA clicks on pages that mark their buttons with data-cta
  document.querySelectorAll('a[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () { track('Download CTA', { location: el.getAttribute('data-cta') }); });
  });

  // 4. Sticky download bar on the features pages
  if (!document.querySelector('.feat-page')) return;
  try { if (sessionStorage.getItem('uf-bar-closed') === '1') return; } catch (e) {}
  var ua = navigator.userAgent || '';
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  var os = /Mac/i.test(ua) ? 'macOS' : 'Windows';
  var t = ru
    ? { text: mobile ? 'Underflow — приложение для компьютера (Windows и macOS). Бесплатно в открытой бете.' : 'Underflow бесплатен в открытой бете.', btn: mobile ? 'Открыть страницу скачивания' : 'Скачать для ' + os, close: 'Закрыть' }
    : { text: mobile ? 'Underflow is a desktop app (Windows and macOS). Free during the open beta.' : 'Underflow is free during the open beta.', btn: mobile ? 'Open the download page' : 'Download for ' + os, close: 'Close' };
  var bar = document.createElement('div');
  bar.className = 'dl-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Download');
  var p = document.createElement('p'); p.textContent = t.text;
  var a = document.createElement('a'); a.className = 'btn btn-primary btn-small'; a.href = '/#download'; a.textContent = t.btn;
  a.addEventListener('click', function () { track('Download CTA', { location: 'features-bar' }); });
  var x = document.createElement('button'); x.type = 'button'; x.className = 'dl-bar-close'; x.setAttribute('aria-label', t.close); x.textContent = '×';
  x.addEventListener('click', function () { bar.classList.remove('is-on'); try { sessionStorage.setItem('uf-bar-closed', '1'); } catch (e) {} });
  bar.appendChild(p); bar.appendChild(a); bar.appendChild(x); document.body.appendChild(bar);
  function upd() { bar.classList.toggle('is-on', window.scrollY > 700); }
  window.addEventListener('scroll', upd, { passive: true }); upd();
})();
