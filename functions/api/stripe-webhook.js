// ============================================
// functions/api/stripe-webhook.js
// Recebe eventos do Stripe e actualiza
// profiles.plan no Supabase.
//
// Eventos tratados:
//   checkout.session.completed  → activa plano
//   customer.subscription.updated → muda plano
//   customer.subscription.deleted → cancela plano
// ============================================

// Mapa Price ID → nome do plano
// Actualizar com os IDs reais de produção quando chegar a hora
const PRICE_TO_PLAN = {
  'price_1TDlVh77sfEVvt5IUrlmFp2': 'basico',
  'price_1TDlVh77sfEVvt5INOWoWBD9': 'standard',
  'price_1TDlMC77sfEVvt5Il1i75JN0': 'premium',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    return new Response('Webhook não configurado', { status: 500 });
  }

  const body      = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Verificar assinatura do webhook
  const valid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
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

        // Buscar o priceId da subscrição
        const subId   = session.subscription;
        const priceId = await getSubscriptionPriceId(subId, env.STRIPE_SECRET_KEY);
        const plan    = PRICE_TO_PLAN[priceId] || 'basico';

        await updatePlan(userId, plan, subId, env);
        break;
      }

      // ── Subscrição actualizada (upgrade/downgrade) ─
      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const userId  = sub.metadata?.user_id;
        if (!userId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId] || 'basico';
        const active  = sub.status === 'active' || sub.status === 'trialing';

        await updatePlan(userId, active ? plan : null, sub.id, env);
        break;
      }

      // ── Subscrição cancelada ───────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await updatePlan(userId, null, null, env);
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
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_KEY; // service_role — bypassa RLS

  const payload = {
    plan:              plan,
    stripe_sub_id:     stripeSubId || null,
    plan_updated_at:   new Date().toISOString(),
  };

  await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
    {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(payload),
    }
  );
}

// Verificação HMAC-SHA256 da assinatura Stripe
// compatível com Cloudflare Workers (Web Crypto API)
async function verifyStripeSignature(payload, sigHeader, secret) {
  try {
    if (!sigHeader) return false;

    // Extrair timestamp e v1 do header
    const parts     = sigHeader.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    // Rejeitar eventos com mais de 5 minutos
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
