// ============================================
// GLOBAL.JS — FONTE ÚNICA DE AUTH + ARRANQUE
// ============================================

window.currentUser    = null;
window.currentSession = null;


// ---------- UTILS ----------

function ini(str) {
  if (!str) return '';
  return str.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar ${url}`);
  return res.text();
}


// ---------- NAV ----------
async function injectNav() {
  const header = document.querySelector('header');
  if (!header || header.querySelector('nav')) return;
  try {
    const html = await loadPartial('/partials/nav.html');
    header.insertAdjacentHTML('afterbegin', html);
  } catch { /* partial não existe — continua */ }
}


// ---------- FOOTER ----------
async function injectFooter() {
  if (document.querySelector('footer')) return;
  try {
    const html = await loadPartial('/partials/footer.html');
    document.body.insertAdjacentHTML('beforeend', html);
  } catch { /* partial não existe — continua */ }
}


// ---------- AUTH ----------
// Um único listener para tudo.
//
// PORQUÊ UM SÓ: onAuthStateChange dispara INITIAL_SESSION apenas uma vez
// por instância do cliente. Se registarmos dois listeners (um para o boot,
// outro permanente), o segundo pode apanhar o evento antes do primeiro —
// ou o evento já disparou quando o primeiro se regista, nunca resolvendo.
//
// Solução: registar UM listener imediatamente quando o script carrega
// (antes do DOMContentLoaded). Ele:
//   1. Resolve o boot via promise quando INITIAL_SESSION dispara
//   2. Actualiza o nav em eventos subsequentes (SIGNED_IN, SIGNED_OUT)
//
let _authResolve = null;
const _authReady = new Promise(resolve => { _authResolve = resolve; });

if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    window.currentSession = session;
    window.currentUser    = session?.user || null;

    if (event === 'INITIAL_SESSION') {
      // Boot: resolve a promise que o initAuth() aguarda
      _authResolve();
    } else {
      // Pós-boot: actualiza o nav (login/logout noutro separador, etc.)
      await actualizarNav();
    }
  });
} else {
  // Supabase não disponível — resolve imediatamente
  _authResolve();
}


async function initAuth() {
  // Timeout de segurança: 5s — nunca bloqueia a página
  await Promise.race([
    _authReady,
    new Promise(resolve => setTimeout(resolve, 5000)),
  ]);
}


// ---------- NAV AUTH ----------
async function actualizarNav() {
  const login  = document.getElementById('nav-login');
  const signup = document.getElementById('nav-signup');
  const avatar = document.getElementById('nav-avatar');
  const img    = document.getElementById('nav-avatar-img');

  if (!login || !signup || !avatar) return;

  if (window.currentUser) {
    login.classList.add('hidden');
    signup.classList.add('hidden');
    avatar.classList.remove('hidden');

    if (!img) return;

    try {
      const { data } = await window.supabaseClient
        .from('profiles')
        .select('first_name,last_name,avatar_url')
        .eq('id', window.currentUser.id)
        .single();

      if (data?.avatar_url) {
        img.style.backgroundImage = `url('${data.avatar_url}')`;
        img.textContent = '';
      } else if (data?.first_name || data?.last_name) {
        img.textContent =
          ((data.first_name?.[0] || '') +
           (data.last_name?.[0]  || '')).toUpperCase();
      } else {
        img.textContent =
          window.currentUser.email?.[0]?.toUpperCase() || '';
      }
    } catch {
      img.textContent =
        window.currentUser.email?.[0]?.toUpperCase() || '';
    }

  } else {
    login.classList.remove('hidden');
    signup.classList.remove('hidden');
    avatar.classList.add('hidden');
  }
}


// ---------- INIT GLOBAL ----------
window.addEventListener('DOMContentLoaded', () => {
  (async function boot() {
    await injectNav();
    await injectFooter();
    await initAuth();        // aguarda _authReady (INITIAL_SESSION)
    await actualizarNav();
    document.dispatchEvent(new Event('app:ready'));
  })();
});
