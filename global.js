// ============================================
// GLOBAL.JS
// - Injeta NAV e FOOTER via HTML
// - NÃO altera layout (CSS manda)
// - Sincroniza estado de login no NAV
// - NÃO interfere com JS das páginas
// ============================================


// -------------------------------
// UTIL: carregar partial HTML
// -------------------------------
async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar ${url}`);
  return res.text();
}


// -------------------------------
// NAV: inserir como filho direto do <header>
// (sem wrappers extra, respeita CSS original)
// -------------------------------
async function injectNav() {
  const header = document.querySelector('header');
  if (!header) return;

  // evitar duplicar nav
  if (header.querySelector('nav')) return;

  try {
    const html = await loadPartial('/partials/nav.html');
    header.insertAdjacentHTML('afterbegin', html);
    await syncNavAuth();
  } catch (err) {
    console.warn('NAV não carregado:', err);
  }
}


// -------------------------------
// FOOTER: inserir no fim do <body>
// -------------------------------
async function injectFooter() {
  const body = document.body;
  if (!body) return;

  // evitar duplicar footer
  if (body.querySelector('footer')) return;

  try {
    const html = await loadPartial('/partials/footer.html');
    body.insertAdjacentHTML('beforeend', html);
  } catch (err) {
    console.warn('FOOTER não carregado:', err);
  }
}


// -------------------------------
// AUTH → atualizar estado do NAV
// -------------------------------
async function syncNavAuth() {
  if (!window.supabaseClient) return;

  const { data: { session } } =
    await window.supabaseClient.auth.getSession()
      .catch(() => ({ data: { session: null } }));

  const btnLogin   = document.getElementById('nav-login');
  const btnSignup  = document.getElementById('nav-signup');
  const avatarLink = document.getElementById('nav-avatar');
  const avatarImg  = document.getElementById('nav-avatar-img');

  if (!btnLogin || !btnSignup || !avatarLink) return;

  if (session) {
    // esconder login/signup
    btnLogin.classList.add('hidden');
    btnSignup.classList.add('hidden');
    avatarLink.classList.remove('hidden');

    // carregar perfil (iniciais ou avatar)
    try {
      const { data } = await window.supabaseClient
        .from('profiles')
        .select('firstName, lastName, avatar')
        .eq('id', session.user.id)
        .single();

      if (avatarImg) {
        if (data?.avatar) {
          avatarImg.style.backgroundImage = `url('${data.avatar}')`;
          avatarImg.textContent = '';
        } else {
          const ini =
            (data?.firstName?.[0] || '') +
            (data?.lastName?.[0] || '');
          avatarImg.textContent = ini.toUpperCase();
        }
      }
    } catch (err) {
      console.warn('Perfil não carregado:', err);
    }

  } else {
    // mostrar login/signup
    btnLogin.classList.remove('hidden');
    btnSignup.classList.remove('hidden');
    avatarLink.classList.add('hidden');
  }
}


// -------------------------------
// INIT GLOBAL (seguro)
// -------------------------------
injectNav();
injectFooter();

// atualizar nav quando há login/logout
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(() => {
    syncNavAuth();
  });
}
