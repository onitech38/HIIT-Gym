// ============================================
// GLOBAL.JS — FONTE ÚNICA DE AUTH + ARRANQUE
// ============================================

window.currentUser    = null;
window.currentSession = null;


// ---------- UTILS ----------

// Iniciais de um nome — usado em modalidades.js e script.js
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
// Usa onAuthStateChange(INITIAL_SESSION) em vez de getSession() para
// evitar race condition: getSession() pode retornar null enquanto o
// Supabase ainda está a restaurar a sessão do localStorage.
function initAuth() {
  return new Promise(resolve => {
    if (!window.supabaseClient) {
      window.currentUser = null;
      resolve();
      return;
    }

    // Timeout de segurança: resolve após 4s se o evento não disparar
    const timeout = setTimeout(() => {
      console.warn('[global.js] Auth timeout — a continuar sem sessão.');
      resolve();
    }, 4000);

    const { data: { subscription } } =
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN'       ||
          event === 'SIGNED_OUT'
        ) {
          clearTimeout(timeout);
          subscription.unsubscribe();
          window.currentSession = session;
          window.currentUser    = session?.user || null;
          resolve();
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


// ---------- INIT GLOBAL ----------
window.addEventListener('DOMContentLoaded', () => {
  (async function boot() {
    await injectNav();
    await injectFooter();
    await initAuth();   // aguarda INITIAL_SESSION antes de continuar
    await actualizarNav();
    document.dispatchEvent(new Event('app:ready'));
  })();
});


// ---------- AUTH STATE CHANGE (pós-boot) ----------
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'INITIAL_SESSION') return; // já tratado no initAuth()
      window.currentSession = session;
      window.currentUser    = session?.user || null;
      await actualizarNav();
    }
  );
}
