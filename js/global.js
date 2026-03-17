/* ============================================
   GLOBAL.JS — Componentes partilhados (FINAL)

   Mantém:
   ▸ ini()
   ▸ actualizarNav()
   ▸ bindNavAuthLinks()
   ▸ bindMobileNav()
   ▸ bindToTop()

   Integra:
   ▸ nav.html + nav.js
   ▸ footer.html + footer.js
   ============================================ */


// ─────────────────────────────────────────────
// Helper: iniciais
// ─────────────────────────────────────────────
function ini(str = '') {
  return str
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}
window.ini = ini;


// ─────────────────────────────────────────────
// Loader de partials (nav / footer)
// ─────────────────────────────────────────────
async function loadPartial(targetId, url) {
  const el = document.getElementById(targetId);
  if (!el) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error('[global] erro ao carregar', url, err);
  }
}
window.loadPartial = loadPartial;


// ─────────────────────────────────────────────
// NAV — auth (igual ao teu, só adaptado)
// ─────────────────────────────────────────────
async function actualizarNav() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navImg    = document.getElementById('nav-avatar-img');

  if (!navLogin) return;

  const { data: { session } } =
    await window.supabaseClient.auth.getSession();

  if (!session) {
    navLogin.classList.remove('hidden');
    navSignup.classList.remove('hidden');
    navAvatar?.classList.add('hidden');
    return;
  }

  navLogin.classList.add('hidden');
  navSignup.classList.add('hidden');
  navAvatar?.classList.remove('hidden');

  if (navImg) {
    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('first_name,last_name,avatar_url')
      .eq('id', session.user.id)
      .single();

    const applyAvatar = el => {
      if (!el) return;
      if (profile?.avatar_url) {
        el.style.backgroundImage = `url('${profile.avatar_url}')`;
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = ini(
          `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
          || session.user.email
        );
      }
    };

    applyAvatar(navImg);
    applyAvatar(document.getElementById('nav-avatar-img-2'));
  }
}
window.actualizarNav = actualizarNav;


// ─────────────────────────────────────────────
// NAV — login / signup (igual ao teu)
// ─────────────────────────────────────────────
function bindNavAuthLinks() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');

  const pathToIndex = `${window.location.origin}/index.html`;

  navLogin?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = `${pathToIndex}?auth=login`;
  });

  navSignup?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = `${pathToIndex}?auth=signup`;
  });
}
window.bindNavAuthLinks = bindNavAuthLinks;


// ─────────────────────────────────────────────
// Mobile nav (igual ao teu)
// ─────────────────────────────────────────────
function bindMobileNav() {
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;

  document.querySelectorAll('.nav-content .link-btn')
    .forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.removeAttribute('open');
      });
    });
}
window.bindMobileNav = bindMobileNav;


// ─────────────────────────────────────────────
// Botão "to top" (igual ao teu)
// ─────────────────────────────────────────────
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
window.bindToTop = bindToTop;


// ─────────────────────────────────────────────
// INIT GLOBAL (NOVO BLOCO)
// ─────────────────────────────────────────────
async function initGlobal() {

  const isAppMode =
    window.config?.appMode ||
    window.matchMedia('(display-mode: standalone)').matches;

  // ── NAV ───────────────────────────────────
  if (!isAppMode) {
    await loadPartial('site-nav', '/partials/nav.html');
    window.initNav?.();          // nav.js
    actualizarNav();
    bindNavAuthLinks();
    bindMobileNav();
  } else {
    document.getElementById('site-nav')?.remove();
  }

  // ── FOOTER ────────────────────────────────
  if (!isAppMode) {
    await loadPartial('site-footer', '/partials/footer.html');
    window.initFooter?.();       // footer.js
  } else {
    document.getElementById('site-footer')?.remove();
  }

  bindToTop();
}


// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', initGlobal);