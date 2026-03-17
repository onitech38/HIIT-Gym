export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
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

  const userMessage = body.message;
  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: 'Mensagem em falta' }),
      { status: 400, headers }
    );
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userMessage }]
        }
      ]
    })
  });

  const data = await res.json();

  
  
if (!res.ok) {
  console.log('ANTHROPIC STATUS:', res.status);
  console.log('ANTHROPIC RESPONSE:', JSON.stringify(data));

  return new Response(
    JSON.stringify({
      error: data?.error?.message || JSON.stringify(data)
    }),
    { status: 500, headers }
  );
}



  return new Response(
    JSON.stringify({
      text: data?.content?.[0]?.text ?? ''
    }),
    { status: 200, headers }
  );
}
``
