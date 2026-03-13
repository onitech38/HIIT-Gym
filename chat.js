/* ============================================
   functions/api/chat.js
   Cloudflare Pages Function — proxy seguro para Anthropic

   Variável de ambiente necessária (Cloudflare Dashboard):
   Settings → Environment variables → ANTHROPIC_API_KEY

function injectChatUI() {
  // Evitar duplicação
  if (document.getElementById('chat-panel')) return;

  // CSS dinâmico — injectado no <head> para garantir que está
  // aplicado antes de qualquer render do aside
  if (!document.getElementById('chat-css')) {
    const depth  = window.location.pathname.split('/').length - 2;
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    const link   = document.createElement('link');
    link.id       = 'chat-css';
    link.rel      = 'stylesheet';
    link.href     = `${prefix}chat.css`;
    document.head.insertBefore(link, document.head.firstChild); // primeiro no head
  }

  // HTML: botão flutuante + painel
  const aside = document.createElement('aside');
  aside.className = 'q_a';
  aside.innerHTML = `
    <a class="btn to_top icon-small glass" href="#" aria-label="Voltar ao topo">
      <i class="fa-solid fa-arrow-up-from-bracket"></i>
    </a>
    <button class="btn icon glass" id="chat-toggle" aria-label="Abrir assistente">
      <i class="fa-regular fa-comment-dots fa-flip-horizontal"></i>
    </button>`;

  const panel = document.createElement('div');
  panel.id = 'chat-panel';
  panel.className = 'chat-panel glass';
  panel.setAttribute('aria-label', 'Assistente HIIT-Gym');
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <span class="chat-titulo">Assistente HIIT-Gym</span>
        <span class="chat-sub" id="chat-sub">Online</span>
      </div>
      <button class="btn icon glass" id="chat-fechar" aria-label="Fechar">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div class="chat-messages" id="chat-messages" role="log" aria-live="polite"></div>

    <div class="chat-input-wrap">
      <input type="text" id="chat-input"
             placeholder="Pergunta-me algo..."
             autocomplete="off" maxlength="400"
             aria-label="Mensagem">
      <button class="btn glass" id="chat-send" aria-label="Enviar">
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </div>`;

  // Remover .q_a estáticos do HTML que não têm #chat-toggle
  document.querySelectorAll('.q_a:not(:has(#chat-toggle))').forEach(el => el.remove());

  document.body.appendChild(aside);
  document.body.appendChild(panel);

  bindChatEvents();
}


/* ============================================
   2. EVENTOS
   O browser chama POST /api/chat com { messages, systemPrompt }
   Esta function chama a Anthropic com a chave secreta
   e devolve a resposta — a chave NUNCA chega ao browser.
============================================ */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS — permite chamadas do mesmo domínio e localhost
  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Validar body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400, headers });
  }

  const { messages, systemPrompt } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages obrigatório' }), { status: 400, headers });
  }

  // Chave da API (variável de ambiente Cloudflare)
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key não configurada' }), { status: 500, headers });
  }

  // Chamada à Anthropic
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Erro API' }), {
        status: resp.status, headers
      });
    }

    const text = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({ text }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

async function chamarClaude(userMessage) {
  const systemPrompt = buildSystemPrompt();

  // Histórico para contexto (últimas 10 trocas, sem duplicar a última mensagem)
  const mensagensContexto = chatHistorico
    .slice(-20)
    .filter(m => m.content !== userMessage);

  // Chama o proxy seguro (/api/chat — Cloudflare Pages Function)
  // A API key NUNCA é exposta no browser — fica no servidor Cloudflare.
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      messages: [
        ...mensagensContexto,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Erro ${response.status}`);
  }

  const data = await response.json();
  return data.text || 'Sem resposta.';
}

function buildSystemPrompt() {
  // Constrói contexto a partir do data.js (disponível globalmente)
  const modalidades = typeof modalidadesData !== 'undefined'
    ? Object.entries(modalidadesData)
        .filter(([, d]) => d.active)
        .map(([, d]) => `• ${d.titulo}: ${d.dias}, ${d.horas}`)
        .join('\n')
    : '';

  const planInfo = chatUserPlan && chatUserPlan !== 'none'
    ? `O utilizador tem plano: ${chatUserPlan}.`
    : 'O utilizador não tem plano ou não está autenticado.';

  const fitnessPermission = temPlanoFitness()
    ? 'Podes responder a questões de fitness e nutrição em geral.'
    : 'NÃO respondas a questões de fitness e nutrição geral — informa que está disponível a partir do plano Standard.';

  return `És o assistente virtual da HIIT-Gym Montijo. Respondes sempre em português europeu, de forma simpática, directa e profissional.

INFORMAÇÃO DO GINÁSIO:
Morada: Rua Exemplo, 123, Montijo
Horário geral: Seg-Sex 06h00-22h00 | Sáb-Dom 08h00-20h00
Telefone: +351 912 345 678
Email: info@hiitgym.pt

MODALIDADES:
${modalidades}

PLANOS:
• Básico (29€/mês): acesso à academia, musculação, horário livre
• Standard (49€/mês): tudo do básico + aulas de grupo ilimitadas, piscina, 1 aula PT/mês
• Premium (79€/mês): tudo do standard + PT 4x/mês, consulta de nutrição, acesso 24h/7

INSCRIÇÕES:
As inscrições nas modalidades são feitas na página "Modalidades" do site ou directamente em /modalidades/modalidades.html.

${planInfo}
${fitnessPermission}

REGRAS:
- Sê conciso (máx. 3-4 parágrafos por resposta).
- Usa markdown simples (negrito, listas) quando ajuda.
- Se não souberes, diz que não tens essa informação e sugere contactar o ginásio.
- Nunca inventares horários, preços ou informações que não estejam aqui.
- Não respondas a perguntas fora do âmbito do ginásio e fitness/saúde.`;
}


/* ============================================
   6. HELPERS — RENDER
function mostrarMensagem(role, content, animar = true) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;

  const div = document.createElement('div');
  div.className = `chat-msg chat-msg--${role}${animar ? ' chat-msg--nova' : ''}`;
  div.innerHTML = `
    <div class="chat-bubble">${formatarMensagem(content)}</div>`;
  msgs.appendChild(div);
  scrollChat();
}

function formatarMensagem(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');
}

function mostrarTyping() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-msg chat-msg--assistant chat-msg--typing';
  div.innerHTML = `<div class="chat-bubble"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  scrollChat();
  return id;
}

function removerTyping(id) {
  document.getElementById(id)?.remove();
}

function scrollChat() {
  const msgs = document.getElementById('chat-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function mensagemBoasVindas() {
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 19 ? 'Boa tarde' : 'Boa noite';
  return `${saudacao}! 👋 Sou o assistente da HIIT-Gym Montijo.\n\nPosso ajudar-te com **horários**, **modalidades**, **planos** e **inscrições**.\n${temPlanoFitness() ? 'Com o teu plano também posso dar dicas de **fitness e nutrição**! 💪' : ''}`;
}


/* ============================================
   7. HELPERS — LÓGICA
const PALAVRAS_FITNESS = [
  'calorias','proteína','proteinas','carboidratos','gordura','dieta','nutrição',
  'nutriçao','alimentação','alimentacao','suplemento','suplementos','creatina',
  'whey','massa muscular','perder peso','emagrecer','bulking','cutting','macros',
  'treino em casa','exercício','exercicio','séries','series','repetições',
  'repeticoes','cardio em casa','hiit','alongamento','flexibilidade','recovery',
  'recuperação','recuperacao','sono','descanso','overtraining',
];

function perguntaFitnessNutricao(texto) {
  const t = texto.toLowerCase();
  return PALAVRAS_FITNESS.some(p => t.includes(p));
}

function temPlanoFitness() {
  return ['standard', 'premium'].includes(chatUserPlan);
// OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


// ── Auto-init ─────────────────────────────────
// Quando carregado directamente (sem global.js),
// injeta o UI assim que o DOM estiver pronto.
// global.js chama injectChatUI() no seu próprio init,
// portanto este listener é inofensivo nas outras páginas.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectChatUI);
} else {
  // DOM já pronto (script defer ou carregado tarde)
  injectChatUI();
}
