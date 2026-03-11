/* ============================================
   MODALIDADES.JS

   1. Sessão Supabase → actualiza nav
   2. renderModalidades() — cards com dados do data.js
   3. renderEquipa()      — grid auto de coaches
   4. Inscrição integrada — form de saúde + submit
   5. Auto-open via ?modal= na URL
   ============================================ */

// ── Bio simulada por coach ────────────────────
const COACH_BIO = {
  carlos  : 'Personal Trainer certificado com 10 anos de experiência em musculação e hipertrofia.',
  ana     : 'Especialista em treino feminino, nutrição desportiva e transformação corporal.',
  rafael  : 'Ex-atleta de powerlifting, focado em progressão de carga e técnica correcta.',
  maria   : 'Instrutora de Zumba e cardio com formação em dança contemporânea.',
  joao    : 'Treinador de ciclismo e HIIT com foco em condição cardiovascular e perda de peso.',
  sofia   : 'Instrutora de Yoga certificada pela Yoga Alliance, com 8 anos de prática.',
  pedro   : 'Professor de Pilates clínico especializado em reabilitação postural.',
  claudia : 'Mestre em Yoga Vinyasa e meditação mindfulness.',
  tiago   : 'Instrutor de Yoga e Pilates com formação em biomecânica do movimento.',
  ines    : 'Especialista em Yoga terapêutico para gestão de stress e flexibilidade.',
  fernando: 'Campeão nacional de Muay Thai e treinador de artes marciais mistas.',
  patricia: 'Faixa preta de Jiu-Jitsu Brasileiro, ex-competidora internacional.',
  ricardo : 'Sensei de Karaté com 20 anos de experiência e formação em defesa pessoal.',
  andre   : 'Treinador de natação competitiva, ex-seleccionado nacional.',
  fernanda: 'Especialista em natação terapêutica e adaptada para todas as idades.',
  lucas   : 'Treinador de natação focado em técnica e melhoria de performance.',
};

// ── Estado global ─────────────────────────────
let currentUser           = null;
let currentProfile        = null;
let currentEnrollments    = [];
let modalidadeSelecionada = null;

const ini = s => s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();


/* ============================================
   INIT
============================================ */
window.addEventListener('load', async () => {

  // 1. Sessão Supabase
  const { data: { session } } = await window.supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await carregarPerfil();
    await carregarInscricoes();
  }

  // 2. Render UI
  actualizarNav();
  renderModalidades();
  renderEquipa();
  bindInscricao();

  // 3. Auto-open: se a URL tiver ?modal=musculacao abre directamente a inscrição
  const params    = new URLSearchParams(window.location.search);
  const autoModal = params.get('modal');
  if (autoModal && modalidadesData[autoModal]) {
    abrirInscricao(autoModal);
  }

  // 4. Mostrar página
  document.body.classList.remove('loading');
});


/* ── Supabase helpers ────────────────────────── */
async function carregarPerfil() {
  const { data } = await window.supabase
    .from('profiles').select('*')
    .eq('id', currentUser.id).single();
  currentProfile       = data || {};
  currentProfile.email = currentUser.email;
}

async function carregarInscricoes() {
  const { data } = await window.supabase
    .from('enrollments').select('*')
    .eq('user_id', currentUser.id);
  currentEnrollments = data || [];
}


/* ── NAV ──────────────────────────────────────── */
function actualizarNav() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navImg    = document.getElementById('nav-avatar-img');

  if (!currentUser) return;

  navLogin?.classList.add('hidden');
  navSignup?.classList.add('hidden');
  navAvatar?.classList.remove('hidden');

  if (navImg && currentProfile) {
    if (currentProfile.avatar_url) {
      navImg.style.backgroundImage = `url('${currentProfile.avatar_url}')`;
      navImg.textContent = '';
    } else {
      const p = currentProfile;
      navImg.textContent = ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase();
      navImg.style.backgroundImage = '';
    }
  }
}


/* ============================================
   RENDER MODALIDADES
   Lê modalidadesData e coaches de data.js
============================================ */
function renderModalidades() {
  const lista = document.getElementById('mod-lista');
  if (!lista) return;

  const activas = Object.entries(modalidadesData).filter(([, d]) => d.active);

  lista.innerHTML = activas.map(([key, d]) => {

    const status    = getStatus(key);
    const badgeHtml = `<span class="mod-badge ${status}">${labelStatus(status)}</span>`;
    const btnHtml   = botaoInscricao(key, status);

    const coachesHtml = (d.coaches || []).map(ck => {
      const c  = coaches[ck];
      if (!c) return '';
      const bg = c.avatar ? `style="background-image:url('../${c.avatar}')"` : '';
      return `
        <div class="coach-mini">
          <div class="coach-mini-av" ${bg}>${c.avatar ? '' : ini(c.nome)}</div>
          <span class="coach-mini-tip">${c.nome}</span>
        </div>`;
    }).join('');

    return `
      <article class="mod-card" data-key="${key}">
        <div class="mod-card-body">
          <span class="mod-card-titulo">${d.titulo}</span>
          <div class="mod-card-horarios">
            <span><i class="fa-solid fa-calendar-days"></i>${d.dias}</span>
            <span><i class="fa-solid fa-clock"></i>${d.horas}</span>
          </div>
          <p class="mod-card-desc">${d.descricao}</p>
          <div class="mod-card-coaches">${coachesHtml}</div>
          <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-top:auto;">
            ${badgeHtml}
            ${btnHtml}
          </div>
        </div>
        <div class="mod-card-img">
          <img src="../${d.imagem}" alt="${d.titulo}" loading="lazy">
        </div>
      </article>`;
  }).join('');

  // Bind botão inscrever
  lista.querySelectorAll('.mod-btn-insc[data-key]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      abrirInscricao(btn.dataset.key);
    });
  });

  // Click no card inteiro → abre inscrição (só se disponível)
  lista.querySelectorAll('.mod-card').forEach(card => {
    card.addEventListener('click', () => {
      if (getStatus(card.dataset.key) === 'disponivel') {
        abrirInscricao(card.dataset.key);
      }
    });
  });
}

function getStatus(key) {
  if (!currentUser) return 'disponivel';
  const e = currentEnrollments.find(e => e.modality === key);
  if (!e) return 'disponivel';
  if (e.status === 'active')  return 'inscrito';
  if (e.status === 'pending') return 'pendente';
  return 'disponivel';
}

function labelStatus(s) {
  return {
    inscrito : '✓ Inscrito',
    pendente : '⏳ Pendente',
    disponivel: 'Disponível',
  }[s];
}

function botaoInscricao(key, status) {
  if (status === 'inscrito') return '';
  if (status === 'pendente')
    return `<button class="btn glass mod-btn-insc" disabled style="opacity:.45;cursor:default">
              A aguardar confirmação
            </button>`;
  return `<button class="btn glass mod-btn-insc" data-key="${key}">
            <i class="fa-solid fa-plus"></i> Inscrever
          </button>`;
}


/* ============================================
   RENDER EQUIPA
   Grid usando coaches de data.js
============================================ */
function renderEquipa() {
  const grid = document.getElementById('equipa-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(coaches).map(([key, c]) => {
    const cardBg = c.card
      ? `style="background-image:url('../${c.card}')"`
      : '';

    const modTagsHtml = c.modalidades.map((m, i) => {
      const titulo = modalidadesData[m]?.titulo || m;
      const sep    = i < c.modalidades.length - 1
        ? `<span class="mod-sep">·</span>`
        : '';
      return `<span class="mod-tag">${titulo}</span>${sep}`;
    }).join('');

    const bioText = COACH_BIO[key] || 'Profissional certificado ao serviço dos membros da HIIT-Gym.';

    return `
      <div id="coach">
        <div class="coach-card-img" ${cardBg}>
          ${!c.card ? `<span class="coach-iniciais">${ini(c.nome)}</span>` : ''}
        </div>
        <div id="card_info">
          <span class="nome">${c.nome}</span>
          <div id="modalidades">${modTagsHtml}</div>
          <p id="bio">${bioText}</p>
        </div>
      </div>`;
  }).join('');
}


/* ============================================
   INSCRIÇÃO
============================================ */
function abrirInscricao(key) {
  modalidadeSelecionada = key;
  const d = modalidadesData[key];

  // Título
  document.getElementById('insc-titulo').textContent = d.titulo;

  // Dados do utilizador
  const dadosEl = document.getElementById('insc-dados');
  if (currentUser && currentProfile) {
    const campos = [
      { label: 'Nome',     valor: `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim() || '—' },
      { label: 'Email',    valor: currentProfile.email || '—' },
      { label: 'Telefone', valor: currentProfile.phone || '—' },
      { label: 'Idade',    valor: currentProfile.age    ? `${currentProfile.age} anos`    : null },
      { label: 'Peso',     valor: currentProfile.weight ? `${currentProfile.weight} kg`   : null },
    ].filter(c => c.valor);

    dadosEl.innerHTML = `
      <div class="dados-grid">
        ${campos.map(c => `
          <div class="dado-item">
            <span class="dado-label">${c.label}</span>
            <span class="dado-valor">${c.valor}</span>
          </div>`).join('')}
      </div>`;
  } else {
    dadosEl.innerHTML = `
      <div class="insc-nao-auth">
        <p>Para te inscreveres precisas de ter conta na HIIT-Gym.</p>
        <div class="auth-btns">
          <a href="../index.html" class="btn glass">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Login
          </a>
          <a href="../index.html" class="btn glass">
            <i class="fa-solid fa-user-plus"></i> Criar Conta
          </a>
        </div>
      </div>`;
  }

  // Reset do formulário
  document.getElementById('insc-form')?.reset();
  document.getElementById('xtra-saude')?.classList.add('hidden');
  document.getElementById('xtra-medico')?.classList.add('hidden');
  document.getElementById('insc-erro')?.classList.add('hidden');

  // Mostrar wrap, esconder vazio e sucesso
  document.getElementById('insc-vazio')?.classList.add('hidden');
  document.getElementById('insc-ok')?.classList.add('hidden');
  document.getElementById('insc-form')?.classList.remove('hidden');
  document.getElementById('insc-wrap')?.classList.remove('hidden');

  // Scroll suave para a secção
  document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindInscricao() {
  // Fechar
  document.getElementById('insc-fechar')?.addEventListener('click', fecharInscricao);
  document.getElementById('insc-nova')  ?.addEventListener('click', fecharInscricao);

  // Toggles → campos extra
  document.getElementById('chk-saude') ?.addEventListener('change', e => {
    document.getElementById('xtra-saude')?.classList.toggle('hidden', !e.target.checked);
  });
  document.getElementById('chk-medico')?.addEventListener('change', e => {
    document.getElementById('xtra-medico')?.classList.toggle('hidden', !e.target.checked);
  });

  // Submit
  document.getElementById('insc-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser) return;

    const btn  = document.getElementById('insc-submit');
    const erro = document.getElementById('insc-erro');
    erro.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A enviar...';

    const key  = modalidadeSelecionada;
    const form = e.target;

    // Verificar duplicado
    const { data: existing } = await window.supabase
      .from('enrollments').select('id, status')
      .eq('user_id', currentUser.id)
      .eq('modality', key)
      .maybeSingle();

    if (existing && ['active', 'pending'].includes(existing.status)) {
      mostrarErro(erro, 'Já tens uma inscrição activa ou pendente nesta modalidade.');
      btn.disabled = false;
      btn.innerHTML = 'Confirmar Inscrição <i class="fa-solid fa-check"></i>';
      return;
    }

    const payload = {
      user_id      : currentUser.id,
      modality     : key,
      status       : 'pending',
      has_health   : form.has_health?.checked    || false,
      health_notes : form.health_notes?.value.trim()   || null,
      physio       : form.physio?.checked         || false,
      medical_ref  : form.medical_ref?.checked    || false,
      medical_notes: form.medical_notes?.value.trim()  || null,
    };

    const { error } = existing
      ? await window.supabase.from('enrollments').update(payload).eq('id', existing.id)
      : await window.supabase.from('enrollments').insert(payload);

    btn.disabled = false;
    btn.innerHTML = 'Confirmar Inscrição <i class="fa-solid fa-check"></i>';

    if (error) {
      mostrarErro(erro, 'Erro ao guardar inscrição. Tenta novamente.');
      console.error(error);
      return;
    }

    // Actualiza estado local e re-renderiza os cards
    await carregarInscricoes();
    renderModalidades();

    // Mostrar sucesso
    form.classList.add('hidden');
    document.getElementById('insc-ok')?.classList.remove('hidden');
  });
}

function fecharInscricao() {
  document.getElementById('insc-wrap')?.classList.add('hidden');
  document.getElementById('insc-vazio')?.classList.remove('hidden');
  modalidadeSelecionada = null;
}

function mostrarErro(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}
