//============================================
//   HIIT-GYM — USER.JS (RECUPERAÇÃO SEGURA)
//============================================

function init() {
  // ✅ prova absoluta de vida
  console.log('[USER] init arrancou');

  // ✅ revelar página
  document.body.classList.remove('loading');

  // ✅ escrever algo visível
  let app = document.getElementById('app');
  if (!app) {
    app = document.createElement('div');
    app.id = 'app';
    app.style.padding = '2rem';
    document.body.appendChild(app);
  }

  app.innerHTML = `
    <h1 style="color:#fba002">✅ USER.JS ESTÁ A FUNCIONAR</h1>
    <p>O arranque da página privada foi restaurado.</p>
  `;
}

// ✅ ÚNICO ponto de arranque
document.addEventListener('app:ready', init, { once: true });
