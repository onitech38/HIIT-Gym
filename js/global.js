// ============================================
// GLOBAL.JS — fonte única de auth, arranque,
// splash e nav. Todas as páginas dependem disto.
//
// CONTRATO:
//   • window.currentUser  → null | User (após boot)
//   • window.supabaseClient → cliente Supabase
//   • app:ready → dispara quando auth está resolvida
//     e nav/footer já estão no DOM
//   • actualizarNav() → exportada para page scripts
//   • ini(str) → exportada para page scripts
// ============================================


// ── 1. ANTI-FLASH ─────────────────────────────
// Esconde o HTML imediatamente via JS se o inline
// CSS do <head> não estiver presente (fallback).
// O reveal é feito em removeSplash().
if (!document.documentElement.style.visibility) {
  document.documentElement.style.visibility = 'hidden';
}


// ── 2. ESTADO GLOBAL ──────────────────────────
window.currentUser    = null;
window.currentSession = null;


// ── 3. SPLASH ─────────────────────────────────
(function injectSplash() {
  if (document.getElementById('hiit-splash')) return;

  const style = document.createElement('style');
  style.id = 'hiit-splash-style';
  style.textContent = `
    html { background: #120D0F; }
    #hiit-splash {
      position: fixed; inset: 0; z-index: 9999;
      background: #120D0F;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 1.5rem;
      animation: sp-enter 0.25s ease forwards;
    }
    @keyframes sp-enter {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    #hiit-splash img {
      width: 72px; height: auto;
      opacity: 0;
      transform: translateY(8px) scale(0.9);
      animation:
        sp-logo-in 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.05s forwards,
        sp-pulse   1.8s ease-in-out 0.5s infinite;
    }
    @keyframes sp-logo-in {
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #hiit-splash .sp-bar {
      width: 100px; height: 2px;
      background: rgba(251,160,2,0.15);
      border-radius: 2px; overflow: hidden;
      opacity: 0;
      animation: sp-bar-in 0.3s ease 0.35s forwards;
    }
    @keyframes sp-bar-in { to { opacity: 1; } }
    #hiit-splash .sp-bar::after {
      content: ''; display: block;
      height: 100%; width: 35%; background: #fba002;
      border-radius: 2px;
      animation: sp-slide 1.1s ease-in-out infinite;
    }
    @keyframes sp-pulse {
      0%,100% { opacity:.55; }
      50%     { opacity:1;   }
    }
    @keyframes sp-slide {
      0%   { transform:translateX(-100%); }
      100% { transform:translateX(370%); }
    }
  `;
  document.head.appendChild(style);

  function mountSplash() {
    if (document.getElementById('hiit-splash')) return;
    const el = document.createElement('div');
    el.id = 'hiit-splash';
    el.innerHTML = `
      <img src="/src/logo/logo_def1.svg" alt="HIIT-Gym">
      <div class="sp-bar"></div>
    `;
    document.body.prepend(el);
  }

  document.body ? mountSplash()
    : document.addEventListener('DOMContentLoaded', mountSplash);
})();

function removeSplash() {
  // Revela o HTML com transição suave
  document.documentElement.style.transition = 'opacity 0.25s ease';
  document.documentElement.style.opacity    = '1';
  document.documentElement.style.visibility = 'visible';
  document.body.classList.remove('loading');

  // Remove o overlay
  const el = document.getElementById('hiit-splash');
  if (!el) return;
  el.style.transition = 'opacity 0.25s ease';
  el.style.opacity    = '0';
  setTimeout(() => {
    el.remove();
    document.getElementById('hiit-splash-style')?.remove();
  }, 280);
}


// ── 4. UTILS ──────────────────────────────────
function ini(str) {
  if (!str) return '';
  return str.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`404: ${url}`);
  return res.text();
}


// ── 5. NAV / FOOTER ───────────────────────────
async function injectNav() {
  const header = document.querySelector('header');
  if (!header || header.querySelector('nav')) return;
  try {
    const html = await loadPartial('/partials/nav.html');
    header.insertAdjacentHTML('afterbegin', html);
  } catch { /* página tem nav próprio */ }
}

async function injectFooter() {
  if (document.querySelector('footer')) return;
  try {
    const html = await loadPartial('/partials/footer.html');
    document.body.insertAdjacentHTML('beforeend', html);
  } catch { /* página tem footer próprio */ }
}


// ── 6. AUTH ───────────────────────────────────
// getSession() é chamado UMA vez por boot().
// Todas as páginas lêem window.currentUser — nunca
// chamam getSession() directamente.
async function initAuth() {
  if (!window.supabaseClient) return;
  try {
    const { data: { session } } =
      await window.supabaseClient.auth.getSession();
    window.currentSession = session || null;
    window.currentUser    = session?.user || null;
  } catch {
    window.currentUser = null;
  }
}

// Listener permanente — reage a eventos pós-boot
// (login no welcome, logout, token refresh)
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
    // INITIAL_SESSION ignorado — initAuth() já tratou disso
  });
}


// ── 7. NAV AUTH ───────────────────────────────
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
      } else {
        img.style.backgroundImage = '';
        img.textContent = ini(`${data?.first_name || ''} ${data?.last_name || ''}`.trim())
          || window.currentUser.email?.[0]?.toUpperCase() || '';
      }
    } catch {
      img.textContent = window.currentUser.email?.[0]?.toUpperCase() || '';
    }
  } else {
    login.classList.remove('hidden');
    signup.classList.remove('hidden');
    avatar.classList.add('hidden');
  }
}


// ── 8. TO-TOP ─────────────────────────────────
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


// ── 9. ANCHOR LINKS ───────────────────────────
function bindAnchorLinks() {
  document.querySelectorAll('a[href*="#"]').forEach(a => {
    try {
      const url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) {
        a.addEventListener('click', e => {
          e.preventDefault();
          document.querySelector(url.hash)
            ?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    } catch { /* href inválido */ }
  });
}


// ── 10. BOOT ──────────────────────────────────
// Ponto de entrada único. Corre no DOMContentLoaded
// e em cada bfcache restore (pageshow.persisted).
//
// Garante SEMPRE:
//   • splash visível durante o carregamento
//   • window.currentUser definido antes de app:ready
//   • splash removido antes de app:ready
//   • página nunca fica preta (safetyTimer)
let _booted = false;

async function boot() {
  const safetyTimer = setTimeout(removeSplash, 2500);

  try {
    if (!_booted) {
      _booted = true;
      await injectNav();
      await injectFooter();
      bindAnchorLinks();
      bindToTop();
    }

    await initAuth();      // define window.currentUser
    await actualizarNav(); // actualiza nav com estado real

    clearTimeout(safetyTimer);
    removeSplash(); // revela página ANTES de app:ready

    document.dispatchEvent(new Event('app:ready'));

  } catch (err) {
    console.error('[global] boot error:', err);
    clearTimeout(safetyTimer);
    removeSplash();
    document.dispatchEvent(new Event('app:ready'));
  }
}

window.addEventListener('DOMContentLoaded', boot);

// Bfcache restore — re-corre boot() completo
// Garante que todas as páginas actualizam o estado
// sem reload manual, em todos os browsers e mobile
window.addEventListener('pageshow', e => {
  if (e.persisted) boot();
});
