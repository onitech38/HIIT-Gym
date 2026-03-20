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
// Sem { once: true } — em bfcache restore o app:ready re-dispara
// e precisamos de recarregar as inscrições para mostrar estado actual
let _modInited = false;

document.addEventListener('app:ready', async () => {
  if (!_modInited) {
    // Primeira vez: init completo
    _modInited = true;
    await init();
  } else if (window.currentUser) {
    // Bfcache restore: só recarrega inscrições e re-renderiza
    currentUser = window.currentUser;
    await loadEnrollments();
    renderModalidades();
    inscricaoStep1();
  }
});

async function init() {
  if (window.currentUser) {
    currentUser = window.currentUser;
    await Promise.all([loadProfile(), loadEnrollments()]);
  }

  renderModalidades();
  renderEquipa();
  inscricaoStep1();

  document.body.classList.remove('loading');

  // Deep-link ?modal=key
  const key = new URLSearchParams(window.location.search).get('modal');
  if (key && modalidadesData[key]?.active) {
    inscricaoStep2(key);
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


/* ============================================
   5. INSCRIÇÃO — 2 PASSOS

   Layout da secção #inscricao:
   ┌────────────────────────────────┐
   │  #insc-wrap                    │
   │  ┌──────────┐ ┌──────────────┐ │
   │  │ step1    │ │ step2        │ │
   │  │ (lista)  │ │ (form saúde) │ │
   │  └──────────┘ └──────────────┘ │
   └────────────────────────────────┘

   Quando step2 está aberto → step1 fica escondido.
   Fechar step2 → step1 volta, sem qualquer scroll.
============================================ */

function inscricaoStep1() {
  const wrap = document.getElementById('insc-wrap');
  if (!wrap) return;

  const activas = Object.entries(modalidadesData).filter(([, d]) => d.active);
  const disponiveis = activas.filter(([key]) => getStatus(key) === 'disponivel');
  const jaInscritas = activas.filter(([key]) => getStatus(key) !== 'disponivel');

  let listaHtml = '';

  if (!currentUser) {
    // Não autenticado: mostra lista mas com aviso
    listaHtml = activas.map(([key, d]) => `
      <li class="step1-item step1-item--lock" data-key="${key}">
        <span class="step1-nome">${d.titulo}</span>
        <span class="step1-horario">${d.dias} · ${d.horas}</span>
        <span class="step1-cta"><i class="fa-solid fa-lock"></i></span>
      </li>`).join('');

  } else if (disponiveis.length === 0) {
    // Tudo inscrito
    listaHtml = `<li class="step1-vazio">
      <i class="fa-solid fa-circle-check"></i>
      Estás inscrito em todas as modalidades disponíveis!
    </li>`;

  } else {
    listaHtml = disponiveis.map(([key, d]) => `
      <li class="step1-item" data-key="${key}">
        <span class="step1-nome">${d.titulo}</span>
        <span class="step1-horario">${d.dias} · ${d.horas}</span>
        <span class="step1-cta">Inscrever <i class="fa-solid fa-arrow-right"></i></span>
      </li>`).join('');
  }

  // Badge de já inscritas (se houver)
  const inscritasHtml = jaInscritas.length ? `
    <div class="step1-inscritas">
      <span class="step1-inscritas-label">Já inscrito:</span>
      ${jaInscritas.map(([key, d]) => {
        const s = getStatus(key);
        return `<span class="mod-badge ${s}">${d.titulo} ${s === 'pendente' ? '⏳' : '✓'}</span>`;
      }).join('')}
    </div>` : '';

  // Aviso de login (apenas não autenticado)
  const loginAviso = !currentUser ? `
    <div class="step1-login-aviso">
      <p>Precisas de conta para te inscreveres.</p>
      <div>
        <a href="../index.html" class="btn glass"><i class="fa-solid fa-arrow-right-to-bracket"></i> Login / Criar Conta</a>
      </div>
    </div>` : '';

  wrap.innerHTML = `
    <div id="insc-step1">
      <p class="step1-intro">
        ${currentUser ? 'Escolhe a modalidade em que te queres inscrever.' : 'Modalidades disponíveis para inscrição.'}
      </p>
      <ul class="step1-lista">${listaHtml}</ul>
      ${inscritasHtml}
      ${loginAviso}
    </div>`;

  // Bind clicks (só se autenticado e com disponíveis)
  if (currentUser) {
    wrap.querySelectorAll('.step1-item[data-key]').forEach(item => {
      item.addEventListener('click', () => inscricaoStep2(item.dataset.key));
    });
  }
}


function inscricaoStep2(key) {
  selectedModality = key;
  const d    = modalidadesData[key];
  const wrap = document.getElementById('insc-wrap');
  if (!wrap) return;

  // Dados do utilizador
  let dadosHtml = '';
  if (currentUser) {
    const p      = currentProfile;
    const campos = [
      { l: 'Nome',     v: [p.first_name, p.last_name].filter(Boolean).join(' ') || '—' },
      { l: 'Email',    v: p.email || '—' },
      { l: 'Telefone', v: p.phone || '—' },
      { l: 'Idade',    v: p.age    ? `${p.age} anos`  : null },
      { l: 'Peso',     v: p.weight ? `${p.weight} kg` : null },
    ].filter(c => c.v);

    dadosHtml = `
      <div class="insc-dados">
        ${campos.map(c => `
          <div class="dado-item">
            <span class="dado-label">${c.l}</span>
            <span class="dado-valor">${c.v}</span>
          </div>`).join('')}
      </div>`;
  } else {
    dadosHtml = `
      <div class="insc-dados insc-nao-auth">
        <p>Precisas de conta para te inscreveres.</p>
        <a href="../index.html" class="btn glass"><i class="fa-solid fa-arrow-right-to-bracket"></i> Login / Criar Conta</a>
      </div>`;
  }

  wrap.innerHTML = `
    <div id="insc-step2">

      <div class="insc-topo">
        <button class="btn icon glass" id="btn-voltar" aria-label="Voltar à lista de modalidades">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="insc-topo-txt">
          <span class="eyebrow-small">Inscrição em</span>
          <h3>${d.titulo}</h3>
        </div>
      </div>

      ${dadosHtml}

      ${currentUser ? `
      <form id="insc-form" class="insc-saude" novalidate>

        <div class="insc-saude-header">
          <i class="fa-solid fa-heart-pulse"></i>
          <span>Informação de Saúde</span>
          <small>Confidencial — garante a tua segurança nas aulas.</small>
        </div>

        <div class="toggle-row">
          <label for="chk-saude">Tens algum problema de saúde relevante?</label>
          <input type="checkbox" id="chk-saude" name="has_health" class="t-input">
          <label for="chk-saude" class="t-label" aria-hidden="true"></label>
        </div>
        <div class="extra-campo hidden" id="xtra-saude">
          <label for="health_notes">Descreve brevemente <span class="opt">(opcional)</span></label>
          <textarea id="health_notes" name="health_notes" rows="3"
                    placeholder="Ex: problema no joelho, asma leve..."></textarea>
        </div>

        <div class="toggle-row">
          <label for="chk-fisio">Estás a fazer fisioterapia?</label>
          <input type="checkbox" id="chk-fisio" name="physio" class="t-input">
          <label for="chk-fisio" class="t-label" aria-hidden="true"></label>
        </div>

        <div class="toggle-row">
          <label for="chk-medico">Inscrição por recomendação médica?</label>
          <input type="checkbox" id="chk-medico" name="medical_ref" class="t-input">
          <label for="chk-medico" class="t-label" aria-hidden="true"></label>
        </div>
        <div class="extra-campo hidden" id="xtra-medico">
          <label for="medical_notes">Notas médicas <span class="opt">(opcional)</span></label>
          <textarea id="medical_notes" name="medical_notes" rows="3"
                    placeholder="Ex: recomendado pelo médico para reabilitação..."></textarea>
        </div>

        <p class="form-error hidden" id="insc-erro" role="alert"></p>

        <button type="submit" class="btn glass insc-submit">
          Confirmar Inscrição <i class="fa-solid fa-check"></i>
        </button>

      </form>

      <div class="insc-ok hidden" id="insc-ok">
        <i class="fa-solid fa-circle-check"></i>
        <h3>Inscrição enviada!</h3>
        <p>A equipa confirma em 24–48h. Até lá vês o estado em "Pendente".</p>
        <button class="btn glass" id="btn-nova-insc">Inscrever noutra modalidade</button>
      </div>
      ` : ''}

    </div>`;

  // ── Binds ──────────────────────────────────────

  // Voltar ao step 1 — sem scroll
  document.getElementById('btn-voltar')?.addEventListener('click', () => {
    inscricaoStep1();
  });

  // Nova inscrição → step 1
  document.getElementById('btn-nova-insc')?.addEventListener('click', () => {
    inscricaoStep1();
  });

  // Toggles saúde/médico
  document.getElementById('chk-saude')?.addEventListener('change', e =>
    document.getElementById('xtra-saude')?.classList.toggle('hidden', !e.target.checked));
  document.getElementById('chk-medico')?.addEventListener('change', e =>
    document.getElementById('xtra-medico')?.classList.toggle('hidden', !e.target.checked));

  // Submit
  document.getElementById('insc-form')?.addEventListener('submit', submeterInscricao);
}


/* ============================================
   6. SUBMIT
============================================ */
async function submeterInscricao(e) {
  e.preventDefault();
  if (!currentUser) return;

  const btn  = e.target.querySelector('.insc-submit');
  const erro = document.getElementById('insc-erro');
  erro?.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A enviar...';

  // Verificar se já existe inscrição activa/pendente
  const existente = currentEnrollments.find(
    en => en.modality === selectedModality && ['active','pending'].includes(en.status)
  );
  if (existente) {
    erro.textContent = 'Já tens uma inscrição activa ou pendente nesta modalidade.';
    erro.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = 'Confirmar Inscrição <i class="fa-solid fa-check"></i>';
    return;
  }

  const form    = e.target;
  const payload = {
    user_id      : currentUser.id,
    modality     : selectedModality,
    status       : 'pending',
    has_health   : form.has_health?.checked   || false,
    health_notes : form.health_notes?.value.trim()  || null,
    physio       : form.physio?.checked        || false,
    medical_ref  : form.medical_ref?.checked   || false,
    medical_notes: form.medical_notes?.value.trim() || null,
  };

  const { error } = await window.supabaseClient.from('enrollments').insert(payload);

  btn.disabled = false;
  btn.innerHTML = 'Confirmar Inscrição <i class="fa-solid fa-check"></i>';

  if (error) {
    erro.textContent = 'Erro ao guardar inscrição. Tenta novamente.';
    erro.classList.remove('hidden');
    console.error(error);
    return;
  }

  // Actualiza estado local e re-renderiza cards
  await loadEnrollments();
  renderModalidades();

  // Mostra mensagem de sucesso (esconde form)
  form.classList.add('hidden');
  document.getElementById('insc-ok')?.classList.remove('hidden');
}


// ============================================
// BFCACHE — forçar reload de inscrições
// Em mobile, o browser pode restaurar a página
// do bfcache sem re-executar scripts nem disparar
// app:ready. O evento pageshow com persisted:true
// detecta isso e recarrega sempre as inscrições.
// ============================================
window.addEventListener('pageshow', async (e) => {
  if (!e.persisted) return; // navegação normal — já tratada

  // Não depende de window.currentUser (pode estar null no bfcache restore)
  // Lê directamente a sessão do Supabase
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session?.user) return; // não autenticado

    currentUser = session.user;
    await loadEnrollments();
    renderModalidades();
    inscricaoStep1();
  } catch { /* Supabase indisponível — ignora */ }
});
