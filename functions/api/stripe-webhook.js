// ============================================
// functions/api/stripe-webhook.js
// Recebe eventos do Stripe e actualiza
// profiles.plan no Supabase.
//
// Eventos tratados:
//   checkout.session.completed     → activa plano
//   customer.subscription.updated  → muda plano
//   customer.subscription.deleted  → cancela plano
// ============================================

// Mapa Price ID → nome do plano (IDs confirmados no Stripe Dashboard)
const PRICE_TO_PLAN = {
  'price_1TDlVH77sfEVvt5IUrImnFp2': 'basico',
  'price_1TDlVh77sfEVvt5INOWoW8D9': 'standard',
  'price_1TDlWC77sfEVvt5It1l75JNO': 'premium',
};

export async function onRequestPost(context) {
  // NUNCA destructurar context — aceder sempre via context.env / context.request
  if (!context.env.STRIPE_WEBHOOK_SECRET || !context.env.STRIPE_SECRET_KEY) {
    return new Response('Webhook não configurado', { status: 500 });
  }

  const body      = await context.request.text();
  const signature = context.request.headers.get('stripe-signature');

  const valid = await verifyStripeSignature(body, signature, context.env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Assinatura inválida', { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.type) {

      // ── Checkout concluído ─────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata?.user_id || session.client_reference_id;
        if (!userId) break;

        const subId   = session.subscription;
        const priceId = await getSubscriptionPriceId(subId, context.env.STRIPE_SECRET_KEY);
        const plan    = PRICE_TO_PLAN[priceId];

        if (!plan) {
          console.error('[webhook] priceId não reconhecido:', priceId);
          break;
        }

        await updatePlan(userId, plan, subId, context.env);
        break;
      }

      // ── Subscrição actualizada (upgrade/downgrade) ─
      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId];
        const active  = sub.status === 'active' || sub.status === 'trialing';

        if (active && plan) {
          await updatePlan(userId, plan, sub.id, context.env);
        } else if (!active) {
          await updatePlan(userId, null, sub.id, context.env);
        }
        break;
      }

      // ── Subscrição cancelada ───────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await updatePlan(userId, null, null, context.env);
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

async function updatePlan(userId, plan, stripeSubId, env) {
  const payload = {
    plan:            plan,
    stripe_sub_id:   stripeSubId || null,
    plan_updated_at: new Date().toISOString(),
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

// Verificação HMAC-SHA256 da assinatura Stripe
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
