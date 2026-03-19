// ============================================
// GLOBAL.JS — FONTE ÚNICA DE AUTH + ARRANQUE
// ============================================

window.currentUser = undefined;
window.currentSession = null;

// ---------- UTILS ----------
async function loadPartial(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  return res.text();
}

// ---------- NAV ----------
async function injectNav() {
  const header = document.querySelector('header');
  if (!header || header.querySelector('nav')) return;

  const html = await loadPartial('/partials/nav.html');
  header.insertAdjacentHTML('afterbegin', html);
}

// ---------- FOOTER ----------
async function injectFooter() {
  if (document.querySelector('footer')) return;

  const html = await loadPartial('/partials/footer.html');
  document.body.insertAdjacentHTML('beforeend', html);
}

// ---------- AUTH ----------
async function initAuth() {
  if (!window.supabaseClient) {
    window.currentUser = null;
    return;
  }

  const { data: { session } } =
    await window.supabaseClient.auth.getSession();

  window.currentSession = session;
  window.currentUser = session?.user || null;

  // ✅ Garantia extra (edge cases)
  if (!window.currentUser) {
    const { data } = await window.supabaseClient.auth.getUser();
    window.currentUser = data?.user || null;
  }
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

    try {
      const { data } = await window.supabaseClient
        .from('profiles')
        .select('first_name,last_name,avatar_url')
        .eq('id', window.currentUser.id)
        .single();

      if (img) {
        if (data?.avatar_url) {
          img.style.backgroundImage = `url('${data.avatar_url}')`;
          img.textContent = '';
        } else if (data?.first_name || data?.last_name) {
          img.textContent =
            ((data.first_name?.[0] || '') +
             (data.last_name?.[0] || '')).toUpperCase();
        } else {
          img.textContent =
            window.currentUser.email?.[0]?.toUpperCase() || '';
        }
      }
    } catch (e) {
      if (img && window.currentUser?.email) {
        img.textContent = window.currentUser.email[0].toUpperCase();
      }
    }
  } else {
    login.classList.remove('hidden');
    signup.classList.remove('hidden');
    avatar.classList.add('hidden');
  }
}

// ---------- INIT GLOBAL ----------
window.addEventListener('DOMContentLoaded', () => {
  (async function boot() {
    await injectNav();
    await injectFooter();

    // ✅ auth restaurada antes de tocar no DOM
    await initAuth();

    // ✅ nav renderizada com estado correto
    await actualizarNav();

    // ✅ app pode arrancar
    document.dispatchEvent(new Event('app:ready'));
  })();
});

// ---------- AUTH STATE CHANGE ----------
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange(
    async (_, session) => {
      window.currentSession = session;
      window.currentUser = session?.user || null;

      // ✅ Atualiza sempre via função central
      await actualizarNav();
    }
  );
}