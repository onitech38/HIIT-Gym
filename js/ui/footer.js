// ============================================
// FOOTER.JS — lógica do footer partilhado
// Depende de: data-gym.js
// Não carrega o footer, apenas o preenche
// ============================================

function initFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer || !window.gymInfo) return;

  // ── Descrição / Marca ─────────────────────
  const desc = document.getElementById('footer-descricao');
  if (desc) {
    desc.textContent =
      gymInfo.descricaoCurta || gymInfo.nome;
  }

  // ── Horários ──────────────────────────────
  const hSemana = document.getElementById('footer-horario-semana');
  const hFim    = document.getElementById('footer-horario-fimsemana');

  if (hSemana) hSemana.textContent = gymInfo.horario?.semana || '';
  if (hFim)    hFim.textContent    = gymInfo.horario?.fimSemana || '';

  // ── Redes Sociais ─────────────────────────
  setLink('footer-whatsapp',  socialLinks?.whatsapp);
  setLink('footer-instagram', socialLinks?.instagram);
  setLink('footer-facebook',  socialLinks?.facebook);
  setLink('footer-tiktok',    socialLinks?.tiktok);

  // ── Copyright / Legal ─────────────────────
  const copyright =
    document.getElementById('footer-copyright');

  if (copyright) {
    copyright.textContent =
      legal?.copyright || '';
  }

  const links = footer.querySelectorAll('.footer-legal a');
  if (links.length >= 2) {
    links[0].href = legal?.politicaPrivacidade || '#';
    links[1].href = legal?.termos || '#';
  }
}


// ── Helper ──────────────────────────────────
function setLink(id, url) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!url) {
    el.style.display = 'none';
    return;
  }

  el.href = url;
  el.style.display = '';
}


// Expor para uso posterior (global.js)
window.initFooter = initFooter;