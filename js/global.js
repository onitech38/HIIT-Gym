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



// ── SPLASH SCREEN ─────────────────────────────
// Injectado imediatamente — cobre o conteúdo enquanto
// a auth carrega. Removido no fim do boot().
(function injectSplash() {
  if (document.getElementById('hiit-splash')) return;

  const style = document.createElement('style');
  style.textContent = `
    #hiit-splash {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #120D0F;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    #hiit-splash.fade-out {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    #hiit-splash img {
      width: 80px;
      height: auto;
      animation: splash-pulse 1.5s ease-in-out infinite;
    }
    #hiit-splash .splash-bar {
      width: 120px;
      height: 2px;
      background: rgba(251,160,2,0.2);
      border-radius: 2px;
      overflow: hidden;
    }
    #hiit-splash .splash-bar::after {
      content: '';
      display: block;
      height: 100%;
      width: 40%;
      background: #fba002;
      border-radius: 2px;
      animation: splash-slide 1.2s ease-in-out infinite;
    }
    @keyframes splash-pulse {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    @keyframes splash-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
  `;
  document.head.appendChild(style);

  const splash = document.createElement('div');
  splash.id = 'hiit-splash';
  splash.innerHTML = `
    <img src="/src/logo/logo_def1.svg" alt="HIIT-Gym">
    <div class="splash-bar"></div>
  `;

  // Inserir antes de qualquer outro elemento do body
  // Se o body ainda não existe, aguarda
  if (document.body) {
    document.body.prepend(splash);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.prepend(splash);
    });
  }
})();

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
// getSession() lê directamente do localStorage — simples e fiável.
// onAuthStateChange fica permanente para actualizar nav em SIGNED_IN/OUT.
async function initAuth() {
  if (!window.supabaseClient) return;

  try {
    const { data: { session } } =
      await window.supabaseClient.auth.getSession();
    window.currentSession = session;
    window.currentUser    = session?.user || null;
  } catch {
    window.currentUser = null;
  }
}


// Listener permanente — só para eventos pós-boot
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      window.currentSession = session;
      window.currentUser    = session?.user || null;
      await actualizarNav();
    } else if (event === 'SIGNED_OUT') {
      window.currentSession = null;
      window.currentUser    = null;
      await actualizarNav();
    }
    // INITIAL_SESSION ignorado — getSession() já tratou disso
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
    // Bfcache restore: auth já está no localStorage, getSession() é rápido
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
  // Remove splash com fade out
  const splash = document.getElementById('hiit-splash');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 450);
  }

  // Remove body.loading (para páginas que ainda o usam)
  document.body.classList.remove('loading');

  document.dispatchEvent(new Event('app:ready'));
}

window.addEventListener('DOMContentLoaded', boot);

// Bfcache restore
window.addEventListener('pageshow', e => {
  if (e.persisted) boot();
});
