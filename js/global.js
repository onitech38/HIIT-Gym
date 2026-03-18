// ============================================
// GLOBAL.JS — versão segura (rollback)
// ============================================

async function loadPartial(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    el.innerHTML = await res.text();
  } catch (e) {
    console.warn('Partial não carregado:', url);
  }
}

// Carregar nav e footer SEM mexer no lifecycle
loadPartial('#site-nav', '/partials/nav.html');
loadPartial('#site-footer', '/partials/footer.html');

// Sync auth no nav (se existir)
async function syncNavAuth() {
  if (!window.supabaseClient) return;

  const { data: { session } } =
    await window.supabaseClient.auth.getSession()
      .catch(() => ({ data: { session: null } }));

  const login  = document.getElementById('nav-login');
  const signup = document.getElementById('nav-signup');
  const avatar = document.getElementById('nav-avatar');

  if (session) {
    login?.classList.add('hidden');
    signup?.classList.add('hidden');
    avatar?.classList.remove('hidden');
  } else {
    login?.classList.remove('hidden');
    signup?.classList.remove('hidden');
    avatar?.classList.add('hidden');
  }
}

// correr uma vez, sem listeners globais
syncNavAuth();
``
