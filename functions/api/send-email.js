// ============================================
// functions/api/send-email.js
// Envia emails via Resend REST API.
// Sem dependências npm — fetch nativo.
// Requer: RESEND_API_KEY no Cloudflare env vars
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
  if (!context.env.RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY não configurada' }, 500);
  }

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'Body inválido' }, 400); }

  const { to, subject, html } = body;
  if (!to || !subject || !html) {
    return json({ error: 'to, subject e html são obrigatórios' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'HIIT-Gym <onboarding@resend.dev>',
      to:      Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return json({ error: data?.message || 'Erro Resend' }, res.status);
  }

  return json({ success: true, id: data.id }, 200);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
