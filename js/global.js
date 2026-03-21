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


// ── 2. ESTADO GLOBAL ──────────────────────────
window.currentUser    = null;
window.currentSession = null;


// ── 3. SPLASH ─────────────────────────────────
// O splash é CSS puro — html::before em style.css
// Aqui apenas removemos: adicionamos .splash-done ao <html>
// que activa a transition de fade out via CSS
function removeSplash() {
  document.documentElement.classList.add('splash-done');
  document.body.classList.remove('loading');
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
// CORRECÇÃO (v4): postMessage enviado para reg.waiting
// (SW em espera), não para controller (SW já activo).
// Enviar para controller era um no-op — o SW em espera
// nunca recebia a mensagem e ficava sempre em "Wait".
let _booted = false;

async function boot() {
  // Força activação do SW em espera, se existir.
  // reg.waiting é o SW instalado mas a aguardar;
  // controller é o SW já activo — enviar-lhe skipWaiting
  // não faz nada porque ele já está activo.
  try {
    const reg = await navigator.serviceWorker?.getRegistration('/');
    if (reg?.waiting) {
      reg.waiting.postMessage('SKIP_WAITING');
    }
  } catch { /* SW não disponível */ }

  const safetyTimer = setTimeout(removeSplash, 1500);

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

// Bfcache restore — re-corre boot() completo.
// Garante que todas as páginas actualizam o estado
// sem reload manual, em todos os browsers e mobile.
window.addEventListener('pageshow', e => {
  if (e.persisted) boot();
});
