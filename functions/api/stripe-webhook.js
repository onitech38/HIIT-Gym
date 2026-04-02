// ============================================
// functions/api/stripe-webhook.js
// ============================================

const PRICE_TO_PLAN = {
  'price_1TDlVH77sfEVvt5IUrImnFp2': 'basico',
  'price_1TDlVh77sfEVvt5INOWoW8D9': 'standard',
  'price_1TDlWC77sfEVvt5It1l75JNO': 'premium',
};

export async function onRequestPost(context) {
  // Verificar variáveis de ambiente
  if (!context.env.STRIPE_WEBHOOK_SECRET || !context.env.STRIPE_SECRET_KEY) {
    console.error('[webhook] STRIPE vars em falta');
    return new Response('Webhook não configurado', { status: 500 });
  }
  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_KEY) {
    console.error('[webhook] SUPABASE vars em falta');
    return new Response('Supabase não configurado', { status: 500 });
  }

  const body      = await context.request.text();
  const signature = context.request.headers.get('stripe-signature');

  const valid = await verifyStripeSignature(body, signature, context.env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error('[webhook] Assinatura inválida');
    return new Response('Assinatura inválida', { status: 400 });
  }

  const event = JSON.parse(body);
  console.log('[webhook] Evento recebido:', event.type);

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata?.user_id || session.client_reference_id;

        console.log('[webhook] userId:', userId);
        console.log('[webhook] subscriptionId:', session.subscription);

        if (!userId) {
          console.error('[webhook] userId em falta na sessão');
          break;
        }

        const subId   = session.subscription;
        const priceId = await getSubscriptionPriceId(subId, context.env.STRIPE_SECRET_KEY);

        console.log('[webhook] priceId obtido:', priceId);

        const plan = PRICE_TO_PLAN[priceId];

        if (!plan) {
          console.error('[webhook] priceId não reconhecido no mapa:', priceId);
          console.log('[webhook] Mapa actual:', JSON.stringify(PRICE_TO_PLAN));
          break;
        }

        console.log('[webhook] A actualizar plano:', plan, 'para userId:', userId);
        await updatePlan(userId, plan, subId, context.env);
        break;
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId];
        const active  = sub.status === 'active' || sub.status === 'trialing';

        console.log('[webhook] subscription.updated — userId:', userId, 'plan:', plan, 'active:', active);

        if (active && plan) {
          await updatePlan(userId, plan, sub.id, context.env);
        } else if (!active) {
          await updatePlan(userId, null, sub.id, context.env);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        console.log('[webhook] subscription.deleted — userId:', userId);
        await updatePlan(userId, null, null, context.env);
        break;
      }
    }
  } catch (err) {
    console.error('[webhook] Erro inesperado:', err.message);
    return new Response('Erro interno', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}


async function getSubscriptionPriceId(subId, secretKey) {
  if (!subId) return null;
  const res  = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` },
  });
  const data = await res.json();
  console.log('[webhook] Stripe subscription status:', res.status);
  return data?.items?.data?.[0]?.price?.id || null;
}

async function updatePlan(userId, plan, stripeSubId, env) {
  const payload = {
    plan:            plan,
    stripe_sub_id:   stripeSubId || null,
    plan_updated_at: new Date().toISOString(),
  };

  console.log('[webhook] PATCH Supabase — payload:', JSON.stringify(payload));
  console.log('[webhook] Supabase URL:', env.SUPABASE_URL);

  const res = await fetch(
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

  const resText = await res.text();
  console.log('[webhook] Supabase resposta:', res.status, resText || '(vazio)');

  if (!res.ok) {
    console.error('[webhook] Supabase PATCH falhou:', res.status, resText);
  } else {
    console.log('[webhook] Plano actualizado com sucesso!');
  }
}

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
