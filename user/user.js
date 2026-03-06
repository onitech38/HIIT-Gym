/* ============================================
   HIIT-GYM — USER.JS

   1. Verifica autenticação
   2. Preenche a página com dados do user
   3. Upload de avatar, edição de perfil
   4. Treinos: adicionar, sincronizar
   5. Modalidades: inscrever / desactivar
   6. QR Code de acesso
   7. Logout / eliminar conta
   ============================================ */

const AUTH_KEY = 'hiitgym_user';

const MODALIDADES = {
  musculacao:   { titulo: 'Musculação',             icon: 'fa-dumbbell',        dias: 'Todos os dias',      horas: '06h00 – 22h00' },
  cardio:       { titulo: 'Cardio',                 icon: 'fa-heart-pulse',     dias: 'Todos os dias',      horas: '07h00 – 21h00' },
  yoga_pilates: { titulo: 'Yoga & Pilates',         icon: 'fa-spa',             dias: '2ª, 4ª e 6ª feira',  horas: '17h00 – 19h30' },
  lutas:        { titulo: 'Lutas e Artes Marciais', icon: 'fa-shield-halved',   dias: '2ª feira a sábado',  horas: '19h00 – 20h30' },
  zumba_danca:  { titulo: 'Zumba e Danças',         icon: 'fa-music',           dias: '3ª e 5ª feira',      horas: '20h00 – 21h30' },
  natacao:      { titulo: 'Natação',                icon: 'fa-person-swimming', dias: '2ª, 4ª e 6ª feira',  horas: '08h00 – 20h00' },
};

// ── HELPERS ──────────────────────────────────
const getUser     = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } };
const saveUser    = u  => localStorage.setItem(AUTH_KEY, JSON.stringify(u));
const getIniciais = u  => ((u.firstName?.[0]||'') + (u.lastName?.[0]||'')).toUpperCase();

function formatDate(iso) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const d = new Date(iso + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

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
const user = getUser();
if (!user) window.location.href = '../index.html';

// ── PASSO 2: NAV ─────────────────────────────
function preencherNav() {
  document.getElementById('nav-login')?.classList.add('hidden');
  document.getElementById('nav-signup')?.classList.add('hidden');
  const navAvatar = document.getElementById('nav-avatar');
  const navAvatarImg = document.getElementById('nav-avatar-img');
  navAvatar?.classList.remove('hidden');
  aplicarAvatar(navAvatarImg, user);
}

// ── PASSO 3: SIDEBAR ─────────────────────────
function preencherSidebar() {
  document.getElementById('sidebar-nome').textContent  = `${user.firstName} ${user.lastName}`;
  document.getElementById('sidebar-email').textContent = user.email;
  aplicarAvatar(document.getElementById('sidebar-avatar'), user);
}

// ── PASSO 4: DASHBOARD ───────────────────────
function preencherDashboard() {
  const treinos = user.trainings || [];
  document.getElementById('dash-nome').textContent = user.firstName;

  const totalCal   = treinos.reduce((s, t) => s + (t.calories || 0), 0);
  const totalMin   = treinos.reduce((s, t) => s + (t.duration || 0), 0);
  const totalHoras = (totalMin / 60).toFixed(1);

  document.getElementById('stat-calorias').textContent  = totalCal.toLocaleString('pt-PT');
  document.getElementById('stat-horas').textContent     = totalHoras + 'h';
  document.getElementById('stat-sessoes').textContent   = treinos.length;
  document.getElementById('stat-modalidades').textContent = (user.enrolledModalities || []).length;

  // Últimos 3 treinos
  const listaEl = document.getElementById('dash-ultimos-treinos');
  const ultimos = treinos.slice(0, 3);
  listaEl.innerHTML = ultimos.length === 0
    ? `<p style="font-size:.8rem;color:var(--clr-2);opacity:.6;">Ainda não tens treinos registados.</p>`
    : ultimos.map(t => {
        const m = MODALIDADES[t.modality] || { titulo: t.modality, icon: 'fa-dumbbell' };
        return `
          <div class="treino-mini-card">
            <i class="fa-solid ${m.icon} treino-icon"></i>
            <div class="treino-info">
              <span class="treino-nome">${m.titulo}</span>
              <span class="treino-data">${formatDate(t.date)}</span>
            </div>
            <span class="treino-dur">${t.duration} min</span>
            <span class="treino-kcal">${t.calories} kcal</span>
          </div>`;
      }).join('');

  // Badges de modalidades
  const badgesEl = document.getElementById('dash-modalidades');
  const enrolled = user.enrolledModalities || [];
  badgesEl.innerHTML = enrolled.length === 0
    ? `<p style="font-size:.8rem;color:var(--clr-2);opacity:.6;">Nenhuma modalidade inscrita.</p>`
    : enrolled.map(k => {
        const m = MODALIDADES[k];
        return m ? `<span class="modalidade-badge"><i class="fa-solid ${m.icon}"></i> ${m.titulo}</span>` : '';
      }).join('');
}

// ── PASSO 5: TREINOS ─────────────────────────
function preencherTreinos() {
  const lista = document.getElementById('treinos-lista');
  if (!lista) return;
  const treinos = user.trainings || [];

  if (treinos.length === 0) {
    lista.innerHTML = `<p style="font-size:.8rem;color:var(--clr-2);opacity:.6;padding:1rem 0;">Ainda não tens treinos registados.</p>`;
    return;
  }

  lista.innerHTML = treinos.map(t => {
    const m = MODALIDADES[t.modality] || { titulo: t.modality, icon: 'fa-dumbbell' };
    const sourceBadge = t.source === 'smartwatch'
      ? `<span class="source-badge smartwatch"><i class="fa-solid fa-watch"></i> smartwatch</span>`
      : `<span class="source-badge manual"><i class="fa-solid fa-pencil"></i> manual</span>`;

    return `
      <details class="treino-item glass">
        <summary>
          <i class="fa-solid ${m.icon} treino-icon" style="color:var(--clr-4)"></i>
          <div class="treino-info">
            <span class="treino-nome">${m.titulo}</span>
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
  if (!grid) return;
  const enrolled = user.enrolledModalities || [];

  grid.innerHTML = Object.entries(MODALIDADES).map(([key, m]) => {
    const inscrito = enrolled.includes(key);
    const status   = inscrito
      ? `<span class="mod-status inscrito">Inscrito</span>`
      : `<span class="mod-status disponivel">Disponível</span>`;
    const acoes = inscrito
      ? `<button class="btn-desactiv" data-key="${key}"><i class="fa-solid fa-ban"></i> Pedir Desactivação</button>`
      : `<button class="btn-inscr" data-key="${key}"><i class="fa-solid fa-plus"></i> Inscrever-me</button>`;

    return `
      <div class="modalidade-card">
        <div class="mod-header">
          <span class="mod-titulo"><i class="fa-solid ${m.icon}"></i> ${m.titulo}</span>
          ${status}
        </div>
        <div class="mod-body">
          <span class="mod-horario"><i class="fa-solid fa-calendar"></i> ${m.dias}</span>
          <span class="mod-horario"><i class="fa-solid fa-clock"></i> ${m.horas}</span>
        </div>
        <div class="mod-actions">${acoes}</div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.btn-inscr').forEach(btn => {
    btn.addEventListener('click', () => {
      user.enrolledModalities = [...(user.enrolledModalities || []), btn.dataset.key];
      saveUser(user);
      preencherModalidades();
      preencherDashboard();
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

// ── PASSO 7: PERFIL ───────────────────────────
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

    if (f.newPassword.value && f.newPassword.value.length < 6) {
      erro.textContent = 'A nova password deve ter pelo menos 6 caracteres.';
      erro.classList.remove('hidden');
      sucesso.classList.add('hidden');
      return;
    }

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

// ── PASSO 8: AVATAR UPLOAD ───────────────────
function bindAvatarUpload(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('A foto é demasiado grande. Máximo: 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      user.avatar = ev.target.result;
      saveUser(user);
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
    preencherTreinos();
    preencherDashboard();
    form.closest('details').removeAttribute('open');
    form.reset();
    form.date.value = new Date().toISOString().split('T')[0];
  });
}

// ── PASSO 10: SINCRONIZAR ────────────────────
document.getElementById('btn-sync')?.addEventListener('click', () => {
  const btn = document.getElementById('btn-sync');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> A sincronizar...';

  setTimeout(() => {
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

// ── PASSO 11: QR CODE ────────────────────────
//
// O número de membro é DETERMINÍSTICO:
// o mesmo email gera sempre o mesmo número.
// Assim o QR mantém-se consistente entre sessões.
//

function gerarNumeroMembro(email) {
  let hash = 0;
  for (const c of email) {
    hash = ((hash << 5) - hash) + c.charCodeAt(0);
    hash |= 0; // converte para inteiro de 32 bits
  }
  const ano = new Date().getFullYear();
  const num = String(Math.abs(hash) % 100000).padStart(5, '0');
  return `HG${ano}-${num}`; // ex: HG2026-42857
}

function preencherQR() {
  const memberNum = gerarNumeroMembro(user.email);
  const primeiroNome = (user.firstName || '').toUpperCase();
  const ultimoNome   = (user.lastName  || '').toUpperCase();

  // Dados codificados no QR
  const qrData = `HIITGYM|${memberNum}|${primeiroNome}|${ultimoNome}`;
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200`
               + `&data=${encodeURIComponent(qrData)}`
               + `&bgcolor=120D0F&color=fba002&format=svg&margin=10`;

  // Preenche o card (tab QR)
  const qrImg     = document.getElementById('qr-img');
  const qrLoading = document.getElementById('qr-loading');

  document.getElementById('qr-member-number').textContent = memberNum;
  document.getElementById('qr-first-name').textContent    = primeiroNome;
  document.getElementById('qr-last-name').textContent     = ultimoNome;

  if (qrImg) {
    qrImg.src = qrUrl;
    qrImg.onload = () => {
      qrImg.classList.remove('hidden');
      qrLoading?.classList.add('hidden');
    };
    qrImg.onerror = () => {
      if (qrLoading) {
        qrLoading.innerHTML = '<i class="fa-solid fa-wifi-exclamation"></i> Sem ligação para gerar QR';
      }
    };
  }

  // Preenche o overlay
  const overlayImg    = document.getElementById('qr-overlay-img');
  const overlayMember = document.getElementById('qr-overlay-member');
  const overlayNome   = document.getElementById('qr-overlay-nome');

  if (overlayImg)    overlayImg.src = qrUrl;
  if (overlayMember) overlayMember.textContent = memberNum;
  if (overlayNome)   overlayNome.textContent = `${primeiroNome} ${ultimoNome}`;
}

// Abrir overlay ao clicar no card QR
document.getElementById('qr-card-btn')?.addEventListener('click', () => {
  document.getElementById('qr-overlay')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
});

document.getElementById('qr-card-btn')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    document.getElementById('qr-overlay')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
});

function fecharQrOverlay() {
  document.getElementById('qr-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('qr-overlay-fechar')?.addEventListener('click', fecharQrOverlay);
document.getElementById('qr-overlay-backdrop')?.addEventListener('click', fecharQrOverlay);
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharQrOverlay(); });


// ── LOGOUT ────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', () => {
  if (confirm('Tens a certeza que queres sair?')) {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '../index.html';
  }
});

// ── ELIMINAR CONTA ────────────────────────────
document.getElementById('btn-delete-account')?.addEventListener('click', () => {
  if (confirm('⚠️ Tens a certeza? Esta acção é IRREVERSÍVEL. Todos os teus dados serão eliminados.')) {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '../index.html';
  }
});

// ── REMOVER FOTO ──────────────────────────────
document.getElementById('btn-remove-avatar')?.addEventListener('click', () => {
  user.avatar = null;
  saveUser(user);
  aplicarAvatar(document.getElementById('sidebar-avatar'), user);
  aplicarAvatar(document.getElementById('perfil-avatar'), user);
  aplicarAvatar(document.getElementById('nav-avatar-img'), user);
});


// ── INIT ──────────────────────────────────────
preencherNav();
preencherSidebar();
preencherDashboard();
preencherTreinos();
preencherModalidades();
preencherFormPerfil();
preencherQR();
bindAvatarUpload('avatar-upload');
bindAvatarUpload('avatar-upload-perfil');
bindAddTreino();