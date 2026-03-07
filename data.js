/* ============================================
   DATA.JS — CMS da HIIT-Gym
   ============================================
   Edita APENAS este ficheiro para gerir conteúdo.
   Carregado antes de script.js e blog.js.

   ▸ MODALIDADES
     active: true  → aparece no site
     active: false → escondida (layout ajusta)

   ▸ ARTIGOS
     active: true   → visível no blog
     active: false  → rascunho / escondido
     destaque: true → artigo em destaque (só 1)
   ============================================ */

// ── COACHES ──────────────────────────────────
const coaches = {
  carlos:   { nome: 'Carlos Silva',     avatar: 'src/coaches/carlos/carlos.jpg',     card: 'src/coaches/carlos/carlos_card.jpg',     modalidades: ['musculacao'] },
  ana:      { nome: 'Ana Costa',        avatar: 'src/coaches/ana/ana.jpg',           card: 'src/coaches/ana/ana_card.jpg',           modalidades: ['musculacao'] },
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

// ── MODALIDADES ───────────────────────────────
// active: true  → aparece na página (fatia + painel)
// active: false → removida; layout ajusta sozinho
const modalidadesData = {
  musculacao: {
    active:    true,
    titulo:    'Musculação',
    dias:      'Todos os dias',
    horas:     '06h00 – 22h00',
    descricao: 'Treino de força com pesos e equipamentos, adaptado para desenvolver massa muscular e resistência, com orientação de treinador.',
    coaches:   ['carlos', 'ana', 'rafael'],
    imagem:    'src/modalidades/musculacao.jpg',
    video:     'src/modalidades/videos/musculacao.mp4',
  },
  cardio: {
    active:    true,
    titulo:    'Cardio',
    dias:      'Todos os dias',
    horas:     '07h00 – 21h00',
    descricao: 'Atividades aeróbicas como corrida, CROSS-FIT, ciclismo e spinning, personalizadas em intensidade e duração.',
    coaches:   ['maria', 'joao'],
    imagem:    'src/modalidades/cardio.jpg',
    video:     'src/modalidades/videos/cardio.mp4',
  },
  yoga_pilates: {
    active:    true,
    titulo:    'Yoga & Pilates',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '17h00 – 19h30',
    descricao: 'Prática que combina posturas físicas, respiração e meditação, adaptada ao teu nível de experiência.',
    coaches:   ['sofia', 'pedro', 'claudia', 'tiago', 'ines'],
    imagem:    'src/modalidades/yoga_pilates.jpg',
    video:     'src/modalidades/videos/yoga_pilates.mp4',
  },
  lutas: {
    active:    true,
    titulo:    'Lutas e Artes Marciais',
    dias:      '2ª feira a sábado',
    horas:     '19h00 – 20h30',
    descricao: 'Aulas de boxe, jiu-jitsu, muay thai ou karaté, ajustadas ao teu nível e objetivos.',
    coaches:   ['fernando', 'patricia', 'ricardo'],
    imagem:    'src/modalidades/lutas.jpg',
    video:     'src/modalidades/videos/lutas.mp4',
  },
  zumba_danca: {
    active:    true,
    titulo:    'Zumba e Danças',
    dias:      '3ª e 5ª feira',
    horas:     '20h00 – 21h30',
    descricao: 'Aulas energéticas com ritmos latinos e coreografias divertidas, perfeitas para perder calorias.',
    coaches:   ['maria', 'joao'],
    imagem:    'src/modalidades/zumba_danca.jpg',
    video:     'src/modalidades/videos/zumba_danca.mp4',
  },
  natacao: {
    active:    true,
    titulo:    'Natação',
    dias:      '2ª, 4ª e 6ª feira',
    horas:     '08h00 – 20h00',
    descricao: 'Aulas para todos os níveis na nossa piscina semi-olímpica aquecida. Treinos para melhorar técnica e resistência.',
    coaches:   ['andre', 'fernanda', 'lucas'],
    imagem:    'src/modalidades/natacao.jpg',
    video:     'src/modalidades/videos/natacao.mp4',
  },

  /* ── Para adicionar/remover uma modalidade:
  crossfit: {
    active:    false,          ← false = não aparece
    titulo:    'CrossFit',
    dias:      '2ª, 4ª e 6ª',
    horas:     '18h00 – 19h30',
    descricao: 'Treino funcional...',
    coaches:   ['carlos'],
    imagem:    'src/modalidades/crossfit.jpg',
    video:     'src/modalidades/videos/crossfit.mp4',
  },
  ── */
};

// ── ARTIGOS DO BLOG ───────────────────────────
// active:    true  → visível
// active:    false → rascunho
// destaque:  true  → artigo principal (só 1!)
// categoria: 'treino' | 'nutricao' | 'saude' | 'novidade'
const artigosData = {

  erros_musculacao: {
    active: true, destaque: true, categoria: 'treino',
    titulo:  'Os 5 Erros Mais Comuns no Treino de Musculação',
    resumo:  'Os nossos Personal Trainers partilham os erros mais frequentes e como os resolver definitivamente.',
    data:    '2026-02-28', leitura: '8 min',
    imagem:  '../src/modalidades/musculacao.jpg',
    conteudo: `
      <p>Treinar com pesos é uma das formas mais eficazes de transformar o corpo — mas também onde mais erros se cometem.</p>
      <h3>1. Ignorar a técnica em favor do peso</h3>
      <p>É tentador aumentar o peso no bar para impressionar — mas a técnica incorreta é a causa número um de lesões. <strong>Solução:</strong> começa com um peso que permita 12 reps com técnica perfeita. Só depois aumentas.</p>
      <h3>2. Não respeitar o descanso</h3>
      <p>O músculo cresce durante o descanso, não durante o treino. <strong>Solução:</strong> 48h de intervalo entre treinos do mesmo grupo muscular.</p>
      <h3>3. Não ter um plano</h3>
      <p>Chegar ao ginásio sem saber o que vais treinar é o maior inimigo da progressão. <strong>Solução:</strong> segue um programa de 8–12 semanas com progressão de carga definida.</p>
      <h3>4. Descurar a nutrição</h3>
      <p>Proteína insuficiente = recuperação lenta. <strong>Solução:</strong> aponta para 1,6–2,2g de proteína por kg de peso corporal.</p>
      <h3>5. Comparar-se com os outros</h3>
      <p>O ginásio não é competição. <strong>Solução:</strong> regista os teus próprios progressos e compite apenas com a versão de ontem.</p>
    `,
  },

  hiit_vs_cardio: {
    active: true, destaque: false, categoria: 'treino',
    titulo:  'HIIT vs Steady-State Cardio: Qual é o Melhor Para Perder Gordura?',
    resumo:  'Comparação com evidência científica entre treino intervalado de alta intensidade e cardio tradicional.',
    data:    '2026-02-20', leitura: '5 min',
    imagem:  '../src/modalidades/cardio.jpg',
    conteudo: `
      <p>A resposta curta? Depende dos teus objectivos. O HIIT pode queimar até 25–30% mais calorias no mesmo tempo, com efeito afterburn (EPOC) prolongado. O cardio steady-state é mais sustentável e tem menor impacto articular.</p>
      <h3>A nossa recomendação</h3>
      <p>Combina os dois: 2–3 sessões de HIIT por semana + 1–2 sessões de cardio moderado para máxima queima de gordura com baixo risco de overtraining.</p>
    `,
  },

  nutricao_treino: {
    active: true, destaque: false, categoria: 'nutricao',
    titulo:  'O Que Comer Antes e Depois do Treino Para Maximizar Resultados',
    resumo:  'A nutricionista da HIIT-Gym explica as janelas anabólicas, proteínas e hidratos para cada tipo de treino.',
    data:    '2026-02-15', leitura: '6 min',
    imagem:  '../src/modalidades/yoga_pilates.jpg',
    conteudo: `
      <h3>Antes do treino (1–2h antes)</h3>
      <p>Hidratos de absorção lenta + proteína moderada: aveia com proteína, arroz + frango, torradas integrais com ovo.</p>
      <h3>Depois do treino (até 2h depois)</h3>
      <p>A janela anabólica é mais larga do que se pensava. O foco é proteína + hidratos de reposição: batido de proteína com fruta, salmão com batata-doce, iogurte grego com granola.</p>
      <p><strong>Regra de ouro:</strong> 20–40g de proteína na refeição pós-treino.</p>
    `,
  },

  beneficios_natacao: {
    active: true, destaque: false, categoria: 'saude',
    titulo:  'Os Benefícios da Natação Para a Coluna e Articulações',
    resumo:  'A natação é um dos exercícios com menos impacto no corpo. Descobre porque é recomendada por fisioterapeutas.',
    data:    '2026-02-10', leitura: '4 min',
    imagem:  '../src/modalidades/natacao.jpg',
    conteudo: `
      <p>Na água, o corpo perde cerca de 90% do seu peso aparente. Isso significa treino cardiovascular intenso sem o impacto que corrida ou saltos impõem nas articulações.</p>
      <h3>Benefícios comprovados</h3>
      <ul>
        <li><strong>Coluna:</strong> flutuação descomprime os discos intervertebrais</li>
        <li><strong>Joelhos e ancas:</strong> ideal para recuperação pós-cirúrgica ou artrite</li>
        <li><strong>Postura:</strong> 3 sessões semanais melhoram postura e reduzem tensão no pescoço</li>
      </ul>
    `,
  },

  nova_area_lutas: {
    active: true, destaque: false, categoria: 'novidade',
    titulo:  'Nova Área de Lutas Inaugurada na HIIT-Gym Montijo!',
    resumo:  'Temos nova área dedicada às artes marciais com equipamento de ponta e novos instrutores.',
    data:    '2026-02-05', leitura: '3 min',
    imagem:  '../src/modalidades/lutas.jpg',
    conteudo: `
      <p>É com orgulho que anunciamos a inauguração da nova área de lutas e artes marciais da HIIT-Gym Montijo!</p>
      <h3>O que há de novo</h3>
      <ul>
        <li>Ring de boxe profissional homologado</li>
        <li>Tatami de jiu-jitsu e judo (80m²)</li>
        <li>Sacos de boxe de teto e parede</li>
        <li>Vestiário dedicado com cacifos</li>
      </ul>
      <p>Modalidades: Boxe, Muay Thai, Jiu-Jitsu Brasileiro, Karaté e Defesa Pessoal.</p>
    `,
  },

  zumba_ciencia: {
    active: true, destaque: false, categoria: 'treino',
    titulo:  'Zumba: Muito Mais Que Dançar — os Benefícios Cardíacos Comprovados',
    resumo:  'Uma aula de Zumba pode queimar entre 400–600 calorias. A ciência explica porque este treino é tão eficaz.',
    data:    '2026-01-28', leitura: '7 min',
    imagem:  '../src/modalidades/zumba_danca.jpg',
    conteudo: `
      <p>Uma aula de 60 minutos pode queimar entre 400 e 600 calorias — mais do que uma hora de corrida moderada. A variação constante de intensidade funciona como um HIIT espontâneo.</p>
      <p>Estudo de 2012 no <em>Journal of Sports Science & Medicine</em> concluiu que o Zumba eleva a frequência cardíaca para 79–84% da FCMax, ideal para queima de gordura.</p>
    `,
  },

  suplementacao: {
    active: true, destaque: false, categoria: 'nutricao',
    titulo:  'Suplementação Inteligente: O Que Realmente Funciona em 2026',
    resumo:  'Com tantos suplementos no mercado, a nossa nutricionista desmistifica o que tem evidência científica real.',
    data:    '2026-01-20', leitura: '5 min',
    imagem:  '../src/modalidades/musculacao.jpg',
    conteudo: `
      <p><strong>Proteína em pó:</strong> útil quando não consegues atingir necessidades proteicas só com alimentação. 20–40g por dose.</p>
      <p><strong>Creatina monohidratada:</strong> um dos suplementos mais estudados. Melhora performance em esforços explosivos. 3–5g/dia.</p>
      <p><strong>Vitamina D3:</strong> a maioria dos europeus tem défice. Impacto na função muscular e imunidade.</p>
      <p><strong>Cafeína:</strong> melhora performance aeróbica e foco. 3–6mg/kg, 30–60 min antes do treino.</p>
    `,
  },

  yoga_meditacao: {
    active: true, destaque: false, categoria: 'saude',
    titulo:  'Yoga e Meditação: Como 15 Minutos Por Dia Transformam o Teu Desempenho',
    resumo:  'O treino mental é tão importante como o físico. Técnicas de respiração e mindfulness que os nossos atletas usam.',
    data:    '2026-01-15', leitura: '6 min',
    imagem:  '../src/modalidades/yoga_pilates.jpg',
    conteudo: `
      <p>Estudos de Harvard mostram que 8 semanas de mindfulness (15 min/dia) reduzem o córtex associado ao stress e aumentam o foco e tomada de decisão.</p>
      <h3>Como começar</h3>
      <ol>
        <li><strong>Respiração 4-7-8:</strong> inspira 4s → retém 7s → expira 8s. Activa o sistema parassimpático.</li>
        <li><strong>Body scan:</strong> 5 min antes de dormir a identificar tensão muscular. Melhora o sono em 23%.</li>
        <li><strong>Visualização:</strong> pratica mentalmente o teu treino antes de o fazer.</li>
      </ol>
    `,
  },

  app_hiitgym: {
    active: true, destaque: false, categoria: 'novidade',
    titulo:  'App HIIT-Gym Disponível! Instala Agora no Teu Telefone',
    resumo:  'Já podes instalar o site da HIIT-Gym como uma app. Acede ao teu perfil, treinos e blog em qualquer lugar.',
    data:    '2026-01-08', leitura: '2 min',
    imagem:  '../src/modalidades/cardio.jpg',
    conteudo: `
      <h3>Como instalar</h3>
      <p><strong>Android / Chrome:</strong> menu ⋮ → "Adicionar ao ecrã inicial" ou "Instalar app".</p>
      <p><strong>iPhone / Safari:</strong> botão de partilha → "Adicionar ao ecrã inicial".</p>
      <h3>O que tens disponível</h3>
      <ul>
        <li>Perfil e estatísticas de treino</li>
        <li>QR Code de acesso às instalações</li>
        <li>Blog e novidades da academia</li>
        <li>Funciona offline</li>
      </ul>
    `,
  },

  /* ── Para adicionar um artigo:
  novo_artigo: {
    active:    false,           ← rascunho
    destaque:  false,
    categoria: 'treino',        ← treino | nutricao | saude | novidade
    titulo:    'Título',
    resumo:    'Resumo para o card.',
    data:      '2026-03-10',
    leitura:   '5 min',
    imagem:    '../src/modalidades/cardio.jpg',
    conteudo:  `<p>Conteúdo HTML...</p>`,
  },
  ── */
};
