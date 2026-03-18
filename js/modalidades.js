// ============================================
// MODALIDADES.JS — versão refatorada
// Usa exclusivamente:
//   - window.modalidadesData
//   - window.coaches
//   - window.supabaseClient
// ============================================

// ── Estado ───────────────────────────────────
let currentUser        = null;
let currentProfile     = {};
let currentEnrollments = [];
let selectedModality   = null;


// ============================================
// INIT
// ============================================
document.addEventListener('app:ready', init, { once: true });

async function init() {
  const { data: { session } } =
    await window.supabaseClient.auth.getSession().catch(() => ({ data:{ session:null }}));

  if (session) {
    currentUser = session.user;
    await Promise.all([loadProfile(), loadEnrollments()]);
  }

  renderModalidades();
  renderEquipa();
  renderInscricaoStep1();

  document.body.classList.remove('loading');

  // Deep-link ?modal=key
  const key = new URLSearchParams(window.location.search).get('modal');
  if (key && modalidadesData[key]?.active) {
    renderInscricaoStep2(key);
    scrollToInscricao();
  }
}


// ============================================
// SUPABASE LOADERS
// ============================================
async function loadProfile() {
  const { data } = await window.supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  currentProfile = data || {};
  currentProfile.email = currentUser.email;
}

async function loadEnrollments() {
  const { data } = await window.supabaseClient
    .from('enrollments')
    .select('*')
    .eq('user_id', currentUser.id);

  currentEnrollments = data || [];
}


// ============================================
// HELPERS
// ============================================
function getStatus(modality) {
  if (!currentUser) return 'disponivel';
  const e = currentEnrollments.find(e => e.modality === modality);
  if (!e) return 'disponivel';
  return e.status === 'active' ? 'inscrito' : 'pendente';
}

const statusLabel = {
  inscrito:  '✓ Inscrito',
  pendente:  '⏳ Pendente',
  disponivel:'Disponível',
};

function scrollToInscricao() {
  document.getElementById('inscricao')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });
}


// ============================================
// MODALIDADES (CARDS)
// ============================================
function renderModalidades() {
  const list = document.getElementById('mod-lista');
  if (!list) return;

  list.innerHTML = Object.entries(modalidadesData)
    .filter(([,m]) => m.active)
    .map(([key, m]) => {
      const status = getStatus(key);

      const coachesHtml = m.coaches.map(id => {
        const c = coaches[id];
        if (!c) return '';
        const bg = c.avatar ? `style="background-image:url('../${c.avatar}')"` : '';
        return `
          <div class="coach-mini">
            <div class="coach-mini-avatar" ${bg}>
              ${c.avatar ? '' : ini(c.nome)}
            </div>
            <span class="coach-mini-tooltip">${c.nome}</span>
          </div>`;
      }).join('');

      const actionBtn =
        status === 'inscrito' ? '' :
        status === 'pendente'
          ? `<button class="btn glass" disabled>A aguardar confirmação</button>`
          : `<button class="btn glass mod-btn-insc" data-key="${key}">
               <i class="fa-solid fa-plus"></i> Inscrever
             </button>`;

      return `
        <article class="mod-card" data-status="${status}">
          <div class="mod-card-body">
            <span class="mod-card-titulo">${m.titulo}</span>

            <div class="mod-card-horarios">
              <span><i class="fa-solid fa-calendar-days"></i>${m.dias}</span>
              <span><i class="fa-solid fa-clock"></i>${m.horas}</span>
            </div>

            <div class="mod-card-coaches">${coachesHtml}</div>

            <div class="mod-card-acoes">
              <span class="mod-badge ${status}">
                ${statusLabel[status]}
              </span>
              ${actionBtn}
            </div>
          </div>

          <div class="mod-card-img">
            <img src="../${m.imagem}" alt="${m.titulo}" loading="lazy">
            <p class="mod-card-desc">${m.descricao}</p>
          </div>
        </article>`;
    }).join('');

  list.querySelectorAll('.mod-btn-insc').forEach(btn => {
    btn.addEventListener('click', () => {
      renderInscricaoStep2(btn.dataset.key);
      scrollToInscricao();
    });
  });
}


// ============================================
// EQUIPA
// ============================================
function renderEquipa() {
  const grid = document.getElementById('equipa-grid');
  if (!grid) return;

  grid.innerHTML = Object.values(coaches).map(c => {
    const bg = c.card ? `style="background-image:url('../${c.card}')"` : '';
    const tags = c.modalidades
      .map(k => modalidadesData[k]?.titulo || k)
      .join(' · ');

    return `
      <div class="equipa-card" ${bg}>
        ${!c.card ? `<span class="equipa-card-iniciais">${ini(c.nome)}</span>` : ''}
        <div class="equipa-card-info">
          <span class="equipa-card-nome">${c.nome}</span>
          <span class="equipa-card-tags">${tags}</span>
          <span class="equipa-card-bio">${c.bio}</span>
        </div>
      </div>`;
  }).join('');
}


// ============================================
// INSCRIÇÃO — STEP 1
// ============================================
function renderInscricaoStep1() {
  const wrap = document.getElementById('insc-wrap');
  if (!wrap) return;

  const activas = Object.entries(modalidadesData).filter(([, m]) => m.active);

  const disponiveis = currentUser
    ? activas.filter(([key]) => getStatus(key) === 'disponivel')
    : activas;

  const jaInscritas = currentUser
    ? activas.filter(([key]) => getStatus(key) !== 'disponivel')
    : [];

  // ── Lista principal ───────────────────────
  let listaHtml = '';

  if (!currentUser) {
    // Não autenticado
    listaHtml = activas.map(([key, m]) => `
      <li class="step1-item step1-item--lock" data-key="${key}">
        <span class="step1-nome">${m.titulo}</span>
        <span class="step1-horario">${m.dias} · ${m.horas}</span>
        <span class="step1-cta"><i class="fa-solid fa-lock"></i></span>
      </li>
    `).join('');

  } else if (disponiveis.length === 0) {
    // Tudo inscrito
    listaHtml = `
      <li class="step1-vazio">
        <i class="fa-solid fa-circle-check"></i>
        Estás inscrito em todas as modalidades disponíveis!
      </li>
    `;

  } else {
    // Disponíveis
    listaHtml = disponiveis.map(([key, m]) => `
      <li class="step1-item" data-key="${key}">
        <span class="step1-nome">${m.titulo}</span>
        <span class="step1-horario">${m.dias} · ${m.horas}</span>
        <span class="step1-cta">
          Inscrever <i class="fa-solid fa-arrow-right"></i>
        </span>
      </li>
    `).join('');
  }

  // ── Bloco "Já inscrito" ───────────────────
  const inscritasHtml = jaInscritas.length ? `
    <div class="step1-inscritas">
      <span class="step1-inscritas-label">Já inscrito:</span>
      ${jaInscritas.map(([key, m]) => {
        const s = getStatus(key);
        return `
          <span class="mod-badge ${s}">
            ${m.titulo} ${s === 'pendente' ? '⏳' : '✓'}
          </span>
        `;
      }).join('')}
    </div>
  ` : '';

  // ── Aviso de login ────────────────────────
  const loginAviso = !currentUser ? `
    <div class="step1-login-aviso">
      <p>Precisas de conta para te inscreveres.</p>
      <a href="../index.html" class="btn glass">
        <i class="fa-solid fa-arrow-right-to-bracket"></i>
        Login / Criar Conta
      </a>
    </div>
  ` : '';

  // ── Render final ──────────────────────────
  wrap.innerHTML = `
    <div id="insc-step1">
      <p class="step1-intro">
        ${currentUser
          ? 'Escolhe a modalidade em que te queres inscrever.'
          : 'Modalidades disponíveis para inscrição.'}
      </p>

      <ul class="step1-lista">
        ${listaHtml}
      </ul>

      ${inscritasHtml}
      ${loginAviso}
    </div>
  `;

  // ── Bind clicks ───────────────────────────
  if (currentUser) {
    wrap.querySelectorAll('.step1-item[data-key]').forEach(li => {
      li.addEventListener('click', () => {
        fadeOutAnd(() => renderInscricaoStep2(li.dataset.key));
      });
    });
  }

  // ── Animação stagger (SEMPRE aqui) ────────
  wrap.querySelectorAll('.step1-item').forEach((el, i) => {
    el.style.animationDelay = `${i * 60}ms`;
  });
}


function fadeOutAnd(callback) {
  const wrap = document.getElementById('insc-wrap');
  if (!wrap) return callback();

  wrap.style.opacity = '0';
  wrap.style.transform = 'translateY(8px)';
  wrap.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

  setTimeout(() => {
    wrap.style.opacity = '';
    wrap.style.transform = '';
    wrap.style.transition = '';
    callback();
  }, 150);
}
fadeOutAnd(() => renderInscricaoStep2(li.dataset.key));


// ============================================
// INSCRIÇÃO — STEP 2
// ============================================
function renderInscricaoStep2(key) {
  if (!currentUser) {
    renderInscricaoStep1();
    return;
  }

  selectedModality = key;
  const m = modalidadesData[key];
  const wrap = document.getElementById('insc-wrap');

  wrap.innerHTML = `
    <div id="insc-step2">
      <div class="insc-topo">
        <button class="btn icon glass" id="btn-voltar">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="insc-topo-txt">
          <span class="eyebrow-small">Inscrição em</span>
          <h3>${m.titulo}</h3>
        </div>
      </div>

      <form id="insc-form" class="insc-saude">
        <button type="submit" class="btn glass insc-submit">
          Confirmar Inscrição <i class="fa-solid fa-check"></i>
        </button>
      </form>
    </div>`;

  document.getElementById('btn-voltar')
    ?.addEventListener('click', renderInscricaoStep1);

  document.getElementById('insc-form')
    ?.addEventListener('submit', submitInscricao);
}


// ============================================
// SUBMIT
// ============================================
async function submitInscricao(e) {
  e.preventDefault();

  const { error, data } = await window.supabaseClient
    .from('enrollments')
    .insert({
      user_id: currentUser.id,
      modality: selectedModality,
      status: 'pending',
    })
    .select()
    .single();

  if (!error && data) {
    currentEnrollments.push(data);
    renderModalidades();
    renderInscricaoStep1();
  } else {
    alert('Erro ao submeter inscrição.');
  }
}
