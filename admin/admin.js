// ============================================
// ADMIN.JS — Painel de Administração HIIT-Gym
// ============================================

const sb = window.supabaseClient;

const PLANOS = ['none', 'basico', 'standard', 'premium'];

const MODALIDADES_LABEL = {
  musculacao:   'Musculação',
  cardio:       'Cardio',
  yoga_pilates: 'Yoga & Pilates',
  lutas:        'Lutas e Artes Marciais',
  zumba_danca:  'Zumba e Danças',
  natacao:      'Natação',
};

// ── Estado ────────────────────────────────────
let todosMembros     = [];
let todasInscricoes  = []; // todas as active (para tab modalidades)


// ============================================
// INIT
// ============================================
document.addEventListener('app:ready', async () => {

  if (!window.currentUser) {
    window.location.href = '/index.html';
    return;
  }

  const { data: profile } = await sb
    .from('profiles')
    .select('is_admin, first_name, last_name')
    .eq('id', window.currentUser.id)
    .single();

  if (!profile?.is_admin) {
    window.location.href = '/index.html';
    return;
  }

  document.body.classList.remove('loading');

  await Promise.all([
    carregarInscricoes(),
    carregarMembros(),
    carregarModalidadesAdmin(),
  ]);

  bindTabs();
  bindLogout();
  bindSearchMembros();
  document.getElementById('btn-refresh-insc')
    ?.addEventListener('click', carregarInscricoes);
});


// ============================================
// TABS
// ============================================
function bindTabs() {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.remove('hidden');
    });
  });
}


// ============================================
// LOGOUT
// ============================================
function bindLogout() {
  document.getElementById('btn-logout-admin')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = '/index.html';
  });
}


// ============================================
// INSCRIÇÕES PENDENTES
// ============================================
async function carregarInscricoes() {
  const lista = document.getElementById('inscricoes-lista');
  lista.innerHTML = `<div class="loading-state"><i class="fa-solid fa-rotate fa-spin"></i> A carregar…</div>`;

  const { data, error } = await sb
    .from('enrollments')
    .select(`
      id, modality, status, has_health, health_notes,
      physio, medical_ref, medical_notes, created_at, user_id,
      profiles:user_id ( id, first_name, last_name, avatar_url )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar inscrições.</div>`;
    return;
  }

  const enriched = (data || []).map(enr => ({
    ...enr,
    email: enr.user_id ? enr.user_id.slice(0, 8) + '…' : '—',
  }));

  const badge = document.getElementById('badge-pendentes');
  if (badge) badge.textContent = enriched.length || '';

  if (enriched.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-check"></i>
        Sem inscrições pendentes.
      </div>`;
    return;
  }

  lista.innerHTML = enriched.map(enr => {
    const p        = enr.profiles || {};
    const nome     = [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
    const mod      = MODALIDADES_LABEL[enr.modality] || enr.modality;
    const dataStr  = new Date(enr.created_at).toLocaleDateString('pt-PT');
    const temSaude = enr.has_health || enr.physio || enr.medical_ref;

    return `
      <div class="insc-card" data-id="${enr.id}">
        <div class="insc-info">
          <span class="insc-nome">${nome}</span>
          <span class="insc-email">${enr.email}</span>
          <div class="insc-meta">
            <span class="insc-modalidade">${mod}</span>
            <span class="insc-data"><i class="fa-regular fa-clock"></i> ${dataStr}</span>
            ${temSaude ? `<span class="insc-saude-info"><i class="fa-solid fa-heart-pulse"></i> Info de saúde</span>` : ''}
          </div>
          ${enr.health_notes ? `<div style="font-size:.72rem;color:var(--clr-2);opacity:.7;margin-top:.35rem;font-style:italic">"${enr.health_notes}"</div>` : ''}
        </div>
        <div class="insc-acoes">
          <button class="btn-confirmar" data-id="${enr.id}">
            <i class="fa-solid fa-check"></i> Confirmar
          </button>
          <button class="btn-rejeitar" data-id="${enr.id}">
            <i class="fa-solid fa-xmark"></i> Rejeitar
          </button>
        </div>
      </div>`;
  }).join('');

  lista.querySelectorAll('.btn-confirmar').forEach(btn => {
    btn.addEventListener('click', () => accionarInscricao(btn.dataset.id, 'active'));
  });
  lista.querySelectorAll('.btn-rejeitar').forEach(btn => {
    btn.addEventListener('click', () => accionarInscricao(btn.dataset.id, 'cancelled'));
  });
}

async function accionarInscricao(id, novoStatus) {
  const card = document.querySelector(`.insc-card[data-id="${id}"]`);
  const btns = card?.querySelectorAll('button');
  btns?.forEach(b => { b.disabled = true; });

  const { error } = await sb.from('enrollments').update({ status: novoStatus }).eq('id', id);

  if (error) {
    toast('Erro ao actualizar inscrição.', 'erro');
    btns?.forEach(b => { b.disabled = false; });
    return;
  }

  toast(novoStatus === 'active' ? '✓ Inscrição confirmada!' : '✗ Inscrição cancelada.',
        novoStatus === 'active' ? 'ok' : 'erro');

  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  card.style.opacity    = '0';
  card.style.transform  = 'translateX(20px)';
  setTimeout(() => {
    card.remove();
    const restantes = document.querySelectorAll('.insc-card').length;
    const badge = document.getElementById('badge-pendentes');
    if (badge) badge.textContent = restantes || '';
    if (restantes === 0) {
      document.getElementById('inscricoes-lista').innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check"></i>
          Sem inscrições pendentes.
        </div>`;
    }
    // Actualiza tab modalidades em background
    carregarModalidadesAdmin();
  }, 300);
}


// ============================================
// MEMBROS
// ============================================
async function carregarMembros() {
  const listaM = document.getElementById('membros-lista');
  const listaP = document.getElementById('planos-lista');

  listaM.innerHTML = `<div class="loading-state"><i class="fa-solid fa-rotate fa-spin"></i> A carregar…</div>`;

  // Carrega perfis + todas as inscrições activas de cada membro
  const [{ data: perfis, error }, { data: enrolls }] = await Promise.all([
    sb.from('profiles').select('id, first_name, last_name, avatar_url, plan, is_admin').order('first_name'),
    sb.from('enrollments').select('user_id, modality, status').eq('status', 'active'),
  ]);

  if (error) {
    listaM.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> Erro.</div>`;
    return;
  }

  todosMembros = (perfis || []).map(p => ({
    ...p,
    modalidades: (enrolls || []).filter(e => e.user_id === p.id).map(e => e.modality),
  }));

  renderMembros(todosMembros);
  renderPlanos(todosMembros);
}

function iniciais(p) {
  return ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase() || '?';
}

function renderMembros(lista) {
  const listaEl = document.getElementById('membros-lista');
  if (lista.length === 0) {
    listaEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i> Sem membros.</div>`;
    return;
  }

  listaEl.innerHTML = lista.map(p => {
    const nome  = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sem nome';
    const plano = p.plan || 'none';
    const avatarStyle = p.avatar_url ? `style="background-image:url('${p.avatar_url}')"` : '';

    // Badges de modalidades inscritas
    const modsBadges = p.modalidades.length
      ? p.modalidades.map(m =>
          `<span class="membro-mod-badge">${MODALIDADES_LABEL[m] || m}</span>`
        ).join('')
      : `<span style="font-size:.65rem;color:var(--clr-2);opacity:.4;">Nenhuma</span>`;

    return `
      <div class="membro-card">
        <div class="membro-avatar" ${avatarStyle}>${p.avatar_url ? '' : iniciais(p)}</div>
        <div class="membro-info">
          <span class="membro-nome">
            ${nome}
            ${p.is_admin ? '<span style="color:var(--clr-4);font-size:.6rem">ADMIN</span>' : ''}
          </span>
          <div class="membro-mods">${modsBadges}</div>
        </div>
        <span class="membro-plano golden-border ${plano}">
          ${plano === 'none' ? 'Sem plano' : plano}
        </span>
      </div>`;
  }).join('');
}

function renderPlanos(lista) {
  const listaEl = document.getElementById('planos-lista');
  if (lista.length === 0) {
    listaEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i> Sem membros.</div>`;
    return;
  }

  listaEl.innerHTML = lista.map(p => {
    const nome  = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sem nome';
    const plano = p.plan || 'none';
    const avatarStyle = p.avatar_url ? `style="background-image:url('${p.avatar_url}')"` : '';
    const options = PLANOS.map(pl =>
      `<option value="${pl}" ${pl === plano ? 'selected' : ''}>${pl === 'none' ? 'Sem plano' : pl}</option>`
    ).join('');

    return `
      <div class="plano-card" data-userid="${p.id}">
        <div class="plano-avatar" ${avatarStyle}>${p.avatar_url ? '' : iniciais(p)}</div>
        <div class="plano-info">
          <span class="plano-nome">${nome}</span>
          <span class="plano-email">${p.id.slice(0, 8)}…</span>
        </div>
        <div class="plano-selector">
          <select class="plano-select" data-userid="${p.id}">
            ${options}
          </select>
          <button class="btn-save-plano" data-userid="${p.id}">
            <i class="fa-solid fa-floppy-disk"></i> Guardar
          </button>
        </div>
      </div>`;
  }).join('');

  listaEl.querySelectorAll('.btn-save-plano').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.userid;
      const select = listaEl.querySelector(`.plano-select[data-userid="${userId}"]`);
      guardarPlano(userId, select?.value, btn);
    });
  });
}

async function guardarPlano(userId, novoPlano, btn) {
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  const { error } = await sb
    .from('profiles')
    .update({ plan: novoPlano === 'none' ? null : novoPlano })
    .eq('id', userId);

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';

  if (error) { toast('Erro ao actualizar plano.', 'erro'); return; }

  toast(`Plano actualizado: ${novoPlano === 'none' ? 'sem plano' : novoPlano}`, 'ok');
  const membro = todosMembros.find(m => m.id === userId);
  if (membro) membro.plan = novoPlano === 'none' ? null : novoPlano;
}


// ============================================
// MODALIDADES ADMIN — membros por modalidade
// ============================================
async function carregarModalidadesAdmin() {
  const lista = document.getElementById('modalidades-admin-lista');
  if (!lista) return;

  lista.innerHTML = `<div class="loading-state"><i class="fa-solid fa-rotate fa-spin"></i> A carregar…</div>`;

  // Busca todas as inscrições activas com dados do perfil
  const { data, error } = await sb
    .from('enrollments')
    .select(`
      id, modality, status, created_at, user_id,
      profiles:user_id ( id, first_name, last_name, avatar_url, plan )
    `)
    .eq('status', 'active')
    .order('modality');

  if (error) {
    lista.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> Erro.</div>`;
    return;
  }

  todasInscricoes = data || [];

  // Agrupa por modalidade
  const porModalidade = {};
  Object.keys(MODALIDADES_LABEL).forEach(key => { porModalidade[key] = []; });
  todasInscricoes.forEach(enr => {
    if (porModalidade[enr.modality] !== undefined) {
      porModalidade[enr.modality].push(enr);
    }
  });

  lista.innerHTML = Object.entries(MODALIDADES_LABEL).map(([key, label]) => {
    const membros = porModalidade[key] || [];
    const count   = membros.length;

    const membrosHtml = count === 0
      ? `<div class="mod-admin-empty">Nenhum membro inscrito.</div>`
      : membros.map(enr => {
          const p     = enr.profiles || {};
          const nome  = [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
          const plano = p.plan || 'none';
          const avatarStyle = p.avatar_url ? `style="background-image:url('${p.avatar_url}')"` : '';
          const dataStr = new Date(enr.created_at).toLocaleDateString('pt-PT');

          return `
            <div class="mod-admin-membro">
              <div class="membro-avatar small" ${avatarStyle}>${p.avatar_url ? '' : iniciais(p)}</div>
              <div class="mod-admin-membro-info">
                <span class="mod-admin-membro-nome">${nome}</span>
                <span class="mod-admin-membro-data">Desde ${dataStr}</span>
              </div>
              <span class="membro-plano golden-border ${plano}">
                ${plano === 'none' ? 'Sem plano' : plano}
              </span>
            </div>`;
        }).join('');

    return `
      <details class="mod-admin-card">
        <summary class="mod-admin-summary">
          <div class="mod-admin-summary-info">
            <span class="mod-admin-nome">${label}</span>
            <span class="mod-admin-count">
              ${count} membro${count !== 1 ? 's' : ''} inscrito${count !== 1 ? 's' : ''}
            </span>
          </div>
          <i class="fa-solid fa-chevron-down mod-admin-chevron"></i>
        </summary>
        <div class="mod-admin-membros">
          ${membrosHtml}
        </div>
      </details>`;
  }).join('');
}


// ============================================
// SEARCH MEMBROS
// ============================================
function bindSearchMembros() {
  const input = document.getElementById('search-membros');
  input?.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) { renderMembros(todosMembros); return; }
    const filtrado = todosMembros.filter(p => {
      const nome = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      return nome.includes(q) || p.id.includes(q);
    });
    renderMembros(filtrado);
  });
}


// ============================================
// TOAST
// ============================================
let _toastTimer = null;

function toast(msg, tipo = 'ok') {
  const el = document.getElementById('admin-toast');
  if (!el) return;
  if (_toastTimer) clearTimeout(_toastTimer);
  el.textContent = msg;
  el.className   = `admin-toast toast-${tipo}`;
  _toastTimer    = setTimeout(() => el.classList.add('hidden'), 3000);
}
