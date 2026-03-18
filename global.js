// ============================================
// GLOBAL.JS
// Injeta APENAS NAV e FOOTER
// NÃO interfere com JS das páginas
// ============================================

async function injectPartial(selector, url) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    target.innerHTML = await res.text();
  } catch (err) {
    console.warn('Falha ao carregar:', url);
  }
}

// Injetar NAV dentro do HEADER
injectPartial('#site-nav', '/partials/nav.html');

// Injetar FOOTER no fim da página
injectPartial('#site-footer', '/partials/footer.html');
