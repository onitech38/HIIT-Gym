// ============================================
// functions/api/chat.js — Assistente HIIT-Gym
// Anthropic claude-haiku-4-5 via API REST
// ANTHROPIC_API_KEY configurado no Cloudflare
// ============================================

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function onRequestPost(context) {
  if (!context.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }),
      { status: 500, headers: CORS }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido' }),
      { status: 400, headers: CORS }
    );
  }

  const userMessage = body.message;
  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: 'Mensagem em falta' }),
      { status: 400, headers: CORS }
    );
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:     'És o assistente virtual da HIIT-Gym Montijo. Responde sempre em português europeu de forma concisa e útil. Podes ajudar com horários, modalidades, planos de subscrição e inscrições. Para questões de fitness e nutrição, informa que esse apoio está disponível nos planos Standard e Premium.',
      messages: [
        { role: 'user', content: userMessage }
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: data?.error?.message || 'Erro Anthropic' }),
      { status: res.status, headers: CORS }
    );
  }

  const text = data.content?.[0]?.text || '';

  return new Response(
    JSON.stringify({ text }),
    { status: 200, headers: CORS }
  );
}
