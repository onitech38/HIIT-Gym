// ============================================
// USER.JS — TESTE DE VIDA
// ============================================

function init() {
  console.log('[USER] init() chamado');

  document.body.classList.remove('loading');

  const el = document.getElementById('app');
  if (el) {
    el.innerHTML = '<h1>✅ USER.JS ESTÁ A FUNCIONAR</h1>';
  } else {
    document.body.innerHTML = '<h1>✅ USER.JS ESTÁ A FUNCIONAR</h1>';
  }
}

document.addEventListener('app:ready', init, { once: true });
