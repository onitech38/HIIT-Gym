// ============================================
// GLOBAL.JS — FONTE ÚNICA DE ARRANQUE
// ============================================

window.currentUser = null;

window.addEventListener('DOMContentLoaded', async () => {
  // DEBUG VISUAL (TEMPORÁRIO)
  console.log('[GLOBAL] DOMContentLoaded');

  // AUTH MOCK / REAL
  if (window.supabaseClient) {
    const { data } = await window.supabaseClient.auth.getSession();
    window.currentUser = data?.session?.user || null;
  }

  console.log('[GLOBAL] currentUser =', window.currentUser);

  document.dispatchEvent(new Event('app:ready'));
});
