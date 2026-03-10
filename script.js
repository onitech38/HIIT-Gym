/* ============================================
   HIIT-GYM — SCRIPT.JS  (Supabase Auth)

   ÍNDICE:
   1. AUTH  — login / signup / logout via Supabase
   2. NAV   — avatar consoante sessão
   3. WELCOME — modal com forms
   4. MAP   — mapa existente
   5. MODALIDADES — dados + estados
   6. EQUIPA — carrossel
   7. PWA   — botão de instalação
   ============================================ */


// ============================================
// 1. AUTH — Supabase
// ============================================

/** Devolve o utilizador autenticado (ou null) */
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Devolve o perfil completo da tabela public.profiles */
async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

/** LOGIN */
async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, error };
}

/** SIGNUP */
async function signupUser({ firstName, lastName, email, password, phone, age, weight, address }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName, phone, age, weight, address }
    }
  });
  return { user: data?.user ?? null, error };
}

/** LOGOUT */
async function logoutUser() {
  await supabase.auth.signOut();
}


// ============================================
// 2. NAV — avatar / links de auth
// ============================================

async function actualizarNav() {
  const user    = await getUser();
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navAvatarImg = document.getElementById('nav-avatar-img');

  if (!navLogin) return;

  if (user) {
    navLogin.classList.add('hidden');
    navSignup.classList.add('hidden');
    navAvatar?.classList.remove('hidden');

    if (navAvatarImg) {
      const profile = await getProfile(user.id);
      if (profile?.avatar_url) {
        navAvatarImg.style.backgroundImage = `url('${profile.avatar_url}')`;
        navAvatarImg.textContent = '';
      } else {
        const first = profile?.first_name || user.user_metadata?.firstName || '?';
        const last  = profile?.last_name  || user.user_metadata?.lastName  || '';
        navAvatarImg.textContent = (first[0] + (last[0] || '')).toUpperCase();
        navAvatarImg.style.backgroundImage = '';
      }
    }
  } else {
    navLogin.classList.remove('hidden');
    navSignup.classList.remove('hidden');
    navAvatar?.classList.add('hidden');
  }
}

function bindNavAuthLinks() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const welcome   = document.getElementById('welcome');
  if (!welcome) return;

  navLogin?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('mode-login')?.click();
    mostrarWelcome();
  });

  navSignup?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('mode-signup')?.click();
    mostrarWelcome();
  });
}


// ============================================
// 3. WELCOME MODAL
// ============================================

function mostrarWelcome() {
  document.getElementById('welcome')?.classList.add('visible');
}

function fecharWelcome() {
  document.getElementById('welcome')?.classList.remove('visible');
}

function setFormLoading(btn, loading) {
  btn.disabled = loading;
  btn.dataset.original = btn.dataset.original || btn.innerHTML;
  btn.innerHTML = loading
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Aguarda...'
    : btn.dataset.original;
}

/** Formulário LOGIN */
function bindLoginForm() {
  const form = document.getElementById('form-login');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn   = form.querySelector('button[type="submit"]');
    const erro  = document.getElementById('login-error');
    const email = form.email.value.trim().toLowerCase();
    const pass  = form.password.value;

    setFormLoading(btn, true);
    const { user, error } = await loginUser(email, pass);
    setFormLoading(btn, false);

    if (user) {
      erro?.classList.add('hidden');
      fecharWelcome();
      await actualizarNav();
    } else {
      erro.textContent = 'Email ou password incorretos.';
      erro?.classList.remove('hidden');
    }
  });
}

/** Formulário CRIAR CONTA */
function bindSignupForm() {
  const form = document.getElementById('form-signup');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = form.querySelector('button[type="submit"]');
    const erro = document.getElementById('signup-error');

    if (form.password.value.length < 6) {
      erro.textContent = 'A password deve ter pelo menos 6 caracteres.';
      erro.classList.remove('hidden');
      return;
    }

    setFormLoading(btn, true);

    const { user, error } = await signupUser({
      firstName: form.firstName.value.trim(),
      lastName:  form.lastName.value.trim(),
      email:     form.email.value.trim().toLowerCase(),
      password:  form.password.value,
      phone:     form.phone.value.trim(),
      age:       parseInt(form.age.value),
      weight:    form.weight.value ? parseFloat(form.weight.value) : null,
      address:   form.address.value.trim() || null,
    });

    setFormLoading(btn, false);

    if (user) {
      erro?.classList.add('hidden');
      fecharWelcome();
      await actualizarNav();
      setTimeout(() => { window.location.href = 'user/user.html'; }, 300);
    } else {
      erro.textContent = error?.message || 'Erro ao criar conta. Tenta novamente.';
      erro.classList.remove('hidden');
    }
  });
}

function bindWelcomeClose() {
  document.getElementById('welcome-backdrop')?.addEventListener('click', fecharWelcome);
  document.getElementById('welcome-skip')?.addEventListener('click', fecharWelcome);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharWelcome(); });
}

window.addEventListener('load', async () => {
  await actualizarNav();
  bindNavAuthLinks();
  bindLoginForm();
  bindSignupForm();
  bindWelcomeClose();

  const user = await getUser();
  if (!user) setTimeout(mostrarWelcome, 1000);
});

// Reage a mudanças de sessão (logout noutra aba, etc.)
supabase.auth.onAuthStateChange(async (event) => {
  await actualizarNav();
});


// ============================================
// MAP
// ============================================
const mapDetails = document.querySelector('#map');
const mapSummary = document.querySelector('#map summary');
const mapLocal   = document.querySelector('#map .local');

function fecharMapa() {
  mapLocal.classList.add('closing');
  setTimeout(() => {
    mapLocal.classList.remove('closing');
    mapDetails.removeAttribute('open');
  }, 350);
}

mapSummary.addEventListener('click', (e) => {
  if (mapDetails.open) {
    e.preventDefault();
    fecharMapa();
  } else {
    setTimeout(() => mapDetails.scrollIntoView({ behavior: 'smooth' }), 50);
  }
});

document.addEventListener('click', (e) => {
  if (mapDetails.open && !mapDetails.contains(e.target)) fecharMapa();
});


// ============================================
// MODALIDADES — dados
// ============================================
const coaches = {
  carlos:   { nome: 'Carlos Silva',     avatar: 'src/coaches/carlos/carlos.jpg',     card: 'src/coaches/carlos/carlos_card.jpg',     modalidades: ['musculacao'] },
  ana:      { nome: 'Ana Costa',        avatar: 'src/coaches/ana/Ana.jpg',           card: 'src/coaches/ana/ana_card.jpg',           modalidades: ['musculacao'] },
  rafael:   { nome: 'Rafael Mendes',    avatar: 'src/coaches/rafael/rafael.jpg',     card: 'src/coaches/rafael/rafael_card.jpg',     modalidades: ['musculacao'] },
  maria:    { nome: 'Maria Oliveira',   avatar: 'src/coaches/maria/maria.png',       card: 'src/coaches/maria/maria_card.png',       modalidades: ['cardio', 'zumba_danca'] },
  joao:     { nome: 'João Pereira',     avatar: 'src/coaches/joao/joao.png',         card: 'src/coaches/joao/joao_card.png',         modalidades: ['cardio', 'zumba_danca'] },
  sofia:    { nome: 'Sofia Almeida',    avatar: 'src/coaches/sofia/sofia.png',       card: 'src/coaches/sofia/sofia_card.png',       modalidades: ['yoga_pilates'] },
  pedro:    { nome: 'Pedro Santos',     avatar: 'src/coaches/pedro/pedro.png',       card: 'src/coaches/pedro/pedro_card.png',       modalidades: ['yoga_pilates'] },
  claudia:  { nome: 'Cláudia Ferreira', avatar: 'src/coaches/claudia/claudia.png',   card: 'src/coaches/claudia/claudia_card.png',   modalidades: ['yoga_pilates'] },
  tiago:    { nome: 'Tiago Ribeiro',    avatar: 'src/coaches/tiago/tiago.png',       card: 'src/coaches/tiago/tiago_card.png',       modalidades: ['yoga_pilates'] },
  ines:     { nome: 'Inês Martins',     avatar: 'src/coaches/ines/ines.png',         card: 'src/coaches/ines/ines_card.png',         modalidades: ['yoga_pilates'] },
  fernando: { nome: 'Fernando Gomes',   avatar: 'src/coaches/fernando/fernando.jpg', card: 'src/coaches/fernando/fernando_card.jpg', modalidades: ['lutas'] },
  patricia: { nome: 'Patrícia Lima',    avatar: 'src/coaches/patricia/patricia.jpg', card: 'src/coaches/patricia/patricia_card.jpg', modalidades: ['lutas'] },
  ricardo:  { nome: 'Ricardo Alves',    avatar: 'src/coaches/ricardo/ricardo.jpg',   card: 'src/coaches/ricardo/ricardo_card.jpg',   modalidades: ['lutas'] },
  andre:    { nome: 'André Sousa',      avatar: 'src/coaches/andre/andre.jpg',       card: 'src/coaches/andre/andre_card.jpg',       modalidades: ['natacao'] },
  fernanda: { nome: 'Fernanda Rocha',   avatar: 'src/coaches/fernanda/fernanda.jpg', card: 'src/coaches/fernanda/fernanda_card.jpg', modalidades: ['natacao'] },
  lucas:    { nome: 'Lucas Dias',       avatar: 'src/coaches/lucas/lucas.jpg',       card: 'src/coaches/lucas/lucas_card.jpg',       modalidades: ['natacao'] },
};

const modalidadesData = {
  musculacao: {
    active: true, titulo: 'Musculação', dias: 'Todos os dias', horas: '06h00 – 22h00',
    descricao: 'Treino de força com pesos e equipamentos, adaptado para desenvolver massa muscular e resistência, com orientação de treinador.',
    coaches: ['carlos', 'ana', 'rafael'],
  },
  cardio: {
    active: true, titulo: 'Cardio', dias: 'Todos os dias', horas: '07h00 – 21h00',
    descricao: 'Atividades aeróbicas como corrida, CROSS-FIT, ciclismo e spinning, personalizadas em intensidade e duração.',
    coaches: ['maria', 'joao'],
  },
  yoga_pilates: {
    active: true, titulo: 'Yoga & Pilates', dias: '2ª, 4ª e 6ª feira', horas: '17h00 – 19h30',
    descricao: 'Prática que combina posturas físicas, respiração e meditação, adaptada ao teu nível de experiência.',
    coaches: ['sofia', 'pedro', 'claudia', 'tiago', 'ines'],
  },
  lutas: {
    active: true, titulo: 'Lutas e Artes Marciais', dias: '2ª feira a sábado', horas: '19h00 – 20h30',
    descricao: 'Aulas de boxe, jiu-jitsu, muay thai ou karaté, ajustadas ao teu nível e objetivos.',
    coaches: ['fernando', 'patricia', 'ricardo'],
  },
  zumba_danca: {
    active: true, titulo: 'Zumba e Danças', dias: '3ª e 5ª feira', horas: '20h00 – 21h30',
    descricao: 'Aulas energéticas com ritmos latinos e coreografias divertidas, perfeitas para perder calorias.',
    coaches: ['maria', 'joao'],
  },
  natacao: {
    active: true, titulo: 'Natação', dias: '2ª, 4ª e 6ª feira', horas: '08h00 – 20h00',
    descricao: 'Aulas para todos os níveis na nossa piscina semi-olímpica aquecida.',
    coaches: ['andre', 'fernanda', 'lucas'],
  },
};


// ============================================
// REFERÊNCIAS DOM — modalidades
// ============================================
const imagemEl    = document.getElementById('imagem-principal');
const descEl      = document.getElementById('descricao-overlay');
const escolhas    = document.getElementById('escolhas');
const painel      = document.getElementById('painel');
const todasFatias = document.querySelectorAll('.fatia');
const todosCoachKeys = Object.keys(coaches).slice(0, 8);

const getIniciais = n => n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase();

function renderCoaches(coachKeys) {
  const container = document.getElementById('coaches-row');
  container.innerHTML = coachKeys.map(key => {
    const c = coaches[key];
    return `
      <div class="coach-wrapper">
        <button class="coach-avatar"
          ${c.avatar ? `style="background-image:url('${c.avatar}')"` : ''}
          aria-label="${c.nome}">
          ${c.avatar ? '' : getIniciais(c.nome)}
        </button>
        <span class="coach-tooltip">${c.nome}</span>
      </div>`;
  }).join('');
}

function pararVideos() {
  document.querySelectorAll('.fatia-video').forEach(v => { v.pause(); v.currentTime = 0; });
}

function limparFatias() {
  todasFatias.forEach(f => f.classList.remove('selecionada'));
  imagemEl.classList.remove('ativo');
}

function estado1() {
  pararVideos(); limparFatias();
  descEl.textContent = ''; descEl.classList.remove('visivel');
  renderCoaches(todosCoachKeys);
}

function estado3(key) {
  const d = modalidadesData[key];
  limparFatias();
  imagemEl.classList.add('ativo');

  const fatiaAlvo = imagemEl.querySelector(`.fatia[data-modal="${key}"]`);
  if (fatiaAlvo) {
    fatiaAlvo.classList.add('selecionada');
    const video = fatiaAlvo.querySelector('.fatia-video');
    if (video?.src) video.play();
  }

  document.getElementById('painel-titulo').textContent = d.titulo;
  document.getElementById('painel-horarios-bloco').innerHTML =
    `<span>${d.dias}</span><span>${d.horas}</span>`;
  document.getElementById('painel-coaches-lista').innerHTML =
    d.coaches.map(k => `<li>${coaches[k].nome}</li>`).join('');

  // Link de inscrição com a modalidade pré-selecionada
  document.getElementById('painel-inscrever').href = `inscricao/inscricao.html?modalidade=${key}`;

  escolhas.classList.add('hidden');
  painel.classList.remove('hidden');
  descEl.textContent = d.descricao;
  descEl.classList.add('visivel');
  renderCoaches(d.coaches);
}

document.getElementById('painel-fechar').addEventListener('click', e => {
  e.preventDefault();
  painel.classList.add('hidden');
  escolhas.classList.remove('hidden');
  estado1();
});

document.querySelectorAll('.modalidade-item').forEach(item => {
  item.addEventListener('click', () => estado3(item.dataset.modal));
});


// ============================================
// EQUIPA — carrossel
// ============================================
const equipaTrack = document.getElementById('equipa-track');

equipaTrack.innerHTML = Object.values(coaches).map(c => `
  <div class="equipa-card"
       ${c.card ? `style="background-image:url('${c.card}')"` : ''}>
    ${!c.card ? `<span class="equipa-card-iniciais">${getIniciais(c.nome)}</span>` : ''}
    <div class="equipa-info">
      <span class="equipa-nome">${c.nome}</span>
      <span class="equipa-tags">${c.modalidades.map(m => modalidadesData[m].titulo).join(' · ')}</span>
    </div>
  </div>
`).join('');

const scrollPorCard = () => equipaTrack.querySelector('.equipa-card')?.offsetWidth + 16 || 300;

document.getElementById('equipa-prev')
  .addEventListener('click', () => equipaTrack.scrollBy({ left: -scrollPorCard(), behavior: 'smooth' }));
document.getElementById('equipa-next')
  .addEventListener('click', () => equipaTrack.scrollBy({ left: scrollPorCard(), behavior: 'smooth' }));

estado1();


// ============================================
// PWA — Botão de instalação
// ============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn      = document.getElementById('pwa-install-btn');
  const fallback = document.getElementById('app-fallback');

  if (btn) {
    btn.classList.remove('hidden');
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { btn.textContent = '✓ App instalada!'; btn.disabled = true; }
      deferredPrompt = null;
    });
  }
  fallback?.classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) { btn.textContent = '✓ App instalada!'; btn.disabled = true; }
  deferredPrompt = null;
});

window.addEventListener('load', () => {
  const isIos   = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInApp = window.matchMedia('(display-mode: standalone)').matches;
  const fallback = document.getElementById('app-fallback');
  const btn     = document.getElementById('pwa-install-btn');

  if (isInApp) { btn?.classList.add('hidden'); return; }
  if (isIos && !deferredPrompt && fallback) fallback.classList.remove('hidden');
});


// ============================================
// BOTÃO "Área de Membro"
// ============================================
document.getElementById('btn-membro')?.addEventListener('click', async e => {
  const user = await getUser();
  if (!user) {
    e.preventDefault();
    document.getElementById('mode-signup')?.click();
    mostrarWelcome();
  }
});