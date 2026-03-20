// ============================================
// GLOBAL.JS — FONTE ÚNICA DE AUTH + ARRANQUE
// ============================================

window.currentUser    = null;
window.currentSession = null;


// ---------- SPLASH ----------
// Injectado imediatamente quando o script carrega
// Cobre o conteúdo enquanto a auth resolve
(function injectSplash() {
  if (document.getElementById('hiit-splash')) return;

  const style = document.createElement('style');
  style.textContent = `
    #hiit-splash {
      position: fixed; inset: 0; z-index: 9999;
      background: #120D0F;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 1.5rem;
      transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    #hiit-splash.fade-out { opacity: 0; visibility: hidden; pointer-events: none; }
    #hiit-splash img { width: 80px; height: auto; animation: sp-pulse 1.5s ease-in-out infinite; }
    #hiit-splash .sp-bar { width: 120px; height: 2px; background: rgba(251,160,2,0.2); border-radius: 2px; overflow: hidden; }
    #hiit-splash .sp-bar::after { content: ''; display: block; height: 100%; width: 40%; background: #fba002; border-radius: 2px; animation: sp-slide 1.2s ease-in-out infinite; }
    @keyframes sp-pulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
    @keyframes sp-slide  { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'hiit-splash';
  el.innerHTML = `<img src="/src/logo/logo_def1.svg" alt="HIIT-Gym"><div class="sp-bar"></div>`;

  const attach = () => document.body?.prepend(el);
  document.body ? attach() : document.addEventListener('DOMContentLoaded', attach);
})();

function removeSplash() {
  const el = document.getElementById('hiit-splash');
  if (el) { el.classList.add('fade-out'); setTimeout(() => el.remove(), 450); }
  document.body.classList.remove('loading');
}


// ---------- UTILS ----------
function ini(str) {
  if (!str) return '';
  return str.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`404: ${url}`);
  return res.text();
}


// ---------- NAV ----------
async function injectNav() {
  const header = document.querySelector('header');
  if (!header || header.querySelector('nav')) return;
  try {
    const html = await loadPartial('/partials/nav.html');
    header.insertAdjacentHTML('afterbegin', html);
  } catch { /* partial não existe nesta página */ }
}


// ---------- FOOTER ----------
async function injectFooter() {
  if (document.querySelector('footer')) return;
  try {
    const html = await loadPartial('/partials/footer.html');
    document.body.insertAdjacentHTML('beforeend', html);
  } catch { /* partial não existe nesta página */ }
}


// ---------- AUTH ----------
async function initAuth() {
  if (!window.supabaseClient) return;
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    window.currentSession = session;
    window.currentUser    = session?.user || null;
  } catch {
    window.currentUser = null;
  }
}

// Listener permanente — actualiza nav em SIGNED_IN/OUT após boot
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
        .from('profiles').select('first_name,last_name,avatar_url')
        .eq('id', window.currentUser.id).single();

      if (data?.avatar_url) {
        img.style.backgroundImage = `url('${data.avatar_url}')`;
        img.textContent = '';
      } else {
        img.textContent = ((data?.first_name?.[0] || '') + (data?.last_name?.[0] || '')).toUpperCase()
          || window.currentUser.email?.[0]?.toUpperCase() || '';
        img.style.backgroundImage = '';
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
  const obs = new MutationObserver(() => { if (tryBind()) obs.disconnect(); });
  obs.observe(document.body, { childList: true, subtree: true });
}


// ---------- ANCHOR LINKS ----------
function bindAnchorLinks() {
  document.querySelectorAll('a[href*="#"]').forEach(a => {
    try {
      const url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) {
        a.addEventListener('click', e => {
          e.preventDefault();
          document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    } catch { /* href inválido */ }
  });
}


// ---------- BOOT ----------
let _booted = false;

async function boot() {
  // Timeout de segurança — splash desaparece sempre após 6s
  const safetyTimer = setTimeout(removeSplash, 6000);

  try {
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
    bindAnchorLinks();
    await initAuth();
    await actualizarNav();
    bindToTop();
    document.dispatchEvent(new Event('app:ready'));

  } catch (err) {
    console.error('[global] boot error:', err);
  } finally {
    // Sempre remove o splash — com ou sem erro
    clearTimeout(safetyTimer);
    removeSplash();
  }
}

window.addEventListener('DOMContentLoaded', boot);

// Bfcache restore (botão "voltar" do browser)
window.addEventListener('pageshow', e => {
  if (e.persisted) boot();
});
