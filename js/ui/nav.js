// ============================================
// NAV.JS — lógica do nav partilhado
// ============================================

async function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // App mode → remover nav
  if (window.config?.appMode) {
    nav.remove();
    return;
  }

  const loginBtn  = nav.querySelector('#nav-login');
  const signupBtn = nav.querySelector('#nav-signup');
  const avatar    = nav.querySelector('#nav-avatar');
  const avatarImg = nav.querySelector('#nav-avatar-img');

  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    if (!user) {
      avatar?.classList.add('hidden');
      loginBtn?.classList.remove('hidden');
      signupBtn?.classList.remove('hidden');
      return;
    }

    // Autenticado
    loginBtn?.classList.add('hidden');
    signupBtn?.classList.add('hidden');
    avatar?.classList.remove('hidden');

    // Buscar perfil (iniciais / avatar)
    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('first_name,last_name,avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      avatarImg.style.backgroundImage = `url('${profile.avatar_url}')`;
      avatarImg.textContent = '';
    } else {
      const nome = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
      avatarImg.textContent = ini(nome || user.email || '?');
    }

  } catch (err) {
    console.warn('Nav auth error:', err);
  }
}

window.initNav = initNav;
