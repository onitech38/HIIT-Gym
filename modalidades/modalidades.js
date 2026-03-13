/* ============================================
   MODALIDADES.JS — mecânica da página

   Conteúdo (coaches, modalidades) → data.js
   Nav/footer partilhado             → global.js

   ÍNDICE:
   1. Estado global + helpers
   2. Init (sessão Supabase, render, auto-open)
   3. renderModalidades() — cards da secção .mod
   4. renderEquipa()      — grid de coaches
   5. Inscrição 2 passos:
        inscricaoStep1() — lista de modalidades
        inscricaoStep2() — form de saúde
   6. submeterInscricao()
   ============================================ */




// ── Estado global ─────────────────────────────
let currentUser        = null;
let currentProfile     = {};
let currentEnrollments = [];
let keySeleccionada    = null;




/* ============================================
   1. INIT
============================================ */
window.addEventListener('load', async () => {

  // Sessão Supabase
  const { data: { session } } = await window.supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await Promise.all([carregarPerfil(), carregarInscricoes()]);
  }

  renderModalidades();
  renderEquipa();

  // Secção de inscrição começa sempre no step 1
  inscricaoStep1();

  // Mostra a página (estava oculta via body.loading para evitar FOUC)
  document.body.classList.remove('loading');

  // ?modal=KEY → abre directamente o step 2
  const autoKey = new URLSearchParams(window.location.search).get('modal');
  if (autoKey && modalidadesData[autoKey]?.active) {
    inscricaoStep2(autoKey);
    // Scroll suave para a secção de inscrição
    setTimeout(() => {
      document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
});


/* ── Supabase ─────────────────────────────────── */
async function carregarPerfil() {
  const { data } = await window.supabase.from('profiles').select('*')
    .eq('id', currentUser.id).single();
  currentProfile = data || {};
  currentProfile.email = currentUser.email;
}

async function carregarInscricoes() {
  const { data } = await window.supabase.from('enrollments').select('*')
    .eq('user_id', currentUser.id);
  currentEnrollments = data || [];
}


/* ============================================
   3. RENDER MODALIDADES — cards
============================================ */
function getStatus(key) {
  if (!currentUser) return 'disponivel';
  const e = currentEnrollments.find(e => e.modality === key);
  if (!e) return 'disponivel';
  if (e.status === 'active')  return 'inscrito';
  if (e.status === 'pending') return 'pendente';
  return 'disponivel';
}

const labelBadge = s => ({
  inscrito  : '✓ Inscrito',
  pendente  : '⏳ Pendente',
  disponivel: 'Disponível',
}[s]);

function renderModalidades() {
  const lista = document.getElementById('mod-lista');
  if (!lista) return;

  lista.innerHTML = Object.entries(modalidadesData)
    .filter(([, d]) => d.active)
    .map(([key, d]) => {
      const st = getStatus(key);

      const coachesHtml = (d.coaches || []).map(ck => {
        const c = coaches[ck];
        if (!c) return '';
        const bg = c.avatar ? `style="background-image:url('../${c.avatar}')"` : '';
        return `<div class="coach-mini">
          <div class="coach-mini-avatar" ${bg}>${c.avatar ? '' : ini(c.nome)}</div>
          <span class="coach-mini-tooltip">${c.nome}</span>
        </div>`;
      }).join('');

      const btnHtml = st === 'inscrito' ? '' :
        st === 'pendente'
          ? `<button class="btn glass mod-btn-insc" disabled>A aguardar confirmação</button>`
          : `<button class="btn glass mod-btn-insc" data-key="${key}">
               <i class="fa-solid fa-plus"></i> Inscrever
             </button>`;

      return `
        <article class="mod-card" data-key="${key}" data-status="${st}">
          <div class="mod-card-body">
            <span class="mod-card-titulo">${d.titulo}</span>
            <div class="mod-card-horarios">
              <span><i class="fa-solid fa-calendar-days"></i>${d.dias}</span>
              <span><i class="fa-solid fa-clock"></i>${d.horas}</span>
            </div>
            <p class="mod-card-desc">${d.descricao}</p>
            <div class="mod-card-coaches">${coachesHtml}</div>
            <div class="mod-card-acoes">
              <span class="mod-badge ${st}">${labelBadge(st)}</span>
              ${btnHtml}
            </div>
          </div>
          <div class="mod-card-img">
            <img src="../${d.imagem}" alt="${d.titulo}" loading="lazy">
          </div>
        </article>`;
    }).join('');

  // Bind: botão "Inscrever" nos cards → step 2 da secção de inscrição
  lista.querySelectorAll('.mod-btn-insc[data-key]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      inscricaoStep2(btn.dataset.key);
      document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ============================================
   4. RENDER EQUIPA
============================================ */
function renderEquipa() {
  const grid = document.getElementById('equipa-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(coaches).map(([key, c]) => {
    const cardBg   = c.card ? `style="background-image:url('../${c.card}')"` : '';
    const modTags  = c.modalidades
      .map(m => `<span class="mod-tag">${modalidadesData[m]?.titulo || m}</span>`)
      .join('<span class="mod-sep">·</span>');
    const bio = c.bio || 'Profissional certificado ao serviço dos membros da HIIT-Gym.';

    return `
      <div class="equipa-card" ${cardBg}>
        ${!c.card ? `<span class="equipa-card-iniciais">${ini(c.nome)}</span>` : ''}
        <div class="equipa-card-info">
          <span class="equipa-card-nome">${c.nome}</span>
          <span class="equipa-card-tags">${modTags}</span>
          <span class="equipa-card-tags">${bio}</span>
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
  keySeleccionada = key;
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
    en => en.modality === keySeleccionada && ['active','pending'].includes(en.status)
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
    modality     : keySeleccionada,
    status       : 'pending',
    has_health   : form.has_health?.checked   || false,
    health_notes : form.health_notes?.value.trim()  || null,
    physio       : form.physio?.checked        || false,
    medical_ref  : form.medical_ref?.checked   || false,
    medical_notes: form.medical_notes?.value.trim() || null,
  };

  const { error } = await window.supabase.from('enrollments').insert(payload);

  btn.disabled = false;
  btn.innerHTML = 'Confirmar Inscrição <i class="fa-solid fa-check"></i>';

  if (error) {
    erro.textContent = 'Erro ao guardar inscrição. Tenta novamente.';
    erro.classList.remove('hidden');
    console.error(error);
    return;
  }

  // Actualiza estado local e re-renderiza cards
  await carregarInscricoes();
  renderModalidades();

  // Mostra mensagem de sucesso (esconde form)
  form.classList.add('hidden');
  document.getElementById('insc-ok')?.classList.remove('hidden');
}
