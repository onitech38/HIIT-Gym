// ============================================
// ============================================
// functions/api/stripe-checkout.js
// Cria uma sessão Stripe Checkout.
// Recebe: { priceId, userId, userEmail }
// Devolve: { url } para redirecionar o browser
// ============================================
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
  if (!context.env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe não configurado' }, 500);
  }

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'Body inválido' }, 400); }

  const { priceId, userId, userEmail } = body;
  if (!priceId || !userId) {
    return json({ error: 'priceId e userId são obrigatórios' }, 400);
  }

  const params = new URLSearchParams({
    'payment_method_types[]':               'card',
    'line_items[0][price]':                 priceId,
    'line_items[0][quantity]':              '1',
    'mode':                                 'subscription',
    'success_url':                          `${context.env.SITE_URL}/user/user.html?checkout=success`,
    'cancel_url':                           `${context.env.SITE_URL}/index.html#planos`,
    'client_reference_id':                  userId,
    'customer_email':                       userEmail || '',
    'metadata[user_id]':                    userId,
    'metadata[price_id]':                   priceId,
    'subscription_data[metadata][user_id]': userId,
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${context.env.STRIPE_SECRET_KEY}`,
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