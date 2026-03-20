//============================================
//   HIIT-GYM — USER.JS  (Supabase)
//
//   Depende de:
//   • supabase.js   → window.supabaseClient
//   • global.js     → window.currentUser, actualizarNav(), ini()
//   • app:ready     → evento emitido pelo global.js após auth
//
//   1. Verifica autenticação via Supabase
//   2. Preenche a página com dados do perfil
//   3. Upload de avatar (Supabase Storage)
//   4. Treinos: adicionar, sincronizar (Supabase)
//   5. Modalidades: inscrever / desactivar (Supabase)
//   6. QR Code de acesso
//   7. Logout / eliminar conta
//============================================

// Alias defensivo — funciona com supabase.js novo (window.supabaseClient)
// e com o antigo (window.supabase sobrescrito com o cliente)
const supabase = window.supabaseClient || window.supabase;

const MODALIDADES = {
  musculacao:   { titulo: 'Musculação',             icon: 'fa-dumbbell',        dias: 'Todos os dias',      horas: '06h00 – 22h00' },
  cardio:       { titulo: 'Cardio',                 icon: 'fa-heart-pulse',     dias: 'Todos os dias',      horas: '07h00 – 21h00' },
  yoga_pilates: { titulo: 'Yoga & Pilates',         icon: 'fa-spa',             dias: '2ª, 4ª e 6ª feira',  horas: '17h00 – 19h30' },
  lutas:        { titulo: 'Lutas e Artes Marciais', icon: 'fa-shield-halved',   dias: '2ª feira a sábado',  horas: '19h00 – 20h30' },
  zumba_danca:  { titulo: 'Zumba e Danças',         icon: 'fa-music',           dias: '3ª e 5ª feira',      horas: '20h00 – 21h30' },
  natacao:      { titulo: 'Natação',                icon: 'fa-person-swimming', dias: '2ª, 4ª e 6ª feira',  horas: '08h00 – 20h00' },
};


// ── HELPERS ──────────────────────────────────

// ini() vem do global.js
const getIniciais = p => ini(`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || '?');

function formatDate(iso) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const d = new Date(iso + (iso.includes('T') ? '' : 'T12:00:00'));
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function aplicarAvatar(el, profile) {
  if (!el) return;
  if (profile.avatar_url) {
    el.style.backgroundImage = `url('${profile.avatar_url}')`;
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = getIniciais(profile);
  }
}


// Estado global — preenchido após auth check
let currentUser        = null;
let currentProfile     = null;
let currentTrainings   = [];
let currentEnrollments = [];


// ============================================
// INIT — aguarda app:ready do global.js
// ============================================
document.addEventListener('app:ready', async () => {

  // Verificar sessão — window.currentUser preenchido pelo global.js
  if (!window.currentUser) {
    window.location.href = '/index.html';
    return;
  }
  currentUser = window.currentUser;

  // 2–4. Carregar dados do Supabase
  // try/catch garante que a página NUNCA fica preta mesmo que o Supabase falhe
  try {
    // 2. Perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (!profile) {
      const meta = currentUser.user_metadata || {};
      const { data: novo } = await supabase.from('profiles').insert({
        id:         currentUser.id,
        first_name: meta.firstName || 'Utilizador',
        last_name:  meta.lastName  || '',
        phone:      meta.phone     || null,
        age:        meta.age       || null,
        weight:     meta.weight    || null,
        address:    meta.address   || null,
      }).select().single();
      currentProfile = novo || { id: currentUser.id, first_name: 'Utilizador', last_name: '', email: currentUser.email };
    } else {
      currentProfile = profile;
    }
    currentProfile.email = currentUser.email;

    // 3. Treinos
    const { data: treinos } = await supabase
      .from('trainings')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });
    currentTrainings = treinos || [];

    // 4. Inscrições
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', currentUser.id);
    currentEnrollments = enrollments || [];

  } catch (err) {
    // Supabase indisponível ou erro de rede — mostra a página com dados vazios
    console.warn('[user.js] Erro ao carregar dados:', err);
    currentProfile = currentProfile || {
      id: currentUser.id,
      first_name: currentUser.email?.split('@')[0] || 'Utilizador',
      last_name: '',
      email: currentUser.email,
    };
  }

  // 5. Mostrar o body — SEMPRE chega aqui, com ou sem dados
  document.body.classList.remove('loading');

  // 6. Preencher UI
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

});


// ── NAV ──────────────────────────────────────
function preencherNav() {
  actualizarNav(); // global.js
}


// ── SIDEBAR ───────────────────────────────────
function preencherSidebar() {
  const p = currentProfile;
  document.getElementById('sidebar-nome').textContent  = `${p.first_name} ${p.last_name}`;
  document.getElementById('sidebar-email').textContent = p.email;
  aplicarAvatar(document.getElementById('sidebar-avatar'), p);
}


// ── DASHBOARD ─────────────────────────────────
function preencherDashboard() {
  const p       = currentProfile;
  const treinos = currentTrainings;

  document.getElementById('dash-nome').textContent = p.first_name;

  const totalCal   = treinos.reduce((s, t) => s + (t.calories || 0), 0);
  const totalMin   = treinos.reduce((s, t) => s + (t.duration || 0), 0);
  const totalHoras = (totalMin / 60).toFixed(1);

  document.getElementById('stat-calorias').textContent    = totalCal.toLocaleString('pt-PT');
  document.getElementById('stat-horas').textContent       = totalHoras + 'h';
  document.getElementById('stat-sessoes').textContent     = treinos.length;
  document.getElementById('stat-modalidades').textContent = currentEnrollments.filter(e => ['active','pending'].includes(e.status)).length;

  // Últimos 3 treinos
  const listaEl = document.getElementById('dash-ultimos-treinos');
  const ultimos  = treinos.slice(0, 3);
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
  const enrolled = currentEnrollments.filter(e => e.status === 'active').map(e => e.modality);
  badgesEl.innerHTML = enrolled.length === 0
    ? `<p style="font-size:.8rem;color:var(--clr-2);opacity:.6;">Nenhuma modalidade inscrita.</p>`
    : enrolled.map(k => {
        const m = MODALIDADES[k];
        return m ? `<span class="modalidade-badge"><i class="fa-solid ${m.icon}"></i> ${m.titulo}</span>` : '';
      }).join('');
}


// ── TREINOS ───────────────────────────────────
function preencherTreinos() {
  const lista = document.getElementById('treinos-lista');
  if (!lista) return;
  const treinos = currentTrainings;

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
          ${t.bpm   ? `<span class="treino-bpm"><i class="fa-solid fa-heart-pulse"></i> Ritmo cardíaco: <strong>${t.bpm} bpm</strong></span>` : ''}
        </div>
      </details>`;
  }).join('');
}


// ── MODALIDADES ───────────────────────────────
function preencherModalidades() {
  const grid = document.getElementById('modalidades-grid');
  if (!grid) return;
  // Mostra inscritos (active) e pendentes
  const enrolledMap = {};
  currentEnrollments.forEach(e => {
    if (e.status === 'active' || e.status === 'pending') {
      enrolledMap[e.modality] = e.status;
    }
  });

  grid.innerHTML = Object.entries(MODALIDADES).map(([key, m]) => {
    const estado = enrolledMap[key];
    const statusHtml = estado === 'active'
      ? `<span class="mod-status inscrito">Inscrito</span>`
      : estado === 'pending'
      ? `<span class="mod-status pendente">Pendente</span>`
      : `<span class="mod-status disponivel">Disponível</span>`;
    const acoes = estado === 'active'
      ? `<button class="btn-desactiv" data-key="${key}"><i class="fa-solid fa-ban"></i> Pedir Desactivação</button>`
      : estado === 'pending'
      ? `<button class="btn-desactiv" data-key="${key}" disabled>A aguardar confirmação</button>`
      : `<button class="btn-inscr" data-key="${key}"><i class="fa-solid fa-plus"></i> Inscrever-me</button>`;

    return `
      <div class="modalidade-card">
        <div class="mod-header">
          <span class="mod-titulo"><i class="fa-solid ${m.icon}"></i> ${m.titulo}</span>
          ${statusHtml}
        </div>
        <div class="mod-body">
          <span class="mod-horario"><i class="fa-solid fa-calendar"></i> ${m.dias}</span>
          <span class="mod-horario"><i class="fa-solid fa-clock"></i> ${m.horas}</span>
        </div>
        <div class="mod-actions">${acoes}</div>
      </div>`;
  }).join('');

  // Inscrever
  grid.querySelectorAll('.btn-inscr').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      const { data, error } = await supabase.from('enrollments').insert({
        user_id:      currentUser.id,
        modality: btn.dataset.key,
        status:   'pending',
      }).select().single();
      if (!error && data) {
        currentEnrollments.push(data);
        preencherModalidades();
        preencherDashboard();
      } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Inscrever-me';
        alert('Erro ao inscrever. Tenta novamente.');
      }
    });
  });

  // Desactivar
  grid.querySelectorAll('.btn-desactiv').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      if (!confirm(`Confirmas que queres pedir a desactivação de "${MODALIDADES[key].titulo}"?`)) return;
      btn.disabled = true;
      const enrollment = currentEnrollments.find(e => e.modality === key && e.status === 'active');
      if (enrollment) {
        await supabase.from('enrollments').update({ status: 'cancelled' }).eq('id', enrollment.id);
        enrollment.status = 'cancelled';
        preencherModalidades();
        preencherDashboard();
        alert('Pedido de desactivação registado. A equipa irá processá-lo em 24-48h.');
      }
    });
  });
}


// ── PERFIL ────────────────────────────────────
function preencherFormPerfil() {
  const f = document.getElementById('form-perfil');
  if (!f) return;
  const p = currentProfile;

  f.firstName.value = p.first_name || '';
  f.lastName.value  = p.last_name  || '';
  f.email.value     = p.email      || '';
  f.phone.value     = p.phone      || '';
  f.age.value       = p.age        || '';
  f.weight.value    = p.weight     || '';
  f.address.value   = p.address    || '';

  aplicarAvatar(document.getElementById('perfil-avatar'), p);

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const btn     = f.querySelector('button[type="submit"]');
    const erro    = document.getElementById('perfil-error');
    const sucesso = document.getElementById('perfil-success');

    if (f.newPassword?.value && f.newPassword.value.length < 6) {
      erro.textContent = 'A nova password deve ter pelo menos 6 caracteres.';
      erro.classList.remove('hidden');
      sucesso.classList.add('hidden');
      return;
    }

    btn.disabled = true;

    const updates = {
      first_name: f.firstName.value.trim(),
      last_name:  f.lastName.value.trim(),
      phone:      f.phone.value.trim() || null,
      age:        parseInt(f.age.value) || null,
      weight:     f.weight.value ? parseFloat(f.weight.value) : null,
      address:    f.address.value.trim() || null,
    };

    const { error: erroPerfil } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (f.newPassword?.value) {
      await supabase.auth.updateUser({ password: f.newPassword.value });
    }

    btn.disabled = false;

    if (erroPerfil) {
      erro.textContent = 'Erro ao guardar. Tenta novamente.';
      erro.classList.remove('hidden');
      sucesso.classList.add('hidden');
    } else {
      Object.assign(currentProfile, updates);
      preencherSidebar();
      preencherNav();
      erro.classList.add('hidden');
      sucesso.classList.remove('hidden');
      setTimeout(() => sucesso.classList.add('hidden'), 3000);
    }
  });
}


// ── AVATAR UPLOAD ─────────────────────────────
function bindAvatarUpload(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('A foto é demasiado grande. Máximo: 2MB.'); return; }

    const ext      = file.name.split('.').pop();
    const filePath = `avatars/${currentUser.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      // Fallback: guarda como base64 no perfil se o bucket não existir
      const reader = new FileReader();
      reader.onload = async ev => {
        const url = ev.target.result;
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', currentUser.id);
        currentProfile.avatar_url = url;
        aplicarAvatar(document.getElementById('sidebar-avatar'), currentProfile);
        aplicarAvatar(document.getElementById('perfil-avatar'), currentProfile);
        aplicarAvatar(document.getElementById('nav-avatar-img'), currentProfile);
      };
      reader.readAsDataURL(file);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
    currentProfile.avatar_url = publicUrl;

    aplicarAvatar(document.getElementById('sidebar-avatar'), currentProfile);
    aplicarAvatar(document.getElementById('perfil-avatar'), currentProfile);
    aplicarAvatar(document.getElementById('nav-avatar-img'), currentProfile);
  });
}


// ── ADICIONAR TREINO MANUAL ───────────────────
function bindAddTreino() {
  const form = document.getElementById('form-add-treino');
  if (!form) return;
  form.date.value = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const novoTreino = {
      user_id:  currentUser.id,
      date:     form.date.value,
      modality: form.modality.value,
      duration: parseInt(form.duration.value),
      calories: parseInt(form.calories.value),
      source:   'manual',
      notes:    form.notes?.value.trim() || '',
    };

    const { data, error } = await supabase
      .from('trainings')
      .insert(novoTreino)
      .select()
      .single();

    btn.disabled = false;

    if (!error && data) {
      currentTrainings.unshift(data);
      preencherTreinos();
      preencherDashboard();
      form.closest('details')?.removeAttribute('open');
      form.reset();
      form.date.value = new Date().toISOString().split('T')[0];
    } else {
      alert('Erro ao guardar treino. Tenta novamente.');
    }
  });
}


// ── SINCRONIZAR SMARTWATCH (simulado) ─────────
document.getElementById('btn-sync')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-sync');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> A sincronizar...';

  await new Promise(r => setTimeout(r, 1800));

  const random = ['musculacao','cardio','natacao'][Math.floor(Math.random() * 3)];
  const novoTreino = {
    user_id:  currentUser.id,
    date:     new Date().toISOString().split('T')[0],
    modality: random,
    duration: 30 + Math.floor(Math.random() * 45),
    calories: 200 + Math.floor(Math.random() * 300),
    source:   'smartwatch',
    notes:    '',
  };

  const { data, error } = await supabase.from('trainings').insert(novoTreino).select().single();
  if (!error && data) {
    currentTrainings.unshift(data);
    const agora = new Date();
    document.getElementById('sync-time').textContent =
      `Hoje, ${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`;
    preencherTreinos();
    preencherDashboard();
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sincronizar';
});


// ── QR CODE ───────────────────────────────────
function gerarNumeroMembro(email) {
  let hash = 0;
  for (const c of email) { hash = ((hash << 5) - hash) + c.charCodeAt(0); hash |= 0; }
  const num = String(Math.abs(hash) % 100000).padStart(5, '0');
  return `HG${new Date().getFullYear()}-${num}`;
}

function preencherQR() {
  const memberNum    = gerarNumeroMembro(currentProfile.email);
  const primeiroNome = (currentProfile.first_name || '').toUpperCase();
  const ultimoNome   = (currentProfile.last_name  || '').toUpperCase();
  const qrData = `HIITGYM|${memberNum}|${primeiroNome}|${ultimoNome}`;
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200`
               + `&data=${encodeURIComponent(qrData)}&bgcolor=120D0F&color=fba002&format=svg&margin=10`;

  const qrMemberEl = document.getElementById('qr-member-number');
  const qrFnameEl  = document.getElementById('qr-first-name');
  const qrLnameEl  = document.getElementById('qr-last-name');
  if (qrMemberEl) qrMemberEl.textContent = memberNum;
  if (qrFnameEl)  qrFnameEl.textContent  = primeiroNome;
  if (qrLnameEl)  qrLnameEl.textContent  = ultimoNome;

  const qrImg     = document.getElementById('qr-img');
  const qrLoading = document.getElementById('qr-loading');
  if (qrImg) {
    qrImg.src = qrUrl;
    qrImg.onload  = () => { qrImg.classList.remove('hidden'); qrLoading?.classList.add('hidden'); };
    qrImg.onerror = () => { if (qrLoading) qrLoading.innerHTML = '<i class="fa-solid fa-wifi-exclamation"></i> Sem ligação'; };
  }

  const overlayImg    = document.getElementById('qr-overlay-img');
  const overlayMember = document.getElementById('qr-overlay-member');
  const overlayNome   = document.getElementById('qr-overlay-nome');
  if (overlayImg)    overlayImg.src = qrUrl;
  if (overlayMember) overlayMember.textContent = memberNum;
  if (overlayNome)   overlayNome.textContent = `${primeiroNome} ${ultimoNome}`;
}

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


// ── REMOVER FOTO ──────────────────────────────
document.getElementById('btn-remove-avatar')?.addEventListener('click', async () => {
  await supabase.from('profiles').update({ avatar_url: null }).eq('id', currentUser.id);
  currentProfile.avatar_url = null;
  aplicarAvatar(document.getElementById('sidebar-avatar'), currentProfile);
  aplicarAvatar(document.getElementById('perfil-avatar'), currentProfile);
  aplicarAvatar(document.getElementById('nav-avatar-img'), currentProfile);
});


// ── LOGOUT ────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  if (confirm('Tens a certeza que queres sair?')) {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
  }
});


// ── ELIMINAR CONTA ────────────────────────────
document.getElementById('btn-delete-account')?.addEventListener('click', async () => {
  if (confirm('⚠️ Tens a certeza? Esta acção é IRREVERSÍVEL. Todos os teus dados serão eliminados.')) {
    await supabase.from('profiles').delete().eq('id', currentUser.id);
    await supabase.auth.signOut();
    window.location.href = '/index.html';
  }
});


// ============================================
// BFCACHE — forçar reload do perfil em mobile
// ============================================
window.addEventListener('pageshow', async (e) => {
  if (!e.persisted) return;

  try {
    const { data: { session } } =
      await supabase.auth.getSession();
    if (!session?.user) {
      window.location.href = '/index.html';
      return;
    }
    // Actualiza dados e re-renderiza
    currentUser = session.user;
    const { data: profile } = await supabase
      .from('profiles').select('*')
      .eq('id', currentUser.id).single();
    if (profile) {
      currentProfile = profile;
      currentProfile.email = currentUser.email;
    }
    const { data: treinos } = await supabase
      .from('trainings').select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });
    currentTrainings = treinos || [];

    const { data: enrollments } = await supabase
      .from('enrollments').select('*')
      .eq('user_id', currentUser.id);
    currentEnrollments = enrollments || [];

    document.body.classList.remove('loading');
    preencherSidebar();
    preencherDashboard();
    preencherTreinos();
    preencherModalidades();
    preencherFormPerfil();
    preencherQR();
    actualizarNav();
  } catch (err) {
    console.warn('[user] pageshow error:', err);
  }
});
