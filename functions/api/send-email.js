import { Resend } from 'resend';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { to, subject, message } = await request.json();

      // ✅ API key vem do Cloudflare Secrets
      // ⚠️ Pedir ao utilizador para definir RESEND_API_KEY = re_xxxxxxxxx
      const resend = new Resend(env.RESEND_API_KEY);

      const data = await resend.emails.send({
        from: 'onboarding@resend.dev', // sender verificado no Resend
        to,
        subject,
        html: `<p>${message}</p>`
      });

      return Response.json({ success: true, data });
    } catch (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  }
};