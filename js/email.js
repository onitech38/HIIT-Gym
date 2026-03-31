// ============================================
// js/email.js — Helper de envio de email
// Carregar em: index.html, modalidades.html,
//              admin/admin.html
// ============================================

const ADMIN_EMAIL = 'onitech38@gmail.com';
const SITE_URL    = 'https://hiit-gym.pages.dev';

async function enviarEmail({ to, subject, html }) {
  try {
    const res = await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to, subject, html }),
    });
    const data = await res.json();
    if (!res.ok) console.warn('[email] Erro:', data.error);
    return res.ok;
  } catch (err) {
    console.warn('[email] Falha:', err);
    return false;
  }
}

function baseHtml(conteudo) {
  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{margin:0;padding:0;background:#120D0F;font-family:'Helvetica Neue',Arial,sans-serif;}
.wrap{max-width:560px;margin:0 auto;padding:2rem 1.5rem;}
.logo{text-align:center;margin-bottom:2rem;}
.logo span{font-size:1.4rem;font-weight:700;color:#fba002;letter-spacing:.1em;text-transform:uppercase;}
.card{background:#1a1214;border:1px solid rgba(251,160,2,0.2);border-radius:4px 12px 4px 18px;padding:2rem;}
h2{color:#fffafa;font-size:1.2rem;margin:0 0 1rem;letter-spacing:.05em;}
p{color:#B9CFD4;font-size:.9rem;line-height:1.7;margin:0 0 .75rem;}
.badge{display:inline-block;background:rgba(251,160,2,0.15);border:1px solid rgba(251,160,2,0.3);color:#fba002;font-size:.78rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.3rem .8rem;border-radius:100px;margin:.5rem 0;}
.btn{display:inline-block;background:#fba002;color:#120D0F;font-size:.85rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.75rem 1.5rem;border-radius:4px 12px 4px 18px;text-decoration:none;margin-top:1.25rem;}
.aviso{color:#ff6b6b;}
.footer{text-align:center;margin-top:2rem;font-size:.7rem;color:#B9CFD4;opacity:.4;}
hr{border:none;border-top:1px solid rgba(251,160,2,0.1);margin:1.25rem 0;}
</style>
</head>
<body>
<div class="wrap">
<div class="logo"><span>HIIT·GYM</span></div>
<div class="card">${conteudo}</div>
<p class="footer">© ${new Date().getFullYear()} HIIT-Gym Montijo · Todos os direitos reservados.</p>
</div>
</body>
</html>`;
}

// ── 1. Boas-vindas ao novo membro ─────────────
async function emailBoasVindas({ nome, email }) {
  return enviarEmail({
    to:      email,
    subject: 'Bem-vindo à HIIT-Gym Montijo! 💪',
    html: baseHtml(`
      <h2>Olá, ${nome}! 👋</h2>
      <p>A tua conta foi criada com sucesso. Bem-vindo à família HIIT-Gym Montijo!</p>
      <hr>
      <p>Já podes explorar as nossas <strong>modalidades</strong>, registar os teus <strong>treinos</strong> e gerir o teu <strong>perfil</strong>.</p>
      <p>Se ainda não escolheste um plano, descobre o que temos para ti:</p>
      <a href="${SITE_URL}/index.html#planos" class="btn">Ver Planos</a>
      <hr>
      <p>Qualquer dúvida, responde a este email ou contacta-nos.</p>
    `),
  });
}

// ── 2. Notificação ao admin — nova inscrição ──
async function emailAdminNovaInscricao({ nomeMembro, modalidade, temSaude }) {
  return enviarEmail({
    to:      ADMIN_EMAIL,
    subject: `[HIIT-Gym] Nova inscrição pendente — ${modalidade}`,
    html: baseHtml(`
      <h2>Nova inscrição pendente</h2>
      <p>Um membro submeteu uma inscrição que aguarda confirmação.</p>
      <hr>
      <p><strong>Membro:</strong> ${nomeMembro}</p>
      <p><strong>Modalidade:</strong> <span class="badge">${modalidade}</span></p>
      ${temSaude ? `<p class="aviso"><strong>⚠️ Atenção:</strong> O membro indicou informação de saúde relevante.</p>` : ''}
      <a href="${SITE_URL}/admin/admin.html" class="btn">Abrir Painel Admin</a>
    `),
  });
}

// ── 3. Confirmação ao membro — inscrição aceite ─
async function emailInscricaoConfirmada({ email, nomeMembro, modalidade }) {
  return enviarEmail({
    to:      email,
    subject: `Inscrição confirmada — ${modalidade} 🎉`,
    html: baseHtml(`
      <h2>Inscrição confirmada! 🎉</h2>
      <p>Olá, ${nomeMembro}! A tua inscrição foi aceite pela equipa HIIT-Gym.</p>
      <hr>
      <p><strong>Modalidade:</strong> <span class="badge">${modalidade}</span></p>
      <p>Já podes começar a frequentar as aulas. Consulta os horários na tua área de membro.</p>
      <a href="${SITE_URL}/user/user.html" class="btn">Ir para o meu perfil</a>
      <hr>
      <p>Até breve na academia! 💪</p>
    `),
  });
}

window.emailBoasVindas          = emailBoasVindas;
window.emailAdminNovaInscricao  = emailAdminNovaInscricao;
window.emailInscricaoConfirmada = emailInscricaoConfirmada;
