// ============================================
// functions/api/chat.js — Cloudflare Pages Function
// Proxy seguro entre o browser e a API Anthropic.
// A ANTHROPIC_API_KEY nunca sai do servidor.
//
// Cloudflare Pages → Settings → Environment Variables
// → ANTHROPIC_API_KEY = sk-ant-...
// ============================================

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── OPTIONS — preflight CORS ─────────────────
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}


// ── POST — chamada à Anthropic ───────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  // Valida API key
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'API key não configurada' }, 500);
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }

  const { systemPrompt, messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'Parâmetros em falta' }, 400);
  }

  // Chama Anthropic
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method : 'POST',
    headers: {
      'Content-Type'     : 'application/json',
      'x-api-key'        : env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model     : 'claude-3-haiku-20240307',
      max_tokens: 512,
      system    : systemPrompt || '',
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return json({ error: err?.error?.message || `Erro Anthropic ${res.status}` }, res.status);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text ?? '';

  return json({ text }, 200);
}


// ── Helper ───────────────────────────────────
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

console.log('Anthropic key exists:', !!env.ANTHROPIC_API_KEY);
