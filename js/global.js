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
// Estratégia dupla: getSession() + INITIAL_SESSION em corrida.
// Problema resolvido: INITIAL_SESSION pode disparar com session=null
// se o Supabase ainda não terminou de restaurar do localStorage.
// getSession() faz uma leitura directa e sincronizada do storage.
// O que resolver PRIMEIRO com uma sessão válida ganha.
// Se nenhum tiver sessão, resolve com null (utilizador não autenticado).
async function initAuth() {
  if (!window.supabaseClient) return;

  return new Promise(resolve => {
    let resolved = false;

    function finish(session) {
      if (resolved) return;
      // Só resolve imediatamente se tiver sessão
      // Se não tiver sessão, deixa o outro caminho tentar primeiro
      if (session?.user) {
        resolved = true;
        window.currentSession = session;
        window.currentUser    = session.user;
        resolve();
      }
    }

    function finishNull() {
      // Resolve com null — nenhum caminho encontrou sessão
      if (!resolved) {
        resolved = true;
        window.currentSession = null;
        window.currentUser    = null;
        resolve();
      }
    }

    // Caminho 1: getSession() — lê directamente o localStorage
    window.supabaseClient.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          finish(session);
        }
        // Se não tiver sessão, deixa o INITIAL_SESSION decidir
        // mas com timeout de segurança
        setTimeout(finishNull, 3000);
      })
      .catch(() => setTimeout(finishNull, 3000));

    // Caminho 2: INITIAL_SESSION — evento do Supabase
    // Pode chegar depois de getSession(), mas confirma o estado real
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          finish(session);
        } else {
          // INITIAL_SESSION sem sessão — resolve com null
          finishNull();
        }
      } else if (event === 'SIGNED_IN') {
        // Login feito enquanto a página está aberta (raro mas possível)
        resolved = true;
        window.currentSession = session;
        window.currentUser    = session?.user || null;
        actualizarNav();
      } else if (event === 'SIGNED_OUT') {
        window.currentSession = null;
        window.currentUser    = null;
        actualizarNav();
      } else if (event === 'TOKEN_REFRESHED') {
        window.currentSession = session;
        window.currentUser    = session?.user || null;
      }
    });
  });
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
let _booted = false;

async function boot() {
  if (_booted) {
    // Bfcache restore: não re-injeta, só actualiza auth e nav
    await initAuth();
    await actualizarNav();
    document.dispatchEvent(new Event('app:ready'));
    return;
  }
  _booted = true;

  await injectNav();
  await injectFooter();
  await initAuth();
  await actualizarNav();
  bindToTop();
  document.dispatchEvent(new Event('app:ready'));
}

window.addEventListener('DOMContentLoaded', boot);

// Bfcache: página restaurada sem re-executar scripts
window.addEventListener('pageshow', e => {
  if (e.persisted) boot();
});
