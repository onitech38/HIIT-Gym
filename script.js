/* ============================================
   HIIT-GYM — SCRIPT.JS

   ÍNDICE:
   1. AUTH — funções de login/signup/logout
   2. NAV  — actualiza o nav consoante o estado
   3. WELCOME — timer 1s + handlers dos forms
   4. MAP — funcionalidade do mapa existente
   5. DADOS DAS MODALIDADES (existente)
   6. ESTADOS 1/2/3 das modalidades (existente)
   7. EQUIPA — carrossel (existente)
   ============================================ */


// ============================================
// 1. AUTH — BASE DE DADOS SIMULADA (localStorage)
//
// Pensa no localStorage como uma "gaveta" no
// browser onde guardamos a informação do user.
// Não precisa de internet nem de servidor!
//
// Chave usada: 'hiitgym_user'
// Valor: um objecto JSON com todos os dados
// ============================================

const AUTH_KEY = 'hiitgym_user';

/** Lê o user da "gaveta" */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch { return null; }
}

/** Guarda o user na "gaveta" */
function saveUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

/** Remove o user da "gaveta" (logout) */
function removeUser() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Cria treinos simulados para um novo utilizador.
 * Simula dados sincronizados de um smartwatch
 * + alguns inseridos manualmente.
 */
function criarTreinosSimulados() {
  const hoje = new Date();
  const diaMenos = (n) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  return [
    { id: 't1', date: diaMenos(1),  duration: 55, modality: 'musculacao',   calories: 420, source: 'smartwatch', notes: '' },
    { id: 't2', date: diaMenos(3),  duration: 30, modality: 'natacao',      calories: 280, source: 'smartwatch', notes: '' },
    { id: 't3', date: diaMenos(5),  duration: 60, modality: 'yoga_pilates', calories: 190, source: 'manual',     notes: 'Sessão de relaxamento' },
    { id: 't4', date: diaMenos(7),  duration: 45, modality: 'cardio',       calories: 350, source: 'smartwatch', notes: '' },
    { id: 't5', date: diaMenos(10), modality: 'musculacao',   duration: 50, calories: 400, source: 'smartwatch', notes: '' },
    { id: 't6', date: diaMenos(14), modality: 'lutas',        duration: 90, calories: 520, source: 'smartwatch', notes: 'Treino intenso' },
    { id: 't7', date: diaMenos(18), modality: 'zumba_danca',  duration: 60, calories: 310, source: 'manual',     notes: '' },
  ];
}


// ============================================
// 2. NAV — actualiza login/signup ↔ avatar
//
// Depois de entrar, escondemos os links
// "login" e "signup" e mostramos o avatar
// do user (com a sua foto ou iniciais).
// ============================================

function actualizarNav() {
  const user = getUser();
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navAvatarImg = document.getElementById('nav-avatar-img');

  if (!navLogin) return; // Nesta página pode não existir (user page)

  if (user) {
    // Está autenticado → esconde login/signup, mostra avatar
    navLogin.classList.add('hidden');
    navSignup.classList.add('hidden');
    navAvatar.classList.remove('hidden');

    if (navAvatarImg) {
      if (user.avatar) {
        navAvatarImg.style.backgroundImage = `url('${user.avatar}')`;
        navAvatarImg.textContent = '';
      } else {
        // Sem foto → mostra iniciais (ex: "JS" para João Silva)
        navAvatarImg.textContent = (user.firstName[0] + user.lastName[0]).toUpperCase();
        navAvatarImg.style.backgroundImage = '';
      }
    }
  } else {
    // Não autenticado → mostra login/signup
    navLogin.classList.remove('hidden');
    navSignup.classList.remove('hidden');
    navAvatar?.classList.add('hidden');
  }
}

/**
 * Quando clicamos em "login" ou "signup" no nav
 * abre o welcome modal (se não estiver autenticado)
 */
function bindNavAuthLinks() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const welcome   = document.getElementById('welcome');
  if (!welcome) return;

  navLogin?.addEventListener('click', e => {
    e.preventDefault();
    // Garante que está no tab "Login"
    document.getElementById('mode-login')?.click();
    mostrarWelcome();
  });

  navSignup?.addEventListener('click', e => {
    e.preventDefault();
    // Garante que está no tab "Criar Conta"
    document.getElementById('mode-signup')?.click();
    mostrarWelcome();
  });
}


// ============================================
// 3. WELCOME MODAL
//
// Aparece 1 segundo após a página carregar,
// mas SÓ SE o user não estiver autenticado.
//
// O toggle entre Login ↔ Signup é feito
// 100% em CSS (radio buttons ocultos).
// O JS só trata de: timer, guardar dados, fechar.
// ============================================

function mostrarWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.classList.add('visible');
}

function fecharWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.classList.remove('visible');
}

/** Formulário de LOGIN */
function bindLoginForm() {
  const form = document.getElementById('form-login');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const pass  = form.password.value;
    const user  = getUser();
    const erro  = document.getElementById('login-error');

    // Verifica se o email e password batem certo
    if (user && user.email.toLowerCase() === email && user.password === pass) {
      erro?.classList.add('hidden');
      fecharWelcome();
      actualizarNav();
    } else {
      erro?.classList.remove('hidden');
    }
  });
}

/** Formulário de CRIAR CONTA */
function bindSignupForm() {
  const form = document.getElementById('form-signup');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const erro = document.getElementById('signup-error');

    // Validação extra: password com mínimo 6 chars
    if (form.password.value.length < 6) {
      erro.textContent = 'A password deve ter pelo menos 6 caracteres.';
      erro.classList.remove('hidden');
      return;
    }

    // Cria o objecto do user
    const novoUser = {
      id:         'usr_' + Date.now(),
      firstName:  form.firstName.value.trim(),
      lastName:   form.lastName.value.trim(),
      email:      form.email.value.trim().toLowerCase(),
      password:   form.password.value,       // NOTA: em produção usaria hashing!
      phone:      form.phone.value.trim(),
      age:        parseInt(form.age.value),
      weight:     form.weight.value  ? parseFloat(form.weight.value)  : null,
      address:    form.address.value ? form.address.value.trim()      : null,
      avatar:     null,
      // Inscreve-o nas modalidades mais populares por defeito
      enrolledModalities: ['musculacao'],
      // Dá-lhe treinos simulados para a dashboard parecer preenchida
      trainings:  criarTreinosSimulados(),
      createdAt:  new Date().toISOString()
    };

    saveUser(novoUser);
    erro?.classList.add('hidden');
    fecharWelcome();
    actualizarNav();

    // Redirige para a página de perfil
    setTimeout(() => {
      window.location.href = 'user/user.html';
    }, 300);
  });
}

/** Fecha ao clicar no backdrop ou no botão ✕ */
function bindWelcomeClose() {
  document.getElementById('welcome-backdrop')?.addEventListener('click', fecharWelcome);
  document.getElementById('welcome-skip')?.addEventListener('click', fecharWelcome);

  // ESC também fecha
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharWelcome();
  });
}

/** Timer de 1s — mostra o welcome se não estiver autenticado */
window.addEventListener('load', () => {
  actualizarNav();
  bindNavAuthLinks();
  bindLoginForm();
  bindSignupForm();
  bindWelcomeClose();

  if (!getUser()) {
    setTimeout(mostrarWelcome, 1000);
  }
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
    setTimeout(() => {
      mapDetails.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
});

document.addEventListener('click', (e) => {
  if (mapDetails.open && !mapDetails.contains(e.target)) {
    fecharMapa();
  }
});


// ============================================
// FONTE DE VERDADE — edita só aqui
// ============================================
const coaches = {
  carlos: { 
    nome: 'Carlos Silva',     
    avatar: 'src/coaches/carlos/carlos.jpg',    
    card: 'src/coaches/carlos/carlos_card.jpg',    
    modalidades: ['musculacao'] 
  },

  ana: { 
    nome: 'Ana Costa',        
    avatar: 'src/coaches/ana/Ana.jpg',        
    card: 'src/coaches/ana/ana_card.jpg',        
    modalidades: ['musculacao'] 
  },

  rafael: { 
    nome: 'Rafael Mendes',    
    avatar: 'src/coaches/rafael/rafael.jpg',     
    card: 'src/coaches/rafael/rafael_card.jpg',     
    modalidades: ['musculacao'] 
  },

  maria: { 
    nome: 'Maria Oliveira',   
    avatar: 'src/coaches/maria/maria.png',      
    card: 'src/coaches/maria/maria_card.png',      
    modalidades: ['cardio', 'zumba_danca'] 
  },

  joao: { 
    nome: 'João Pereira',     
    avatar: 'src/coaches/joao/joao.png',       
    card: 'src/coaches/joao/joao_card.png',       
    modalidades: ['cardio', 'zumba_danca'] 
  },

  sofia: { 
    nome: 'Sofia Almeida',    
    avatar: 'src/coaches/sofia/sofia.png',      
    card: 'src/coaches/sofia/sofia_card.png',      
    modalidades: ['yoga_pilates'] 
  },

  pedro: { 
    nome: 'Pedro Santos',     
    avatar: 'src/coaches/pedro/pedro.png',      
    card: 'src/coaches/pedro/pedro_card.png',      
    modalidades: ['yoga_pilates'] 
  },

  claudia: { 
    nome: 'Cláudia Ferreira', 
    avatar: 'src/coaches/claudia/claudia.png',    
    card: 'src/coaches/claudia/claudia_card.png',    
    modalidades: ['yoga_pilates'] 
  },

  tiago: { 
    nome: 'Tiago Ribeiro',    
    avatar: 'src/coaches/tiago/tiago.jpg',      
    card: 'src/coaches/tiago/tiago_card.jpg',     
     modalidades: ['yoga_pilates'] 
  },

  ines: { 
    nome: 'Inês Martins',     
    avatar: 'src/coaches/ines/ines.jpg',       
    card: 'src/coaches/ines/ines_card.jpg',       
    modalidades: ['yoga_pilates'] 
  },

  fernando: { 
    nome: 'Fernando Gomes',   
    avatar: 'src/coaches/fernando/fernando.jpg',   
    card: 'src/coaches/fernando/fernando_card.jpg',   
    modalidades: ['lutas'] 
  },

  patricia: { 
    nome: 'Patrícia Lima',    
    avatar: 'src/coaches/patricia/patricia.jpg',   
    card: 'src/coaches/patricia/patricia_card.jpg',   
    modalidades: ['lutas'] 
  },

  ricardo: { 
    nome: 'Ricardo Alves',    
    avatar: 'src/coaches/ricardo/ricardo.jpg',    
    card: 'src/coaches/ricardo/ricardo_card.jpg',    
    modalidades: ['lutas'] 
  },

  andre: { 
    nome: 'André Sousa',      
    avatar: 'src/coaches/andre/andre.jpg',      
    card: 'src/coaches/andre/andre_card.jpg',      
    modalidades: ['natacao'] 
  },

  fernanda: {
     nome: 'Fernanda Rocha',   
    avatar: 'src/coaches/fernanda/fernanda.jpg',   
    card: 'src/coaches/fernanda/fernanda_card.jpg',   
    modalidades: ['natacao'] 
  },

  lucas: { 
    nome: 'Lucas Dias',       
    avatar: 'src/coaches/lucas/lucas.jpg',      
    card: 'src/coaches/lucas/lucas_card.jpg',      
    modalidades: ['natacao'] 
  },

};

const modalidadesData = {
  musculacao: {
    titulo:    'Musculação',
    dias:      'Todos os dias',
    horas:     '06h00 – 22h00',
    descricao: 'Treino de força com pesos e equipamentos, adaptado para desenvolver massa muscular e resistência, com orientação de treinador para garantir a técnica correta e maximizar resultados.',
    coaches:   ['carlos', 'ana', 'rafael'],
  },
  cardio: {
    titulo:    'Cardio',
    dias:      'Todos os dias',
    horas:     '07h00 – 21h00',
    descricao: 'Atividades aeróbicas como corrida, CROSS-FIT, ciclismo e spinning, personalizadas em intensidade e duração, com suporte de profissionais para monitorar o teu progresso.',
    coaches:   ['maria', 'joao'],
  },
  yoga_pilates: {
    titulo:    'Yoga & Pilates',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '17h00 – 19h30',
    descricao: 'Prática que combina posturas físicas, respiração e meditação, adaptada ao teu nível de experiência, com instrutores que oferecem acompanhamento individualizado.',
    coaches:   ['sofia', 'pedro', 'claudia', 'tiago', 'ines'],
  },
  lutas: {
    titulo:    'Lutas e Artes Marciais',
    dias:      '2ª feira a sábado',
    horas:     '19h00 – 20h30',
    descricao: 'Aulas de boxe, jiu-jitsu, muay thai ou karaté, ajustadas ao teu nível e objetivos, com treinadores que oferecem suporte e feedback constante.',
    coaches:   ['fernando', 'patricia', 'ricardo'],
  },
  zumba_danca: {
    titulo:    'Zumba e Danças',
    dias:      '3ª e 5ª feira',
    horas:     '20h00 – 21h30',
    descricao: 'Aulas energéticas com ritmos latinos e coreografias divertidas, perfeitas para perder calorias num ambiente descontraído e motivador.',
    coaches:   ['maria', 'joao'],
  },
  natacao: {
    titulo:    'Natação',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '08h00 – 20h00',
    descricao: 'Aulas para todos os níveis na nossa piscina semi-olímpica aquecida. Treinos personalizados para melhorar técnica, resistência e velocidade.',
    coaches:   ['andre', 'fernanda', 'lucas'],
  }
};


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
    setTimeout(() => {
      mapDetails.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
});

document.addEventListener('click', (e) => {
  if (mapDetails.open && !mapDetails.contains(e.target)) {
    fecharMapa();
  }
});


// ============================================
// REFERÊNCIAS DOM
// ============================================
const imagemEl    = document.getElementById('imagem-principal');
const descEl      = document.getElementById('descricao-overlay');
const escolhas    = document.getElementById('escolhas');
const painel      = document.getElementById('painel');
const todasFatias = document.querySelectorAll('.fatia');

const todosCoachKeys = Object.keys(coaches).slice(0, 8);


// ============================================
// HELPERS
// ============================================
const getIniciais = (n) => n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase();

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
  document.querySelectorAll('.fatia-video').forEach(v => {
    v.pause();
    v.currentTime = 0;
  });
}

function limparFatias() {
  todasFatias.forEach(f => f.classList.remove('selecionada'));
  imagemEl.classList.remove('ativo');
}


// ============================================
// ESTADO 1 — Idle
// ============================================
function estado1() {
  pararVideos();
  limparFatias();
  descEl.textContent = '';
  descEl.classList.remove('visivel');
  renderCoaches(todosCoachKeys);
}


// ============================================
// ESTADO 3 — Click
// ============================================
function estado3(key) {
  const d = modalidadesData[key];
  limparFatias();
  imagemEl.classList.add('ativo');

  const fatiaAlvo = imagemEl.querySelector(`.fatia[data-modal="${key}"]`);
  if (fatiaAlvo) {
    fatiaAlvo.classList.add('selecionada');
    const video = fatiaAlvo.querySelector('.fatia-video');
    if (video && video.src) video.play();
  }

  document.getElementById('painel-titulo').textContent = d.titulo;
  document.getElementById('painel-horarios-bloco').innerHTML =
    `<span>${d.dias}</span><span>${d.horas}</span>`;
  document.getElementById('painel-coaches-lista').innerHTML =
    d.coaches.map(k => `<li>${coaches[k].nome}</li>`).join('');

  escolhas.classList.add('hidden');
  painel.classList.remove('hidden');
  descEl.textContent = d.descricao;
  descEl.classList.add('visivel');
  renderCoaches(d.coaches);
}


// ============================================
// FECHAR PAINEL
// ============================================
document.getElementById('painel-fechar').addEventListener('click', e => {
  e.preventDefault();
  painel.classList.add('hidden');
  escolhas.classList.remove('hidden');
  estado1();
});


// ============================================
// EVENTOS NOS CARDS
// ============================================
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


// ============================================
// INIT
// ============================================
estado1();