/* ============================================
   BLOG.JS  (Supabase Auth)
   Depende de data.js (artigosData) e supabase.js
   ============================================ */

// ── AUTH GUARD + NAV ─────────────────────────
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.replace('../index.html'); return; }

  const { data: profile } = await supabase
    .from('profiles').select('first_name, last_name, avatar_url').eq('id', user.id).single();

  ['nav-avatar-img', 'nav-avatar-img-2'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (profile?.avatar_url) { el.style.backgroundImage = `url('${profile.avatar_url}')`; }
    else { el.textContent = ((profile?.first_name?.[0]||'') + (profile?.last_name?.[0]||'')).toUpperCase(); }
  });

  document.body.classList.remove('loading');
})();

// ── HELPERS ──────────────────────────────────
const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}
const labelCat = {
  treino:   { label: 'Treino',    cls: 'cat-treino-label'   },
  nutricao: { label: 'Nutrição',  cls: 'cat-nutricao-label' },
  saude:    { label: 'Saúde',     cls: 'cat-saude-label'    },
  novidade: { label: 'Novidade',  cls: 'cat-novidade-label' },
};
const artigos = Object.entries(artigosData)
  .filter(([, a]) => a.active !== false)
  .sort((a, b) => new Date(b[1].data) - new Date(a[1].data));
const artigoDestaque = artigos.find(([, a]) => a.destaque === true);

// ── RENDER DESTAQUE ───────────────────────────
function renderDestaque() {
  const el = document.getElementById('blog-featured');
  if (!el || !artigoDestaque) { if(el) el.style.display='none'; return; }
  const [key, a] = artigoDestaque;
  const cat = labelCat[a.categoria] || { label: a.categoria, cls: '' };
  el.innerHTML = `
    <article class="featured-card glass">
      <div class="featured-img" style="background-image:url('${a.imagem}')">
        <span class="article-category ${cat.cls}">${cat.label}</span>
      </div>
      <div class="featured-body">
        <div class="article-meta"><time datetime="${a.data}">${formatDate(a.data)}</time><span>· ${a.leitura} leitura</span></div>
        <h2>${a.titulo}</h2><p>${a.resumo}</p>
        <button class="btn glass btn-ler-artigo" data-key="${key}">Ler artigo completo <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </article>`;
}

// ── RENDER GRELHA ─────────────────────────────
function renderGrelha(catFiltro = 'todos') {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  const lista = artigos.filter(([key, a]) => {
    if (artigoDestaque && key === artigoDestaque[0]) return false;
    if (catFiltro !== 'todos' && a.categoria !== catFiltro) return false;
    return true;
  });
  if (lista.length === 0) { grid.innerHTML = `<p style="color:var(--clr-2);opacity:.6;padding:2rem;grid-column:1/-1">Nenhum artigo nesta categoria ainda.</p>`; return; }
  grid.innerHTML = lista.map(([key, a]) => {
    const c = labelCat[a.categoria] || { label: a.categoria, cls: '' };
    return `
      <article class="article-card cat-${a.categoria}">
        <div class="article-img" style="background-image:url('${a.imagem}')"><span class="article-category ${c.cls}">${c.label}</span></div>
        <div class="article-body">
          <div class="article-meta"><time datetime="${a.data}">${formatDate(a.data)}</time><span>· ${a.leitura}</span></div>
          <h3>${a.titulo}</h3><p>${a.resumo}</p>
          <button class="link-btn article-read-more btn-ler-artigo" data-key="${key}">Ler mais →</button>
        </div>
      </article>`;
  }).join('');
}

// ── ABRIR ARTIGO ──────────────────────────────
function abrirArtigo(key) {
  const found = artigos.find(([k]) => k === key);
  if (!found) return;
  const [, a] = found;
  const cat = labelCat[a.categoria] || { label: a.categoria, cls: '' };
  document.getElementById('article-main').innerHTML = `
    <a href="#" class="btn-voltar link-btn" id="btn-voltar"><i class="fa-solid fa-arrow-left"></i> Voltar ao blog</a>
    <div class="article-header">
      <span class="article-category ${cat.cls}">${cat.label}</span>
      <div class="article-meta"><time datetime="${a.data}">${formatDate(a.data)}</time><span>· ${a.leitura} leitura</span></div>
      <h1>${a.titulo}</h1>
    </div>
    <div class="article-cover" style="background-image:url('${a.imagem}')"></div>
    <div class="article-content">${a.conteudo}</div>`;
  document.getElementById('btn-voltar')?.addEventListener('click', e => { e.preventDefault(); voltarGrelha(); });
  const sidebar = document.getElementById('sidebar-lista');
  if (sidebar) {
    sidebar.innerHTML = artigos.filter(([k]) => k !== key).slice(0, 6).map(([k, art]) => {
      const c = labelCat[art.categoria] || { label: art.categoria, cls: '' };
      return `<button class="sidebar-card btn-ler-artigo" data-key="${k}">
        <div class="sidebar-card-img" style="background-image:url('${art.imagem}')"><span class="article-category ${c.cls}" style="font-size:.55rem">${c.label}</span></div>
        <div class="sidebar-card-body"><span class="sidebar-card-titulo">${art.titulo}</span><span class="sidebar-card-meta">${formatDate(art.data)} · ${art.leitura}</span></div>
      </button>`;
    }).join('');
  }
  document.getElementById('view-grid').classList.add('hidden');
  document.getElementById('view-article').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function voltarGrelha() {
  document.getElementById('view-article').classList.add('hidden');
  document.getElementById('view-grid').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrelha(btn.dataset.cat);
  });
});
document.addEventListener('click', e => { const btn = e.target.closest('.btn-ler-artigo'); if (btn?.dataset.key) abrirArtigo(btn.dataset.key); });
document.getElementById('form-newsletter')?.addEventListener('submit', e => { e.preventDefault(); e.target.innerHTML = `<p style="color:var(--clr-4);letter-spacing:.08em;text-transform:uppercase;font-size:.82rem;">✓ Subscrito com sucesso!</p>`; });

renderDestaque();
renderGrelha();