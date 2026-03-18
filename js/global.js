// ============================================
// GLOBAL.JS — HIIT-GYM
// Responsável por:
//  - Injectar NAV dentro do <header>
//  - Injectar FOOTER no fim da página
//  - Gerir estado de autenticação no nav
// ============================================


// ============================================
// UTIL
// ============================================
async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar ${url}`);
  return res.text();
}


// ============================================
// NAV
// ============================================
async function loadNav() {
  const header = document.querySelector('header');
  if (!header) return;

  const slot = header.querySelector('#site-nav');
  if (!slot) return;

  try {
    const html = await loadPartial('/partials/nav.html');
    slot.innerHTML = html;

    bindMobileNav();
    await syncNavAuth();
  } catch (err) {
    console.error('Erro ao carregar nav:', err);
  }
}


// MOBILE NAV (details / summary)
function bindMobileNav() {
  const details = document.querySelector('.mobile-nav');
  if (!details) return;

  // Fecha ao clicar num link
  details.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      details.removeAttribute('open');
    });
  });

  // Fecha ao clicar fora
  document.addEventListener('click', e => {
    if (!details.contains(e.target)) {
      details.removeAttribute('open');
    }
  });
}


// ============================================
// NAV AUTH (login / avatar)
// ============================================
async function syncNavAuth() {
  if (!window.supabaseClient) return;

  const { data: { session } } =
    await window.supabaseClient.auth.getSession()
      .catch(() => ({ data: { session: null } }));

  const btnLogin  = document.getElementById('nav-login');
  const btnSignup = document.getElementById('nav-signup');
  const avatar    = document.getElementById('nav-avatar');
  const avatarImg = document.getElementById('nav-avatar-img');

  if (session) {
    btnLogin?.classList.add('hidden');
    btnSignup?.classList.add('hidden');
    avatar?.classList.remove('hidden');

    // Inicial do nome ou avatar
    try {
      const { data } = await window.supabaseClient
        .from('profiles')
        .select('first_name, last_name, avatar')
        .eq('id', session.user.id)
        .single();

      if (data?.avatar && avatarImg) {
        avatarImg.style.backgroundImage = `url('${data.avatar}')`;
        avatarImg.textContent = '';
      } else if (data && avatarImg) {
        const ini =
          (data.first_name?.[0] || '') +
          (data.last_name?.[0] || '');
        avatarImg.textContent = ini.toUpperCase();
      }
    } catch (err) {
      console.warn('Não foi possível carregar perfil:', err);
    }

  } else {
    btnLogin?.classList.remove('hidden');
    btnSignup?.classList.remove('hidden');
    avatar?.classList.add('hidden');
  }
}


// ============================================
// FOOTER
// ============================================
async function loadFooter() {
  const slot = document.getElementById('site-footer');
  if (!slot) return;

  try {
    const html = await loadPartial('/partials/footer.html');
    slot.innerHTML = html;
  } catch (err) {
    console.error('Erro ao carregar footer:', err);
  }
}


// ============================================
// INIT GLOBAL
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
  await loadNav();
  await loadFooter();

  // Reagir a login/logout
  if (window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange(() => {
      syncNavAuth();
    });
  }
});
