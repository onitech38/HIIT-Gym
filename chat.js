//============================================
//   CHAT.JS — Assistente HIIT-Gym
//
//   Injectado em todas as páginas via global.js.
//
//   FLUXO:
//   1. Injeta HTML (aside .q_a + .chat-panel) no body
//   2. Injeta chat.css dinamicamente
//   3. Ao abrir → carrega histórico (Supabase ou localStorage)
//   4. Ao enviar → verifica plano → chama API
//   5. Guarda resposta no histórico
//
//   GATING:
//   • Info do ginásio     → livre para todos
//   • Fitness / nutrição  → só standard / premium
//============================================

const CHAT_LS_KEY = 'hiitgym_chat_history';
const CHAT_MAX_HISTORY = 20;

// ── Estado ────────────────────────────────────
let chatAberto    = false;
let chatHistorico = [];
let chatUserPlan  = null;


//============================================
//   1. INJECT HTML + CSS
//============================================
function injectChatUI() {
  if (document.getElementById('chat-panel')) return;

  if (!document.getElementById('chat-css')) {
    const depth  = window.location.pathname.split('/').length - 2;
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    const link   = document.createElement('link');
    link.id       = 'chat-css';
    link.rel      = 'stylesheet';
    link.href     = `${prefix}chat.css`;
    document.head.insertBefore(link, document.head.firstChild);
  }

  const aside = document.createElement('aside');
  aside.className = 'q_a';
  aside.innerHTML = `
    <a class="btn small to_top glass" href="#" aria-label="Voltar ao topo">
      <i class="fa-solid fa-arrow-up-from-bracket"></i>
    </a>
    <button class="glass" id="chat-toggle" aria-label="Abrir assistente">
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

  document.querySelectorAll('.q_a:not(:has(#chat-toggle))').forEach(el => el.remove());

  document.body.appendChild(aside);
  document.body.appendChild(panel);

  bindChatEvents();
}


//============================================
//   2. EVENTOS
//============================================
function bindChatEvents() {
  document.getElementById('chat-toggle')?.addEventListener('click', toggleChat);
  document.getElementById('chat-fechar')?.addEventListener('click', fecharChat);

  const input = document.getElementById('chat-input');
  const send  = document.getElementById('chat-send');

  send?.addEventListener('click', enviarMensagem);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  });
}

function toggleChat() {
  chatAberto ? fecharChat() : abrirChat();
}

async function abrirChat() {
  chatAberto = true;
  const panel = document.getElementById('chat-panel');
  panel?.classList.add('aberto');
  document.getElementById('chat-toggle')?.querySelector('i')
    .classList.replace('fa-comment-dots', 'fa-xmark');

  await carregarPlano();
  await carregarHistorico();

  if (chatHistorico.length === 0) {
    mostrarMensagem('assistant', mensagemBoasVindas());
  }

  setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
}

function fecharChat() {
  chatAberto = false;
  document.getElementById('chat-panel')?.classList.remove('aberto');
  document.getElementById('chat-toggle')?.querySelector('i')
    .classList.replace('fa-xmark', 'fa-comment-dots');
}


//============================================
//   3. PLANO + HISTÓRICO
//============================================
async function carregarPlano() {
  if (!window.supabaseClient) {
    chatUserPlan = 'none';
    return;
  }

  try {
    const { data: { session } } =
      await window.supabaseClient.auth.getSession();

    if (!session) { chatUserPlan = 'none'; return; }

    const { data } = await window.supabaseClient
      .from('profiles')
      .select('plan')
      .eq('id', session.user.id)
      .single();

    chatUserPlan = data?.plan || 'none';
  } catch {
    chatUserPlan = 'none';
  }
}

async function carregarHistorico() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;

  if (!window.supabaseClient) {
    const raw = localStorage.getItem(CHAT_LS_KEY);
    chatHistorico = raw ? JSON.parse(raw).slice(-CHAT_MAX_HISTORY * 2) : [];
    msgs.innerHTML = '';
    chatHistorico.forEach(m => mostrarMensagem(m.role, m.content, false));
    scrollChat();
    return;
  }

  try {
    const { data: { session } } =
      await window.supabaseClient.auth.getSession();

    if (session) {
      const { data } = await window.supabaseClient
        .from('chat_history')
        .select('role, content, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(CHAT_MAX_HISTORY * 2);

      chatHistorico = (data || []).map(r => ({ role: r.role, content: r.content }));
    } else {
      const raw = localStorage.getItem(CHAT_LS_KEY);
      chatHistorico = raw ? JSON.parse(raw).slice(-CHAT_MAX_HISTORY * 2) : [];
    }
  } catch {
    chatHistorico = [];
  }

  msgs.innerHTML = '';
  chatHistorico.forEach(m => mostrarMensagem(m.role, m.content, false));
  scrollChat();
}

async function guardarMensagem(role, content) {
  if (!window.supabaseClient) {
    const hist = JSON.parse(localStorage.getItem(CHAT_LS_KEY) || '[]');
    hist.push({ role, content });
    localStorage.setItem(CHAT_LS_KEY, JSON.stringify(hist.slice(-CHAT_MAX_HISTORY * 2)));
    return;
  }

  try {
    const { data: { session } } =
      await window.supabaseClient.auth.getSession();

    if (session) {
      await window.supabaseClient.from('chat_history').insert({ user_id: session.user.id, role, content });
    } else {
      const hist = JSON.parse(localStorage.getItem(CHAT_LS_KEY) || '[]');
      hist.push({ role, content });
      localStorage.setItem(CHAT_LS_KEY, JSON.stringify(hist.slice(-CHAT_MAX_HISTORY * 2)));
    }
  } catch {
    const hist = JSON.parse(localStorage.getItem(CHAT_LS_KEY) || '[]');
    hist.push({ role, content });
    localStorage.setItem(CHAT_LS_KEY, JSON.stringify(hist.slice(-CHAT_MAX_HISTORY * 2)));
  }
}


//============================================
//   4. ENVIAR MENSAGEM
//============================================
async function enviarMensagem() {
  const input = document.getElementById('chat-input');
  const texto = input?.value.trim();
  if (!texto) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('chat-send').disabled = true;

  mostrarMensagem('user', texto);
  const typingId = mostrarTyping();

  try {
    const resposta = await chamarAPI(texto);
    removerTyping(typingId);
    mostrarMensagem('assistant', resposta);
    await guardarMensagem('user', texto);
    await guardarMensagem('assistant', resposta);
  } catch (err) {
    removerTyping(typingId);
    mostrarMensagem('assistant', 'De momento não consigo responder. Tenta novamente em breve.');
    console.error('Chat error:', err);
  }

  reativarInput();
}

function reativarInput() {
  const input = document.getElementById('chat-input');
  const send  = document.getElementById('chat-send');
  if (input) { input.disabled = false; input.focus(); }
  if (send)    send.disabled = false;
}


//============================================
//   5. API
//============================================
async function chamarAPI(userMessage) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage }),
  });

  if (!response.ok) throw new Error(`Erro backend: ${response.status}`);

  const data = await response.json();
  return data.text;
}


//============================================
//   6. HELPERS — RENDER
//============================================
function mostrarMensagem(role, content, animar = true) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;

  const div = document.createElement('div');
  div.className = `chat-msg chat-msg--${role}${animar ? ' chat-msg--nova' : ''}`;
  div.innerHTML = `<div class="chat-bubble">${formatarMensagem(content)}</div>`;
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


//============================================
//   7. HELPERS — LÓGICA
//============================================
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
}

injectChatUI();
