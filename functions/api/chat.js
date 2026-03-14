// ============================================
// functions/api/chat.js — Cloudflare Pages Function
//
// Proxy seguro entre o browser e a API da Anthropic.
// A ANTHROPIC_API_KEY nunca sai do servidor.
//
// Configurar em: Cloudflare Pages → Settings →
//   Environment Variables → ANTHROPIC_API_KEY
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── CORS ────────────────────────────────────
  const corsHeaders = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ── Validação da API key ─────────────────────
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key não configurada' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // ── Parse do body enviado pelo chat.js ──────
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const { systemPrompt, messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: 'Parâmetros em falta' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // ── Chamada à Anthropic ──────────────────────
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method : 'POST',
    headers: {
      'Content-Type'     : 'application/json',
      'x-api-key'        : env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model     : 'claude-haiku-4-5-20251001', // rápido e económico para chat
      max_tokens: 512,
      system    : systemPrompt || '',
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: err?.error?.message || `Erro Anthropic ${anthropicRes.status}` }),
      { status: anthropicRes.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const data = await anthropicRes.json();
  const text = data?.content?.[0]?.text ?? '';

  return new Response(
    JSON.stringify({ text }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}


// ── OPTIONS (preflight CORS) ──────────────────
export async function onRequestOptions() {
  return new Response(null, {
    status : 204,
    headers: {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
