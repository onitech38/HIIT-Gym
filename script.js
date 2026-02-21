// ============================================
// MAP
// ============================================
document.querySelector('#map summary').addEventListener('click', () => {
  setTimeout(() => {
    document.querySelector('#map').scrollIntoView({ behavior: 'smooth' });
  }, 50);
});

document.addEventListener('click', (e) => {
  const map = document.querySelector('#map');
  if (map.open && !map.contains(e.target)) {
    map.removeAttribute('open');
  }
});


// ============================================
// DADOS DE CADA MODALIDADE — edita aqui!
// ============================================
const modalidadesData = {
  musculacao: {
    titulo:    'Musculação',
    dias:      'Todos os dias',
    horas:     '06h00 – 22h00',
    descricao: 'Treino de força com pesos e equipamentos, adaptado para desenvolver massa muscular e resistência, com orientação de treinador para garantir a técnica correta e maximizar resultados.',
    coaches:    ['Carlos Silva', 'Ana Costa', 'Rafael Mendes'],
    coachFotos: ['src/coaches/carlos.jpg', 'src/coaches/ana.jpg', 'src/coaches/rafael.jpg']
  },
  cardio: {
    titulo:    'Cardio',
    dias:      'Todos os dias',
    horas:     '07h00 – 21h00',
    descricao: 'Atividades aeróbicas como corrida, CROSS-FIT, ciclismo e spinning, personalizadas em intensidade e duração, com suporte de profissionais para monitorar o teu progresso.',
    coaches:    ['Maria Oliveira', 'João Pereira'],
    coachFotos: ['src/coaches/maria.jpg', 'src/coaches/joao.jpg']
  },
  yoga_pilates: {
    titulo:    'Yoga & Pilates',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '17h00 – 19h30',
    descricao: 'Prática que combina posturas físicas, respiração e meditação, adaptada ao teu nível de experiência, com instrutores que oferecem acompanhamento individualizado.',
    coaches:    ['Sofia Almeida', 'Pedro Santos', 'Cláudia Ferreira', 'Tiago Ribeiro', 'Inês Martins'],
    coachFotos: ['src/coaches/sofia.jpg', 'src/coaches/pedro.jpg', 'src/coaches/claudia.jpg', 'src/coaches/tiago.jpg', 'src/coaches/ines.jpg']
  },
  lutas: {
    titulo:    'Lutas e Artes Marciais',
    dias:      '2ª feira a sábado',
    horas:     '19h00 – 20h30',
    descricao: 'Aulas de boxe, jiu-jitsu, muay thai ou karaté, ajustadas ao teu nível e objetivos, com treinadores que oferecem suporte e feedback constante.',
    coaches:    ['Fernando Gomes', 'Patrícia Lima', 'Ricardo Alves'],
    coachFotos: ['src/coaches/fernando.jpg', 'src/coaches/patricia.jpg', 'src/coaches/ricardo.jpg']
  },
  zumba_danca: {
    titulo:    'Zumba e Danças',
    dias:      '3ª e 5ª feira',
    horas:     '20h00 – 21h30',
    descricao: 'Aulas energéticas com ritmos latinos e coreografias divertidas, perfeitas para perder calorias num ambiente descontraído e motivador.',
    coaches:    ['Maria Oliveira', 'João Pereira'],
    coachFotos: ['src/coaches/maria.jpg', 'src/coaches/joao.jpg']
  },
  natacao: {
    titulo:    'Natação',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '08h00 – 20h00',
    descricao: 'Aulas para todos os níveis na nossa piscina semi-olímpica aquecida. Treinos personalizados para melhorar técnica, resistência e velocidade.',
    coaches:    ['André Sousa', 'Fernanda Rocha', 'Lucas Dias'],
    coachFotos: ['src/coaches/andre.jpg', 'src/coaches/fernanda.jpg', 'src/coaches/lucas.jpg']
  }
};


// ============================================
// REFERÊNCIAS DOM
// ============================================
const imagemEl    = document.getElementById('imagem-principal');
const descEl      = document.getElementById('descricao-overlay');
const coachesEl   = document.getElementById('coaches-row');
const escolhas    = document.getElementById('escolhas');
const painel      = document.getElementById('painel');
const todasFatias = document.querySelectorAll('.fatia');

const todosFotos = Object.values(modalidadesData).flatMap(m => m.coachFotos).slice(0, 8);
const todosNomes = Object.values(modalidadesData).flatMap(m => m.coaches).slice(0, 8);


// ============================================
// HELPERS
// ============================================
function iniciais(nome) {
  return nome.split(' ').map(w => w[0]).join('').slice(0, 2);
}

// coaches e fotos são arrays paralelos
// Se a foto existir → background-image; se não → mostra iniciais como fallback
function renderCoaches(coaches, fotos = []) {
  coachesEl.innerHTML = coaches.map((nome, i) => {
    const foto  = fotos[i] || '';
    const bg    = foto ? `style="background-image:url('${foto}')"` : '';
    const texto = foto ? '' : iniciais(nome);
    return `
      <div class="coach-avatar" ${bg}>
        ${texto}
        <span class="coach-nome">${nome}</span>
      </div>`;
  }).join('');
}

// Para todos os vídeos e reseta para o início
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
  renderCoaches(todosNomes, todosFotos);
}


// ============================================
// ESTADO 2 — Hover
// CSS :has() trata o visual das fatias.
// JS só atualiza os coaches.
// ============================================
function estado2(key) {
  const d = modalidadesData[key];
  renderCoaches(d.coaches, d.coachFotos);
}


// ============================================
// ESTADO 3 — Click
// Fatia expande (500ms CSS) → vídeo faz fade in (delay 200ms no CSS)
// ============================================
function estado3(key) {
  const d = modalidadesData[key];

  // 1. Para todos os vídeos primeiro
  pararVideos();

  // 2. Marca container e fatia
  imagemEl.classList.add('ativo');
  todasFatias.forEach(f => f.classList.remove('selecionada'));
  const fatiaAlvo = imagemEl.querySelector(`.fatia[data-modal="${key}"]`);
  if (fatiaAlvo) {
    fatiaAlvo.classList.add('selecionada');

    // 3. Arranca o vídeo (se existir e tiver src definido)
    //    O CSS trata o delay de 200ms via transition-delay na opacidade
    const video = fatiaAlvo.querySelector('.fatia-video');
    if (video && video.src) video.play();
  }

  // 4. Preenche o painel
  document.getElementById('painel-titulo').textContent = d.titulo;
  document.getElementById('painel-horarios-bloco').innerHTML =
    `<span>${d.dias}</span><span>${d.horas}</span>`;
  document.getElementById('painel-coaches-lista').innerHTML =
    d.coaches.map(c => `<li>${c}</li>`).join('');

  escolhas.classList.add('hidden');
  painel.classList.remove('hidden');

  // 5. Descrição e coaches
  descEl.textContent = d.descricao;
  descEl.classList.add('visivel');
  renderCoaches(d.coaches, d.coachFotos);
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
  item.addEventListener('mouseenter', () => {
    if (painel.classList.contains('hidden')) estado2(item.dataset.modal);
  });
  item.addEventListener('mouseleave', () => {
    if (painel.classList.contains('hidden')) estado1();
  });
  item.addEventListener('click', () => estado3(item.dataset.modal));
});


// ============================================
// INIT
// ============================================
estado1();