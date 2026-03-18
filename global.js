// ============================================
// GLOBAL.JS — injeção SEM wrapper
// ============================================

async function injectNav() {
  const header = document.querySelector('header');
  if (!header) return;

  try {
    const res = await fetch('/partials/nav.html');
    const html = await res.text();

    // inserir o nav como PRIMEIRO FILHO do header
    header.insertAdjacentHTML('afterbegin', html);
  } catch (e) {
    console.warn('Erro ao carregar nav');
  }
}

async function injectFooter() {
  const body = document.body;
  if (!body) return;

  try {
    const res = await fetch('/partials/footer.html');
    const html = await res.text();

    body.insertAdjacentHTML('beforeend', html);
  } catch (e) {
    console.warn('Erro ao carregar footer');
  }
}

injectNav();
injectFooter();
``
