// ============================================
// ADMIN.JS — Painel de Administração HIIT-Gym
//
// Depende de:
//   • supabase.js  → window.supabaseClient
//   • global.js    → window.currentUser, app:ready
//
// SEGURANÇA:
//   • Verifica sessão Supabase
//   • Verifica profiles.is_admin = true
//   • Sem is_admin → redireciona para index
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
let todosMembros = [];


// ============================================
// INIT
// ============================================
document.addEventListener('app:ready', async () => {

  // 1. Verificar autenticação
  if (!window.currentUser) {
    window.location.href = '/index.html';
    return;
  }

  // 2. Verificar flag admin na base de dados
  const { data: profile } = await sb
    .from('profiles')
    .select('is_admin, first_name, last_name')
    .eq('id', window.currentUser.id)
    .single();

  if (!profile?.is_admin) {
    window.location.href = '/index.html';
    return;
  }

  // 3. Mostrar página
  document.body.classList.remove('loading');

  // 4. Carregar dados
  await Promise.all([
    carregarInscricoes(),
    carregarMembros(),
  ]);

  // 5. Binds
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
// INSCRIÇÕES
// ============================================
async function carregarInscricoes() {
  const lista = document.getElementById('inscricoes-lista');
  lista.innerHTML = `<div class="loading-state"><i class="fa-solid fa-rotate fa-spin"></i> A carregar…</div>`;

  const { data, error } = await sb
    .from('enrollments')
    .select(`
      id,
      modality,
      status,
      has_health,
      health_notes,
      physio,
      medical_ref,
      medical_notes,
      created_at,
      user_id,
      profiles:user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar inscrições.</div>`;
    console.error('Erro inscrições:', error);
    return;
  }

  // Email não está no profile (está no auth) — usamos o UUID abreviado
  const enriched = (data || []).map(enr => ({
    ...enr,
    email: enr.user_id ? enr.user_id.slice(0, 8) + '…' : '—'
  }));

  // Actualizar badge
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
    const p      = enr.profiles || {};
    const nome   = [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
    const mod    = MODALIDADES_LABEL[enr.modality] || enr.modality;
    const data   = new Date(enr.created_at).toLocaleDateString('pt-PT');
    const temSaude = enr.has_health || enr.physio || enr.medical_ref;

    return `
      <div class="insc-card" data-id="${enr.id}">
        <div class="insc-info">
          <span class="insc-nome">${nome}</span>
          <span class="insc-email">${enr.email}</span>
          <div class="insc-meta">
            <span class="insc-modalidade">${mod}</span>
            <span class="insc-data"><i class="fa-regular fa-clock"></i> ${data}</span>
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

  // Binds
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

  const { error } = await sb
    .from('enrollments')
    .update({ status: novoStatus })
    .eq('id', id);

  if (error) {
    toast('Erro ao actualizar inscrição.', 'erro');
    btns?.forEach(b => { b.disabled = false; });
    return;
  }

  const msg = novoStatus === 'active' ? '✓ Inscrição confirmada!' : '✗ Inscrição cancelada.';
  toast(msg, novoStatus === 'active' ? 'ok' : 'erro');

  // Remover card com animação
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateX(20px)';
  setTimeout(() => {
    card.remove();
    // Actualizar badge
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
  }, 300);
}


// ============================================
// MEMBROS
// ============================================
async function carregarMembros() {
  const listaM = document.getElementById('membros-lista');
  const listaP = document.getElementById('planos-lista');

  listaM.innerHTML = `<div class="loading-state"><i class="fa-solid fa-rotate fa-spin"></i> A carregar…</div>`;

  const { data, error } = await sb
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, plan, is_admin')
    .order('first_name', { ascending: true });

  if (error) {
    listaM.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar membros.</div>`;
    return;
  }

  todosMembros = data || [];
  renderMembros(todosMembros);
  renderPlanos(todosMembros);
}

function iniciais(p) {
  return ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase()
    || '?';
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
    const avatarStyle = p.avatar_url
      ? `style="background-image:url('${p.avatar_url}')"`
      : '';

    return `
      <div class="membro-card">
        <div class="membro-avatar" ${avatarStyle}>${p.avatar_url ? '' : iniciais(p)}</div>
        <div class="membro-info">
          <span class="membro-nome">${nome}${p.is_admin ? ' <span style="color:var(--clr-4);font-size:.6rem">ADMIN</span>' : ''}</span>
          <span class="membro-email">${p.id}</span>
        </div>
        <span class="membro-plano ${plano}">${plano === 'none' ? 'Sem plano' : plano}</span>
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
    const avatarStyle = p.avatar_url
      ? `style="background-image:url('${p.avatar_url}')"`
      : '';

    const options = PLANOS.map(pl =>
      `<option value="${pl}" ${pl === plano ? 'selected' : ''}>${pl === 'none' ? 'Sem plano' : pl}</option>`
    ).join('');

    return `
      <div class="plano-card" data-userid="${p.id}">
        <div class="plano-avatar" ${avatarStyle}>${p.avatar_url ? '' : iniciais(p)}</div>
        <div class="plano-info">
          <span class="plano-nome">${nome}</span>
          <span class="plano-email">${p.id.slice(0,8)}…</span>
        </div>
        <div class="plano-selector">
          <select class="plano-select" data-userid="${p.id}" data-plano-atual="${plano}">
            ${options}
          </select>
          <button class="btn-save-plano" data-userid="${p.id}">
            <i class="fa-solid fa-floppy-disk"></i> Guardar
          </button>
        </div>
      </div>`;
  }).join('');

  // Binds
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

  if (error) {
    toast('Erro ao actualizar plano.', 'erro');
    return;
  }

  toast(`Plano actualizado: ${novoPlano === 'none' ? 'sem plano' : novoPlano}`, 'ok');

  // Actualiza estado local
  const membro = todosMembros.find(m => m.id === userId);
  if (membro) membro.plan = novoPlano === 'none' ? null : novoPlano;
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
  el.className = `admin-toast toast-${tipo}`;
  _toastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, 3000);
}
