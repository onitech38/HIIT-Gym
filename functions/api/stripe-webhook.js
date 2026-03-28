// ============================================
// functions/api/stripe-webhook.js
// Recebe eventos do Stripe e actualiza
// profiles.plan no Supabase.
//
// Eventos tratados:
//   checkout.session.completed       → activa plano + guarda customer_id
//   customer.subscription.updated    → muda plano (com fallback por customer_id)
//   customer.subscription.deleted    → cancela plano (com fallback por customer_id)
// ============================================

const PRICE_TO_PLAN = {
  'price_1TDlVH77sfEVvt5IUrlmnFp2': 'basico',
  'price_1TDlVh77sfEVvt5INOWoW8D9': 'standard',
  'price_1TDlWC77sfEVvt5It1l75JNO': 'premium',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    return new Response('Webhook não configurado', { status: 500 });
  }

  const body      = await request.text();
  const signature = request.headers.get('stripe-signature');

  const valid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Assinatura inválida', { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.type) {

      // ── Checkout concluído ─────────────────
      case 'checkout.session.completed': {
        const session    = event.data.object;
        const userId     = session.metadata?.user_id || session.client_reference_id;
        const customerId = session.customer;
        if (!userId) break;

        const subId   = session.subscription;
        const priceId = await getSubscriptionPriceId(subId, env.STRIPE_SECRET_KEY);
        const plan    = PRICE_TO_PLAN[priceId] || 'basico';

        // Guarda customer_id para fallback nos eventos futuros
        await updatePlan(userId, plan, subId, customerId, env);
        break;
      }

      // ── Subscrição actualizada ─────────────
      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        // Tenta userId via metadata; fallback: procura por stripe_customer_id
        const userId = sub.metadata?.user_id
          || await getUserIdByCustomer(sub.customer, env);
        if (!userId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId] || 'basico';
        const active  = sub.status === 'active' || sub.status === 'trialing';

        await updatePlan(userId, active ? plan : null, sub.id, sub.customer, env);
        break;
      }

      // ── Subscrição cancelada ───────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id
          || await getUserIdByCustomer(sub.customer, env);
        if (!userId) break;

        await updatePlan(userId, null, null, sub.customer, env);
        break;
      }
    }
  } catch (err) {
    console.error('[webhook] Erro:', err);
    return new Response('Erro interno', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}


// ── Helpers ───────────────────────────────────

async function getSubscriptionPriceId(subId, secretKey) {
  if (!subId) return null;
  const res  = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` },
  });
  const data = await res.json();
  return data?.items?.data?.[0]?.price?.id || null;
}

// Fallback: encontra userId no Supabase pelo stripe_customer_id
async function getUserIdByCustomer(customerId, env) {
  if (!customerId) return null;
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=id&limit=1`,
      {
        headers: {
          'apikey':        env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const data = await res.json();
    return data?.[0]?.id || null;
  } catch {
    return null;
  }
}

async function updatePlan(userId, plan, stripeSubId, stripeCustomerId, env) {
  const payload = {
    plan:                plan,
    stripe_sub_id:       stripeSubId      || null,
    stripe_customer_id:  stripeCustomerId || null,
    plan_updated_at:     new Date().toISOString(),
  };

  await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(payload),
    }
  );
}

// Verificação HMAC-SHA256 — Web Crypto API (Cloudflare Workers)
async function verifyStripeSignature(payload, sigHeader, secret) {
  try {
    if (!sigHeader) return false;

    const parts = sigHeader.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedPayload)
    );

    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computed === signature;
  } catch {
    return false;
  }
}