// ============================================
// DATA-ATIVIDADES.JS
// Modalidades e Coaches
// ============================================

const modalidadesData = {
  musculacao: {
    active: true,
    titulo: 'Musculação',
    dias: 'Todos os dias',
    horas: '06h00 – 22h00',
    descricao:
      'Treino de força com pesos e equipamentos, adaptado para desenvolver massa muscular e resistência.',
    imagem: 'src/modalidades/musculacao.jpg',
    video: 'src/modalidades/videos/musculacao.mp4',
    coaches: ['carlos', 'ana', 'rafael'],
  },

  cardio: {
    active: true,
    titulo: 'Cardio',
    dias: 'Todos os dias',
    horas: '07h00 – 21h00',
    descricao:
      'Atividades aeróbicas como corrida, cycling e HIIT para melhorar resistência cardiovascular.',
    imagem: 'src/modalidades/cardio.jpg',
    video: 'src/modalidades/videos/cardio.mp4',
    coaches: ['maria', 'joao'],
  },

  yoga_pilates: {
    active: true,
    titulo: 'Yoga & Pilates',
    dias: '2ª, 4ª e 6ª feira',
    horas: '17h00 – 19h30',
    descricao:
      'Prática focada em flexibilidade, respiração, postura e equilíbrio físico e mental.',
    imagem: 'src/modalidades/yoga_pilates.jpg',
    video: 'src/modalidades/videos/yoga_pilates.mp4',
    coaches: ['sofia', 'pedro', 'claudia', 'tiago', 'ines'],
  },

  lutas: {
    active: true,
    titulo: 'Lutas e Artes Marciais',
    dias: '2ª feira a sábado',
    horas: '19h00 – 20h30',
    descricao:
      'Boxe, Muay Thai, Jiu-Jitsu e Karaté com foco em técnica, disciplina e condição física.',
    imagem: 'src/modalidades/lutas.jpg',
    video: 'src/modalidades/videos/lutas.mp4',
    coaches: ['fernando', 'patricia', 'ricardo'],
  },

  zumba_danca: {
    active: true,
    titulo: 'Zumba e Danças',
    dias: '3ª e 5ª feira',
    horas: '20h00 – 21h30',
    descricao:
      'Aulas energéticas com ritmos latinos, ideais para queimar calorias de forma divertida.',
    imagem: 'src/modalidades/zumba_danca.jpg',
    video: 'src/modalidades/videos/zumba_danca.mp4',
    coaches: ['maria', 'joao'],
  },

  natacao: {
    active: true,
    titulo: 'Natação',
    dias: '2ª, 4ª e 6ª feira',
    horas: '08h00 – 20h00',
    descricao:
      'Aulas para todos os níveis em piscina aquecida, focadas em técnica e resistência.',
    imagem: 'src/modalidades/natacao.jpg',
    video: 'src/modalidades/videos/natacao.mp4',
    coaches: ['andre', 'fernanda', 'lucas'],
  },
};

const coaches = {
  carlos: {
    nome: 'Carlos Silva',
    avatar: 'src/coaches/carlos/carlos.jpg',
    card: 'src/coaches/carlos/carlos_card.jpg',
    modalidades: ['musculacao'],
    bio: 'Personal Trainer certificado com 10 anos de experiência.',
  },

  ana: {
    nome: 'Ana Costa',
    avatar: 'src/coaches/ana/ana.jpg',
    card: 'src/coaches/ana/ana_card.jpg',
    modalidades: ['musculacao'],
    bio: 'Especialista em treino feminino e nutrição desportiva.',
  },

  rafael: {
    nome: 'Rafael Mendes',
    avatar: 'src/coaches/rafael/rafael.jpg',
    card: 'src/coaches/rafael/rafael_card.jpg',
    modalidades: ['musculacao'],
    bio: 'Ex-atleta de powerlifting focado em progressão de carga.',
  },

  maria: {
    nome: 'Maria Oliveira',
    avatar: 'src/coaches/maria/maria.png',
    card: 'src/coaches/maria/maria_card.png',
    modalidades: ['cardio', 'zumba_danca'],
    bio: 'Instrutora de Zumba e cardio com formação em dança.',
  },

  joao: {
    nome: 'João Pereira',
    avatar: 'src/coaches/joao/joao.png',
    card: 'src/coaches/joao/joao_card.png',
    modalidades: ['cardio', 'zumba_danca'],
    bio: 'Treinador de ciclismo e HIIT.',
  },

  sofia: {
    nome: 'Sofia Almeida',
    avatar: 'src/coaches/sofia/sofia.png',
    card: 'src/coaches/sofia/sofia_card.png',
    modalidades: ['yoga_pilates'],
    bio: 'Instrutora de Yoga certificada.',
  },

  pedro: {
    nome: 'Pedro Santos',
    avatar: 'src/coaches/pedro/pedro.png',
    card: 'src/coaches/pedro/pedro_card.png',
    modalidades: ['yoga_pilates'],
    bio: 'Professor de Pilates clínico.',
  },

  claudia: {
    nome: 'Cláudia Ferreira',
    avatar: 'src/coaches/claudia/claudia.png',
    card: 'src/coaches/claudia/claudia_card.png',
    modalidades: ['yoga_pilates'],
    bio: 'Mestre em Yoga Vinyasa.',
  },

  tiago: {
    nome: 'Tiago Ribeiro',
    avatar: 'src/coaches/tiago/tiago.png',
    card: 'src/coaches/tiago/tiago_card.png',
    modalidades: ['yoga_pilates'],
    bio: 'Instrutor com formação em biomecânica.',
  },

  ines: {
    nome: 'Inês Martins',
    avatar: 'src/coaches/ines/ines.png',
    card: 'src/coaches/ines/ines_card.png',
    modalidades: ['yoga_pilates'],
    bio: 'Especialista em Yoga terapêutico.',
  },

  fernando: {
    nome: 'Fernando Gomes',
    avatar: 'src/coaches/fernando/fernando.jpg',
    card: 'src/coaches/fernando/fernando_card.png',
    modalidades: ['lutas'],
    bio: 'Campeão nacional de Muay Thai.',
  },

  patricia: {
    nome: 'Patrícia Lima',
    avatar: 'src/coaches/patricia/patricia.png',
    card: 'src/coaches/patricia/patricia_card.png',
    modalidades: ['lutas'],
    bio: 'Faixa preta de Jiu-Jitsu Brasileiro.',
  },

  ricardo: {
    nome: 'Ricardo Alves',
    avatar: 'src/coaches/ricardo/ricardo.png',
    card: 'src/coaches/ricardo/ricardo_card.png',
    modalidades: ['lutas'],
    bio: 'Sensei de Karaté com 20 anos de experiência.',
  },

  andre: {
    nome: 'André Sousa',
    avatar: 'src/coaches/andre/andre.jpg',
    card: 'src/coaches/andre/andre_card.jpg',
    modalidades: ['natacao'],
    bio: 'Treinador de natação competitiva.',
  },

  fernanda: {
    nome: 'Fernanda Rocha',
    avatar: 'src/coaches/fernanda/fernanda.jpg',
    card: 'src/coaches/fernanda/fernanda_card.jpg',
    modalidades: ['natacao'],
    bio: 'Especialista em natação terapêutica.',
  },

  lucas: {
    nome: 'Lucas Dias',
    avatar: 'src/coaches/lucas/lucas.jpg',
    card: 'src/coaches/lucas/lucas_card.jpg',
    modalidades: ['natacao'],
    bio: 'Treinador focado em técnica e performance.',
  },
};

window.modalidadesData = modalidadesData;
window.coaches = coaches;