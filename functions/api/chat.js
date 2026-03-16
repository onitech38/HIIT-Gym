export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const key = (env || {}).ANTHROPIC_API_KEY;

  if (!key) return new Response(JSON.stringify({ error: 'API key não configurada' }), { status: 500, headers });

  const { systemPrompt, messages } = await request.json();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, system: systemPrompt || '', messages }),
  });

  const data = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: data?.error?.message || `Erro ${res.status}` }), { status: res.status, headers });

  return new Response(JSON.stringify({ text: data?.content?.[0]?.text ?? '' }), { status: 200, headers });
}
