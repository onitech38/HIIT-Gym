// ============================================
// GLOBAL.JS
// Injeta NAV e FOOTER + sincroniza AUTH no nav
// ============================================

async function injectPartial(selector, url) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    target.innerHTML = await res.text();
  } catch (err) {
    console.warn('Falha ao carregar:', url);
  }
}

// ---------- NAV ----------
async function loadNav() {
  const header = document.querySelector('header');
  if (!header) return;

  try {
    const res = await fetch('/partials/nav.html');
    const html = await res.text();

    // inserir como primeiro filho do header (SEM wrapper extra)
    header.insertAdjacentHTML('afterbegin', html);

    await syncNavAuth();
  } catch (e) {
    console.warn('Erro ao carregar nav');
  }
}

// ---------- FOOTER ----------
async function loadFooter() {
  try {
    const res = await fetch('/partials/footer.html');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
  } catch (e) {
    console.warn('Erro ao carregar footer');
  }
}

// ---------- AUTH NO NAV ----------
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

    // iniciais do user (ou avatar)
    try {
      const { data } = await window.supabaseClient
        .from('profiles')
        .select('first_name, last_name, avatar')
        .eq('id', session.user.id)
        .single();

      if (data?.avatar && avatarImg) {
        avatarImg.style.backgroundImage = `url('${data.avatar}')`;
        avatarImg.textContent = '';
      } else if (avatarImg) {
        const ini =
          (data?.first_name?.[0] || '') +
          (data?.last_name?.[0] || '');
        avatarImg.textContent = ini.toUpperCase();
      }
    } catch {}
  } else {
    btnLogin?.classList.remove('hidden');
    btnSignup?.classList.remove('hidden');
    avatar?.classList.add('hidden');
  }
}

// ---------- INIT ----------
loadNav();
loadFooter();

// Atualizar nav ao fazer login/logout
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(() => {
    syncNavAuth();
  });
}
``
