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

export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!env?.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key não configurada' }),
      { status: 500, headers }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido' }),
      { status: 400, headers }
    );
  }

  const { systemPrompt, messages } = body;

if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Parâmetros em falta' }),
      { status: 400, headers }
    );
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: systemPrompt || '',
      messages,
    }),
  });

const data = await res.json();

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: data?.error?.message || `Erro ${res.status}` }),
      { status: res.status, headers }
    );
  }

  return new Response(
    JSON.stringify({ text: data?.content?.[0]?.text ?? '' }),
    { status: 200, headers }
  );
}