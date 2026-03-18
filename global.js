// ============================================
// GLOBAL.JS
// - Injeta NAV e FOOTER via HTML
// - NÃO altera layout (CSS manda)
// - Sincroniza estado de login no NAV
// - NÃO interfere com JS das páginas
// ============================================


// -------------------------------
// UTIL: carregar partial HTML
// -------------------------------
async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar ${url}`);
  return res.text();
}


// -------------------------------
// NAV: inserir como filho direto do <header>
// (sem wrappers extra, respeita CSS original)
// -------------------------------
async function injectNav() {
  const header = document.querySelector('header');
  if (!header) return;

  // evitar duplicar nav
  if (header.querySelector('nav')) return;

  try {
    const html = await loadPartial('/partials/nav.html');
    header.insertAdjacentHTML('afterbegin', html);
    await syncNavAuth();
  } catch (err) {
    console.warn('NAV não carregado:', err);
  }
}


// -------------------------------
// FOOTER: inserir no fim do <body>
// -------------------------------
async function injectFooter() {
  const body = document.body;
  if (!body) return;

  // evitar duplicar footer
  if (body.querySelector('footer')) return;

  try {
    const html = await loadPartial('/partials/footer.html');
    body.insertAdjacentHTML('beforeend', html);
  } catch (err) {
    console.warn('FOOTER não carregado:', err);
  }
}


// -------------------------------
// AUTH → atualizar estado do NAV
// -------------------------------
async function syncNavAuth() {
  if (!window.supabaseClient) return;

  const { data: { session } } =
    await window.supabaseClient.auth.getSession()
      .catch(() => ({ data: { session: null } }));

  const btnLogin   = document.getElementById('nav-login');
  const btnSignup  = document.getElementById('nav-signup');
  const avatarLink = document.getElementById('nav-avatar');
