// functions/api/chat.js
export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key não configurada' }),
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

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'És o assistente virtual da HIIT-Gym. Responde sempre em português europeu.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.4,
      max_tokens: 300
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: data?.error?.message || 'Erro OpenAI' }),
      { status: 500, headers }
    );
  }

  return new Response(
    JSON.stringify({
      text: data.choices[0].message.content
    }),
    { status: 200, headers }
  );
}
