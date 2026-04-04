// ============================================
// functions/api/chat.js — Assistente HIIT-Gym
// Cloudflare Workers AI — 100% free tier
// Modelo: @cf/meta/llama-3.1-8b-instruct
//
// Configuração necessária no Cloudflare:
//   Pages → Settings → Functions → AI Bindings
//   → Add binding → Variable name: AI
// ============================================

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

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

export async function onRequestPost(context) {
  // Verificar binding Workers AI
  if (!context.env.AI) {
    return new Response(
      JSON.stringify({ error: 'Workers AI não configurado. Adiciona o binding AI nas configurações do Pages.' }),
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

  try {
    const response = await context.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'És o assistente virtual da HIIT-Gym Montijo. Responde SEMPRE em português europeu de forma concisa e útil. Podes ajudar com horários (seg-sex 06h-22h, sáb-dom 08h-20h), modalidades (musculação, cardio, yoga, lutas, zumba, natação), planos (Básico 29€, Standard 49€, Premium 79€/mês) e inscrições. Sê simpático e motivador. Máximo 3 parágrafos por resposta.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 400,
    });

    const text = response?.response || '';

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    console.error('[chat] Workers AI erro:', err.message);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar mensagem' }),
      { status: 500, headers: CORS }
    );
  }
}
