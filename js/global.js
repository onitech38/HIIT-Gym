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
// Um único listener registado imediatamente (antes do DOMContentLoaded)
// para apanhar INITIAL_SESSION que o Supabase só dispara uma vez.
let _authResolve = null;
const _authReady = new Promise(resolve => { _authResolve = resolve; });

if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    window.currentSession = session;
    window.currentUser    = session?.user || null;

    if (event === 'INITIAL_SESSION') {
      _authResolve();
    } else {
      // Pós-boot: login/logout noutro separador, token refresh, etc.
      await actualizarNav();
    }
  });
} else {
  _authResolve();
}

async function initAuth() {
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


// ---------- TO-TOP ----------
// Mostra o botão .to_top após 300px de scroll.
// Usa MutationObserver para esperar que o chat.js injete o .q_a.
function bindToTop() {
  const tryBind = () => {
    const btn = document.querySelector('.q_a .to_top');
    if (!btn) return false;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visivel', window.scrollY > 300);
    }, { passive: true });
    return true;
  };

  if (tryBind()) return;

  const obs = new MutationObserver(() => {
    if (tryBind()) obs.disconnect();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}


// ---------- INIT GLOBAL ----------
async function boot() {
  await injectNav();
  await injectFooter();
  await initAuth();
  await actualizarNav();
  bindToTop();
  console.log('[boot] currentUser:', window.currentUser?.email, '| event fired');
  document.dispatchEvent(new Event('app:ready'));
  console.log('[global] app:ready disparado | user:', window.currentUser?.email || 'null');
}

window.addEventListener('DOMContentLoaded', boot);

// ---------- BFCACHE ----------
// Quando o utilizador navega com o botão "voltar", o browser pode restaurar
// a página do bfcache sem re-executar scripts. O evento pageshow com
// persisted:true detecta isso e re-executa o boot para actualizar o estado.
window.addEventListener('pageshow', e => {
  if (e.persisted) boot();
});
