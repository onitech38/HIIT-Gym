// ============================================
// GLOBAL.JS — FASE A (estabilização)
// Injeta NAV e FOOTER e sinaliza quando pronto
// ============================================

window.__APP_READY__ = false;

async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  return res.text();
}

async function injectNav() {
  const header = document.querySelector('header');
  if (!header) return;

  if (header.querySelector('nav')) return;

  const html = await loadPartial('/partials/nav.html');
  header.insertAdjacentHTML('afterbegin', html);
}

async function injectFooter() {
  if (document.querySelector('footer')) return;

  const html = await loadPartial('/partials/footer.html');
  document.body.insertAdjacentHTML('beforeend', html);
}

(async function initGlobal() {
  try {
    await injectNav();
    await injectFooter();
  } catch (e) {
    console.warn('Erro ao injetar layout global', e);
  } finally {
    window.__APP_READY__ = true;
    document.dispatchEvent(new Event('app:ready'));
  }
})();
