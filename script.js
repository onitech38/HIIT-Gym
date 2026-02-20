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
    imagem:     'src/pexels-amar-9958668.jpg',
    coachFotos: ['src/coaches/carlos.jpg', 'src/coaches/ana.jpg', 'src/coaches/rafael.jpg']
  },
  cardio: {
    titulo:    'Cardio',
    dias:      'Todos os dias',
    horas:     '07h00 – 21h00',
    descricao: 'Atividades aeróbicas como corrida, CROSS-FIT, ciclismo e spinning, personalizadas em intensidade e duração, com suporte de profissionais para monitorar o teu progresso.',
    coaches:    ['Maria Oliveira', 'João Pereira'],
    imagem:     'src/pexels-amar-9958674.jpg',
    coachFotos: ['src/coaches/maria.jpg', 'src/coaches/joao.jpg']
  },
  yoga_pilates: {
    titulo:    'Yoga & Pilates',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '17h00 – 19h30',
    descricao: 'Prática que combina posturas físicas, respiração e meditação, adaptada ao teu nível de experiência, com instrutores que oferecem acompanhamento individualizado.',
    coaches:    ['Sofia Almeida', 'Pedro Santos', 'Cláudia Ferreira', 'Tiago Ribeiro', 'Inês Martins'],
    imagem:     'src/pexels-anastasia-shuraeva-4944435.jpg',
    coachFotos: ['src/coaches/sofia.jpg', 'src/coaches/pedro.jpg', 'src/coaches/claudia.jpg', 'src/coaches/tiago.jpg', 'src/coaches/ines.jpg']
  },
  lutas: {
    titulo:    'Lutas e Artes Marciais',
    dias:      '2ª feira a sábado',
    horas:     '19h00 – 20h30',
    descricao: 'Aulas de boxe, jiu-jitsu, muay thai ou karaté, ajustadas ao teu nível e objetivos, com treinadores que oferecem suporte e feedback constante.',
    coaches:    ['Fernando Gomes', 'Patrícia Lima', 'Ricardo Alves'],
    imagem:     'src/pexels-artbovich-7031705.jpg',
    coachFotos: ['src/coaches/fernando.jpg', 'src/coaches/patricia.jpg', 'src/coaches/ricardo.jpg']
  },
  zumba_danca: {
    titulo:    'Zumba e Danças',
    dias:      '3ª e 5ª feira',
    horas:     '20h00 – 21h30',
    descricao: 'Aulas energéticas com ritmos latinos e coreografias divertidas, perfeitas para perder calorias num ambiente descontraído e motivador.',
    coaches:    ['Maria Oliveira', 'João Pereira'],
    imagem:     'src/pexels-dimkidama-6796964.jpg',
    coachFotos: ['src/coaches/maria.jpg', 'src/coaches/joao.jpg']
  },
  natacao: {
    titulo:    'Natação',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '08h00 – 20h00',
    descricao: 'Aulas para todos os níveis na nossa piscina semi-olímpica aquecida. Treinos personalizados para melhorar técnica, resistência e velocidade.',
    coaches:    ['André Sousa', 'Fernanda Rocha', 'Lucas Dias'],
    imagem:     'src/pexels-eyecon-design-500632474-17211446.jpg',
    coachFotos: ['src/coaches/andre.jpg', 'src/coaches/fernanda.jpg', 'src/coaches/lucas.jpg']
  }
};


// ============================================
// LÓGICA — não precisas de tocar aqui
// ============================================
const imagemEl  = document.getElementById('imagem-principal');
const descEl    = document.getElementById('descricao-overlay');
const coachesEl = document.getElementById('coaches-row');
const escolhas  = document.getElementById('escolhas');
const painel    = document.getElementById('painel');

const imagemGeral = 'src/pexels-foadshariyati-29224211.jpg';
const todosFotos  = Object.values(modalidadesData).flatMap(m => m.coachFotos).slice(0, 8);
const todosNomes  = Object.values(modalidadesData).flatMap(m => m.coaches).slice(0, 8);

function renderCoaches(fotos, nomes) {
  coachesEl.innerHTML = fotos.map((f, i) => `
    <div class="coach-avatar" style="background-image:url('${f}')">
      <span class="coach-nome">${nomes[i] || ''}</span>
    </div>
  `).join('');
}

function estado1() {
  imagemEl.style.backgroundImage = `url('${imagemGeral}')`;
  descEl.textContent = '';
  descEl.classList.remove('visivel');
  renderCoaches(todosFotos, todosNomes);
}

function estado2(key) {
  const d = modalidadesData[key];
  imagemEl.style.backgroundImage = `url('${d.imagem}')`;
  descEl.classList.remove('visivel');
  renderCoaches(d.coachFotos, d.coaches);
}

function estado3(key) {
  const d = modalidadesData[key];
  document.getElementById('painel-titulo').textContent = d.titulo;
  document.getElementById('painel-horarios-bloco').innerHTML =
    `<span>${d.dias}</span><span>${d.horas}</span>`;
  document.getElementById('painel-coaches-lista').innerHTML =
    d.coaches.map(c => `<li>${c}</li>`).join('');
  escolhas.classList.add('hidden');
  painel.classList.remove('hidden');
  imagemEl.style.backgroundImage = `url('${d.imagem}')`;
  descEl.textContent = d.descricao;
  descEl.classList.add('visivel');
  renderCoaches(d.coachFotos, d.coaches);
}

document.getElementById('painel-fechar').addEventListener('click', e => {
  e.preventDefault();
  painel.classList.add('hidden');
  escolhas.classList.remove('hidden');
  estado1();
});

document.querySelectorAll('.modalidade-item').forEach(item => {
  item.addEventListener('mouseenter', () => estado2(item.dataset.modal));
  item.addEventListener('mouseleave', () => {
    if (!painel.classList.contains('hidden')) return;
    estado1();
  });
  item.addEventListener('click', () => estado3(item.dataset.modal));
});

estado1();