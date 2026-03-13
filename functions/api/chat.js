/* ============================================
   functions/api/chat.js
   Cloudflare Pages Function — proxy seguro para Anthropic

   Variável de ambiente necessária (Cloudflare Dashboard):
   Settings → Environment variables → ANTHROPIC_API_KEY

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
