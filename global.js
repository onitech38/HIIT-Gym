/* ============================================
   GLOBAL.JS — Componentes partilhados

   Carregado em TODAS as páginas que usam
   Supabase: modalidades, user, blog.
   (index.html usa ainda script.js/localStorage
    durante a migração de auth)

   EXPORTA (globals acessíveis):
   ▸ actualizarNav()      — nav login ↔ avatar
   ▸ bindNavAuthLinks()   — clique em login/signup
   ▸ ini(str)             — iniciais de um nome
   ============================================ */


// ── Helper: iniciais de um nome ──────────────
// Usado em vários sítios: nav avatar, coach cards
function ini(str) {
  return str.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}


// ── NAV — actualiza login/signup ↔ avatar ────
//
// Lê a sessão Supabase e decide o que mostrar:
//   • sem sessão  → mostra links "login" e "signup"
//   • com sessão  → esconde links, mostra avatar
//
// Funciona para qualquer profundidade de pasta
// porque usa IDs fixos: #nav-login, #nav-signup,
// #nav-avatar, #nav-avatar-img
async function actualizarNav() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navImg    = document.getElementById('nav-avatar-img');

  // Elementos podem não existir em todas as páginas
  if (!navLogin) return;

  // Sessão Supabase
  const { data: { session } } = await window.supabase.auth.getSession();

  if (!session) {
    navLogin.classList.remove('hidden');
    navSignup.classList.remove('hidden');
    navAvatar?.classList.add('hidden');
    return;
  }

  // Autenticado — buscar perfil para o avatar
  navLogin.classList.add('hidden');
  navSignup.classList.add('hidden');
  navAvatar?.classList.remove('hidden');

  if (navImg) {
    const { data: profile } = await window.supabase
      .from('profiles').select('first_name, last_name, avatar_url')
      .eq('id', session.user.id).single();

    const avatarContent = (el) => {
      if (!el) return;
      if (profile?.avatar_url) {
        el.style.backgroundImage = `url('${profile.avatar_url}')`;
        el.textContent = '';
      } else {
        el.textContent = (
          (profile?.first_name?.[0] || '') +
          (profile?.last_name?.[0]  || '')
        ).toUpperCase() || session.user.email[0].toUpperCase();
        el.style.backgroundImage = '';
      }
    };

    // nav principal + nav do article view (blog)
    avatarContent(navImg);
    avatarContent(document.getElementById('nav-avatar-img-2'));
  }
}


// ── NAV — bind nos links login/signup ────────
//
// Clique em "login" → index.html (abre modal)
// Clique em "signup" → index.html (abre modal signup)
// Só faz bind se os elementos existirem na página.
function bindNavAuthLinks() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');

  // Determinar path para o index consoante a profundidade
  // Funciona com 1 nível de pasta (modalidades/, user/, blog/)
  const pathToIndex = window.location.pathname.includes('/')
    && window.location.pathname.split('/').length > 2
    ? '../index.html'
    : 'index.html';

  navLogin?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = `${pathToIndex}?auth=login`;
  });

  navSignup?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = `${pathToIndex}?auth=signup`;
  });
}


// ── Mobile nav — fechar ao clicar num link ───
//
// O <details class="mobile-nav"> fecha sozinho
// em desktop, mas no mobile é preciso fechar
// manualmente ao navegar.
function bindMobileNav() {
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;

  document.querySelectorAll('.nav-content .link-btn').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.removeAttribute('open');
    });
  });
}


// ── Init automático ao carregar ──────────────
// Apenas actualizarNav + bindNavAuthLinks.
// Cada página chama o resto do seu próprio init.
window.addEventListener('DOMContentLoaded', () => {
  actualizarNav();
  bindNavAuthLinks();
  bindMobileNav();
});
