// ============================================
// functions/api/stripe-portal.js
// Abre o portal de gestão de subscrição Stripe.
// O utilizador pode cancelar, actualizar dados,
// ver facturas — tudo hosted pelo Stripe.
// Recebe: { userId }
// Devolve: { url } para redirecionar
// ============================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe não configurado' }, 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Body inválido' }, 400); }

  const { userId } = body;
  if (!userId) return json({ error: 'userId obrigatório' }, 400);

  // 1. Buscar stripe_customer_id do Supabase
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`,
    {
      headers: {
        'apikey':        env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const profiles   = await profileRes.json();
  const customerId = profiles?.[0]?.stripe_customer_id;

  if (!customerId) {
    return json({ error: 'Sem subscrição activa' }, 404);
  }

  // 2. Criar sessão do portal Stripe
  const params = new URLSearchParams({
    customer:     customerId,
    return_url:   `${env.SITE_URL}/user/user.html`,
  });

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    return json({ error: data?.error?.message || 'Erro Stripe' }, res.status);
  }

  return json({ url: data.url }, 200);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
