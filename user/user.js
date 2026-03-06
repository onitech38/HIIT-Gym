/* ============================================
   HIIT-GYM — USER.JS
   
   O que este ficheiro faz:
   1. Verifica se o user está autenticado
      (se não estiver, manda para o início)
   2. Preenche a página com os dados do user
      (nome, stats, treinos, modalidades)
   3. Trata de:
      - Upload de foto de perfil
      - Guardar alterações ao perfil
      - Adicionar treino manual
      - Inscrever / pedir desactivação de modalidades
      - Logout
   ============================================ */

// ── DADOS E CONFIGURAÇÕES ────────────────────

const AUTH_KEY = 'hiitgym_user';

// Informações de cada modalidade (ícones, títulos, horários)
const MODALIDADES = {
  musculacao:   { titulo: 'Musculação',              icon: 'fa-dumbbell',    dias: 'Todos os dias',       horas: '06h00 – 22h00' },
  cardio:       { titulo: 'Cardio',                  icon: 'fa-heart-pulse', dias: 'Todos os dias',       horas: '07h00 – 21h00' },
  yoga_pilates: { titulo: 'Yoga & Pilates',          icon: 'fa-spa',         dias: '2ª, 4ª e 6ª feira',  horas: '17h00 – 19h30' },
  lutas:        { titulo: 'Lutas e Artes Marciais',  icon: 'fa-shield-halved',dias: '2ª feira a sábado', horas: '19h00 – 20h30' },
  zumba_danca:  { titulo: 'Zumba e Danças',          icon: 'fa-music',       dias: '3ª e 5ª feira',      horas: '20h00 – 21h30' },
  natacao:      { titulo: 'Natação',                 icon: 'fa-person-swimming', dias: '2ª, 4ª e 6ª feira', horas: '08h00 – 20h00' },
};

// ── HELPERS ──────────────────────────────────

const getUser     = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } };
const saveUser    = (u) => localStorage.setItem(AUTH_KEY, JSON.stringify(u));
const getIniciais = (u) => ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase();

/** Formata data ISO (2026-03-04) em texto (04 Mar 2026) */
function formatDate(iso) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const d = new Date(iso + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

/** Aplica avatar (foto ou iniciais) a um elemento */
function aplicarAvatar(el, user) {
  if (!el) return;
  if (user.avatar) {
    el.style.backgroundImage = `url('${user.avatar}')`;
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = getIniciais(user);
  }
}

// ── PASSO 1: VERIFICAR AUTH ───────────────────
// Se não há user na "gaveta", manda para o início

const user = getUser();
if (!user) {
  window.location.href = '../index.html';
}

// ── PASSO 2: PREENCHER NAV (avatar no topo) ───

function preencherNav() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navAvatarImg = document.getElementById('nav-avatar-img');

  if (user) {
    navLogin?.classList.add('hidden');
    navSignup?.classList.add('hidden');
    navAvatar?.classList.remove('hidden');
    aplicarAvatar(navAvatarImg, user);
  }
}

// ── PASSO 3: PREENCHER SIDEBAR ───────────────

function preencherSidebar() {
  document.getElementById('sidebar-nome').textContent  = `${user.firstName} ${user.lastName}`;
  document.getElementById('sidebar-email').textContent = user.email;
  aplicarAvatar(document.getElementById('sidebar-avatar'), user);
}

// ── PASSO 4: DASHBOARD ───────────────────────

function preencherDashboard() {
  const treinos = user.trainings || [];

  // Nome de boas-vindas
  document.getElementById('dash-nome').textContent = user.firstName;

  // Stats
  const totalCal  = treinos.reduce((s, t) => s + (t.calories || 0), 0);
  const totalMin  = treinos.reduce((s, t) => s + (t.duration || 0), 0);
  const totalHoras = (totalMin / 60).toFixed(1);

  document.getElementById('stat-calorias').textContent  = totalCal.toLocaleString('pt-PT') + ' kcal';
  document.getElementById('stat-horas').textContent     = totalHoras + 'h';
  document.getElementById('stat-sessoes').textContent   = treinos.length;
  document.getElementById('stat-modalidades').textContent = (user.enrolledModalities || []).length;

  // Últimos 3 treinos
  const container = document.getElementById('dash-ultimos-treinos');
  const ultimos = [...treinos].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);

  container.innerHTML = ultimos.length
    ? ultimos.map(t => {
        const m = MODALIDADES[t.modality] || {};
        return `<div class="treino-mini-card">
          <i class="fa-solid ${m.icon || 'fa-dumbbell'} treino-icon"></i>
          <div class="treino-info">
            <span class="treino-nome">${m.titulo || t.modality}</span>
            <span class="treino-data">${formatDate(t.date)}</span>
          </div>
          <span class="treino-dur">${t.duration} min</span>
          <span class="treino-kcal">${t.calories} kcal</span>
        </div>`;
      }).join('')
    : '<p style="color:var(--clr-2);opacity:0.5;font-size:0.82rem;">Ainda sem treinos registados.</p>';

  // Modalidades activas
  const badgesEl = document.getElementById('dash-modalidades');
  const enrolled = user.enrolledModalities || [];
  badgesEl.innerHTML = enrolled.length
    ? enrolled.map(key => {
        const m = MODALIDADES[key];
        return `<span class="modalidade-badge">${m?.titulo || key}</span>`;
      }).join('')
    : '<p style="color:var(--clr-2);opacity:0.5;font-size:0.82rem;">Nenhuma modalidade activa.</p>';
}

// ── PASSO 5: TREINOS ─────────────────────────

function preencherTreinos() {
  const container = document.getElementById('treinos-lista');
  const treinos = [...(user.trainings || [])].sort((a,b) => b.date.localeCompare(a.date));

  if (!treinos.length) {
    container.innerHTML = '<p style="color:var(--clr-2);opacity:0.5;font-size:0.82rem;padding:1rem 0;">Ainda sem treinos registados.</p>';
    return;
  }

  container.innerHTML = treinos.map(t => {
    const m = MODALIDADES[t.modality] || {};
    const sourceBadge = t.source === 'smartwatch'
      ? `<span class="source-badge smartwatch"><i class="fa-solid fa-watch"></i> smartwatch</span>`
      : `<span class="source-badge manual"><i class="fa-solid fa-pencil"></i> manual</span>`;

    return `
      <details class="treino-item glass">
        <summary>
          <i class="fa-solid ${m.icon || 'fa-dumbbell'} treino-icon" style="color:var(--clr-4)"></i>
          <div class="treino-info">
            <span class="treino-nome">${m.titulo || t.modality}</span>
            <span class="treino-data">${formatDate(t.date)}</span>
          </div>
          <span class="treino-dur">${t.duration} min</span>
          <span class="treino-kcal">${t.calories} kcal</span>
          ${sourceBadge}
        </summary>
        <div class="treino-details-body">
          <span>📅 Data: ${formatDate(t.date)}</span>
          <span>⏱ Duração: ${t.duration} minutos</span>
          <span>🔥 Calorias: ${t.calories} kcal</span>
          <span>📡 Fonte: ${t.source === 'smartwatch' ? 'Smartwatch (sincronizado)' : 'Inserido manualmente'}</span>
          ${t.notes ? `<span class="notes">💬 "${t.notes}"</span>` : ''}
        </div>
      </details>`;
  }).join('');
}

// ── PASSO 6: MODALIDADES ─────────────────────

function preencherModalidades() {
  const grid     = document.getElementById('modalidades-grid');
  const enrolled = user.enrolledModalities || [];

  grid.innerHTML = Object.entries(MODALIDADES).map(([key, m]) => {
    const inscrito = enrolled.includes(key);
    const status   = inscrito
      ? `<span class="mod-status inscrito">Inscrito</span>`
      : `<span class="mod-status disponivel">Disponível</span>`;

    const acoes = inscrito
      ? `<button class="btn-desactiv" data-key="${key}">
           <i class="fa-solid fa-ban"></i> Pedir Desactivação
         </button>`
      : `<button class="btn-inscr" data-key="${key}">
           <i class="fa-solid fa-plus"></i> Inscrever-me
         </button>`;

    return `
      <div class="modalidade-card">
        <div class="mod-header">
          <span class="mod-titulo">
            <i class="fa-solid ${m.icon}"></i> ${m.titulo}
          </span>
          ${status}
        </div>
        <div class="mod-body">
          <span class="mod-horario"><i class="fa-solid fa-calendar"></i> ${m.dias}</span>
          <span class="mod-horario"><i class="fa-solid fa-clock"></i> ${m.horas}</span>
        </div>
        <div class="mod-actions">
          ${acoes}
        </div>
      </div>`;
  }).join('');

  // Eventos nos botões de inscrição / desactivação
  grid.querySelectorAll('.btn-inscr').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      user.enrolledModalities = [...(user.enrolledModalities || []), key];
      saveUser(user);
      preencherModalidades();
      preencherDashboard(); // Actualiza os badges no dashboard
    });
  });

  grid.querySelectorAll('.btn-desactiv').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (confirm(`Confirmas que queres pedir a desactivação de "${MODALIDADES[key].titulo}"?`)) {
        user.enrolledModalities = (user.enrolledModalities || []).filter(k => k !== key);
        saveUser(user);
        preencherModalidades();
        preencherDashboard();
        alert('Pedido de desactivação registado. A equipa irá processá-lo em 24-48h.');
      }
    });
  });
}

// ── PASSO 7: FORMULÁRIO DE PERFIL ────────────

function preencherFormPerfil() {
  const f = document.getElementById('form-perfil');
  if (!f) return;

  f.firstName.value = user.firstName || '';
  f.lastName.value  = user.lastName  || '';
  f.email.value     = user.email     || '';
  f.phone.value     = user.phone     || '';
  f.age.value       = user.age       || '';
  f.weight.value    = user.weight    || '';
  f.address.value   = user.address   || '';

  aplicarAvatar(document.getElementById('perfil-avatar'), user);

  f.addEventListener('submit', e => {
    e.preventDefault();
    const erro    = document.getElementById('perfil-error');
    const sucesso = document.getElementById('perfil-success');

    // Validação de nova password (se preenchida)
    if (f.newPassword.value && f.newPassword.value.length < 6) {
      erro.textContent = 'A nova password deve ter pelo menos 6 caracteres.';
      erro.classList.remove('hidden');
      sucesso.classList.add('hidden');
      return;
    }

    // Guarda as alterações
    user.firstName = f.firstName.value.trim();
    user.lastName  = f.lastName.value.trim();
    user.email     = f.email.value.trim().toLowerCase();
    user.phone     = f.phone.value.trim();
    user.age       = parseInt(f.age.value) || user.age;
    user.weight    = f.weight.value  ? parseFloat(f.weight.value) : null;
    user.address   = f.address.value ? f.address.value.trim() : null;
    if (f.newPassword.value) user.password = f.newPassword.value;

    saveUser(user);
    preencherSidebar();
    preencherNav();

    erro.classList.add('hidden');
    sucesso.classList.remove('hidden');
    setTimeout(() => sucesso.classList.add('hidden'), 3000);
  });
}

// ── PASSO 8: UPLOAD DE AVATAR ────────────────
// Usa a API FileReader do browser para ler a foto
// e guardá-la como base64 no localStorage.
// Não precisa de servidor!

function bindAvatarUpload(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    // Limita o tamanho a 2MB para não encher o localStorage
    if (file.size > 2 * 1024 * 1024) {
      alert('A foto é demasiado grande. Máximo: 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      user.avatar = ev.target.result; // base64
      saveUser(user);
      // Actualiza todos os locais onde o avatar aparece
      aplicarAvatar(document.getElementById('sidebar-avatar'), user);
      aplicarAvatar(document.getElementById('perfil-avatar'), user);
      aplicarAvatar(document.getElementById('nav-avatar-img'), user);
    };
    reader.readAsDataURL(file);
  });
}

// ── PASSO 9: ADICIONAR TREINO MANUAL ─────────

function bindAddTreino() {
  const form = document.getElementById('form-add-treino');
  if (!form) return;

  // Define a data de hoje como valor por defeito
  form.date.value = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', e => {
    e.preventDefault();
    const novoTreino = {
      id:       't' + Date.now(),
      date:     form.date.value,
      modality: form.modality.value,
      duration: parseInt(form.duration.value),
      calories: parseInt(form.calories.value),
      source:   'manual',
      notes:    form.notes.value.trim()
    };

    user.trainings = [novoTreino, ...(user.trainings || [])];
    saveUser(user);

    // Actualiza a lista e o dashboard
    preencherTreinos();
    preencherDashboard();

    // Fecha o <details> e reseta o form
    form.closest('details').removeAttribute('open');
    form.reset();
    form.date.value = new Date().toISOString().split('T')[0];
  });
}

// ── PASSO 10: SINCRONIZAR (simula smartwatch) ─

document.getElementById('btn-sync')?.addEventListener('click', () => {
  const btn = document.getElementById('btn-sync');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> A sincronizar...';

  // Simula um delay de sincronização
  setTimeout(() => {
    // Adiciona um treino simulado "agora"
    const random = ['musculacao','cardio','natacao'][Math.floor(Math.random()*3)];
    const novoTreino = {
      id:       't' + Date.now(),
      date:     new Date().toISOString().split('T')[0],
      modality: random,
      duration: 30 + Math.floor(Math.random() * 45),
      calories: 200 + Math.floor(Math.random() * 300),
      source:   'smartwatch',
      notes:    ''
    };
    user.trainings = [novoTreino, ...(user.trainings || [])];
    saveUser(user);

    const agora = new Date();
    document.getElementById('sync-time').textContent =
      `Hoje, ${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`;

    preencherTreinos();
    preencherDashboard();

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sincronizar';
  }, 1800);
});

// ── LOGOUT ───────────────────────────────────

document.getElementById('btn-logout')?.addEventListener('click', () => {
  if (confirm('Tens a certeza que queres sair?')) {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '../index.html';
  }
});

// ── ELIMINAR CONTA ───────────────────────────

document.getElementById('btn-delete-account')?.addEventListener('click', () => {
  if (confirm('⚠️ Tens a certeza? Esta acção é IRREVERSÍVEL. Todos os teus dados serão eliminados.')) {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '../index.html';
  }
});

// ── REMOVER FOTO ─────────────────────────────

document.getElementById('btn-remove-avatar')?.addEventListener('click', () => {
  user.avatar = null;
  saveUser(user);
  aplicarAvatar(document.getElementById('sidebar-avatar'), user);
  aplicarAvatar(document.getElementById('perfil-avatar'), user);
  aplicarAvatar(document.getElementById('nav-avatar-img'), user);
});

// ── INICIALIZAÇÃO — corre tudo ───────────────

preencherNav();
preencherSidebar();
preencherDashboard();
preencherTreinos();
preencherModalidades();
preencherFormPerfil();
bindAvatarUpload('avatar-upload');
bindAvatarUpload('avatar-upload-perfil');
bindAddTreino();