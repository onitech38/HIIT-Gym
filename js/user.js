//============================================
//   HIIT-GYM — USER.JS  (Supabase)
//============================================

const supabase = window.supabaseClient;

// ── MODALIDADES ──────────────────────────────
const MODALIDADES = {
  musculacao:   { titulo: 'Musculação', icon: 'fa-dumbbell', dias: 'Todos os dias', horas: '06h00 – 22h00' },
  cardio:       { titulo: 'Cardio', icon: 'fa-heart-pulse', dias: 'Todos os dias', horas: '07h00 – 21h00' },
  yoga_pilates: { titulo: 'Yoga & Pilates', icon: 'fa-spa', dias: '2ª, 4ª e 6ª feira', horas: '17h00 – 19h30' },
  lutas:        { titulo: 'Lutas e Artes Marciais', icon: 'fa-shield-halved', dias: '2ª feira a sábado', horas: '19h00 – 20h30' },
  zumba_danca:  { titulo: 'Zumba e Danças', icon: 'fa-music', dias: '3ª e 5ª feira', horas: '20h00 – 21h30' },
  natacao:      { titulo: 'Natação', icon: 'fa-person-swimming', dias: '2ª, 4ª e 6ª feira', horas: '08h00 – 20h00' },
};

// ── HELPERS ──────────────────────────────────
const getIniciais = p =>
  ini(`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || '?');

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

// ── ESTADO GLOBAL ─────────────────────────────
let currentUser        = null;
let currentProfile     = null;
let currentTrainings   = [];
let currentEnrollments = [];

//============================================
// INIT — ÚNICA FONTE DE VERDADE
//============================================
async function init() {
  const user = window.currentUser;

  if (!user) {
    window.location.href = '../index.html?auth=login';
    return;
  }

  currentUser = user;

  // ── PERFIL ─────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const meta = user.user_metadata || {};
    const { data: novo } = await supabase.from('profiles').insert({
      id: user.id,
      first_name: meta.firstName || 'Utilizador',
      last_name: meta.lastName || '',
      phone: meta.phone || null,
      age: meta.age || null,
      weight: meta.weight || null,
      address: meta.address || null,
    }).select().single();
    currentProfile = novo;
  } else {
    currentProfile = profile;
  }

  currentProfile.email = user.email;

  // ── TREINOS ────────────────────────────────
  const { data: treinos } = await supabase
    .from('trainings')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  currentTrainings = treinos || [];

  // ── INSCRIÇÕES ─────────────────────────────
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id);

  currentEnrollments = enrollments || [];

  // ── MOSTRAR UI ─────────────────────────────
  document.body.classList.remove('loading');

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
}

// ── NAV ──────────────────────────────────────
function preencherNav() {
  actualizarNav();
}

// ── SIDEBAR ───────────────────────────────────
function preencherSidebar() {
  const p = currentProfile;
  document.getElementById('sidebar-nome').textContent = `${p.first_name} ${p.last_name}`;
  document.getElementById('sidebar-email').textContent = p.email;
  aplicarAvatar(document.getElementById('sidebar-avatar'), p);
}

// ── DASHBOARD ─────────────────────────────────
function preencherDashboard() {
  const treinos = currentTrainings;

  document.getElementById('dash-nome').textContent = currentProfile.first_name;

  const totalCal = treinos.reduce((s, t) => s + (t.calories || 0), 0);
  const totalMin = treinos.reduce((s, t) => s + (t.duration || 0), 0);

  document.getElementById('stat-calorias').textContent = totalCal.toLocaleString('pt-PT');
  document.getElementById('stat-horas').textContent = (totalMin / 60).toFixed(1) + 'h';
  document.getElementById('stat-sessoes').textContent = treinos.length;
  document.getElementById('stat-modalidades').textContent =
    currentEnrollments.filter(e => e.status === 'active').length;
}

// ── TREINOS ───────────────────────────────────
function preencherTreinos() {
  const lista = document.getElementById('treinos-lista');
  if (!lista) return;

  if (!currentTrainings.length) {
    lista.innerHTML = '<p style="opacity:.6">Ainda não tens treinos.</p>';
    return;
  }

  lista.innerHTML = currentTrainings.map(t => {
    const m = MODALIDADES[t.modality] || {};
    return `
      <details class="treino-item glass">
        <summary>
          <i class="fa-solid ${m.icon || 'fa-dumbbell'}"></i>
          <strong>${m.titulo || t.modality}</strong>
          <span>${formatDate(t.date)}</span>
          <span>${t.duration} min</span>
          <span>${t.calories} kcal</span>
        </summary>
      </details>`;
  }).join('');
}

// ── ADICIONAR TREINO MANUAL ───────────────────
function bindAddTreino() {
  const form = document.getElementById('form-add-treino');
  if (!form) return;

  form.date.value = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const novo = {
      user_id: currentUser.id,
      date: form.date.value,
      modality: form.modality.value,
      duration: parseInt(form.duration.value),
      calories: parseInt(form.calories.value),
      source: 'manual',
      notes: form.notes.value || '',
    };

    const { data } = await supabase
      .from('trainings')
      .insert(novo)
      .select()
      .single();

    if (data) {
      currentTrainings.unshift(data);
      preencherTreinos();
      preencherDashboard();
      form.reset();
    }
  });
}

// ── SINCRONIZAR SMARTWATCH (SIMULADO) ─────────
document.getElementById('btn-sync')?.addEventListener('click', async () => {
  const random = ['musculacao','cardio','natacao'][Math.floor(Math.random()*3)];

  const treino = {
    user_id: currentUser.id,
    date: new Date().toISOString().split('T')[0],
    modality: random,
    duration: 30 + Math.floor(Math.random()*45),
    calories: 200 + Math.floor(Math.random()*300),
    source: 'smartwatch',
    notes: '',
  };

  const { data } = await supabase
    .from('trainings')
    .insert(treino)
    .select()
    .single();

  if (data) {
    currentTrainings.unshift(data);
    preencherTreinos();
    preencherDashboard();
  }
});

// ── AVATAR UPLOAD ─────────────────────────────
function bindAvatarUpload(id) {
  const input = document.getElementById(id);
  if (!input) return;

  input.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `avatars/${currentUser.id}.jpg`;

    await supabase.storage.from('avatars').upload(path, file, { upsert: true });

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);

    await supabase.from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', currentUser.id);

    currentProfile.avatar_url = data.publicUrl;
    aplicarAvatar(document.getElementById('sidebar-avatar'), currentProfile);
    aplicarAvatar(document.getElementById('perfil-avatar'), currentProfile);
    aplicarAvatar(document.getElementById('nav-avatar-img'), currentProfile);
  });
}

// ── REMOVER FOTO ──────────────────────────────
document.getElementById('btn-remove-avatar')?.addEventListener('click', async () => {
  await supabase.from('profiles').update({ avatar_url: null }).eq('id', currentUser.id);
  currentProfile.avatar_url = null;
  aplicarAvatar(document.getElementById('sidebar-avatar'), currentProfile);
});

// ── LOGOUT ────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = '../index.html';
});

// ── ELIMINAR CONTA ────────────────────────────
document.getElementById('btn-delete-account')?.addEventListener('click', async () => {
  if (!confirm('Esta ação é irreversível.')) return;
  await supabase.from('profiles').delete().eq('id', currentUser.id);
  await supabase.auth.signOut();
  window.location.href = '../index.html';
});

// ── INIT FINAL ────────────────────────────────
document.addEventListener('app:ready', init, { once: true });