//
//   HIIT-GYM — SCRIPT.JS

//   Auth e nav delegados no global.js (Supabase).

//   ÍNDICE:
//   1. WELCOME — timer 1s + handlers dos forms
//   2. MAP — funcionalidade do mapa
//   3. ESTADOS 1/2/3 das modalidades
//   4. EQUIPA — carrossel
//   ============================================ */


// ============================================
// 1. WELCOME MODAL
//
// Aparece 1 segundo após a página carregar,
// mas SÓ SE o user não estiver autenticado.
//
// O toggle entre Login ↔ Signup é feito
// 100% em CSS (radio buttons ocultos).
// O JS só trata de: timer, guardar dados, fechar.
// ============================================

function mostrarWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.classList.add('visible');
}

function fecharWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.classList.remove('visible');
}

/** Formulário de LOGIN */
function bindLoginForm() {
  const form = document.getElementById('form-login');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const pass  = form.password.value;
    const erro  = document.getElementById('login-error');

    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: pass });
      if (!error) {
        erro?.classList.add('hidden');
        fecharWelcome();
        await actualizarNav();
        setTimeout(() => { window.location.href = 'user/user.html'; }, 300);
      } else {
        erro?.classList.remove('hidden');
      }
    } catch {
      erro?.classList.remove('hidden');
    }
  });
}

/** Formulário de CRIAR CONTA — usa Supabase */
function bindSignupForm() {
  const form = document.getElementById('form-signup');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const erro = document.getElementById('signup-error');

    const pass = form.password.value;
    if (pass.length < 6) {
      erro.textContent = 'A password deve ter pelo menos 6 caracteres.';
      erro.classList.remove('hidden');
      return;
    }

    const firstName = form.firstName.value.trim();
    const lastName  = form.lastName.value.trim();
    const email     = form.email.value.trim().toLowerCase();

    // Botão de loading
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'A criar conta...'; }

    try {
      // 1. Criar conta no Supabase Auth
      const { data, error: signupError } = await window.supabaseClient.auth.signUp({
        email,
        password: pass,
        options: {
          data: { firstName, lastName }
        }
      });

      if (signupError) throw signupError;

      const userId = data?.user?.id;

      // 2. Criar perfil (o trigger Supabase pode já fazer isto,
      //    mas upsert garante mesmo que o trigger falhe)
      if (userId) {
        try {
          await window.supabaseClient.from('profiles').upsert({
            id:         userId,
            email,                             // guarda email no perfil
            first_name: firstName,
            last_name:  lastName,
            phone:      form.phone?.value.trim() || null,
            age:        parseInt(form.age?.value) || null,
            weight:     form.weight?.value ? parseFloat(form.weight.value) : null,
            address:    form.address?.value.trim() || null,
          }, { onConflict: 'id' });
        } catch { /* o trigger já criou o perfil — falha silenciosa */ }
      }

      erro?.classList.add('hidden');
      fecharWelcome();

      // Se o Supabase pediu confirmação de email, não há sessão imediata
      if (data?.session) {
        // Email de boas-vindas (fire-and-forget — não bloqueia o fluxo)
        if (typeof emailBoasVindas === 'function') {
          emailBoasVindas({ nome: firstName, email });
        }
        await actualizarNav();
        setTimeout(() => { window.location.href = 'user/user.html'; }, 300);
      } else {
        // Email de confirmação enviado — avisar o utilizador
        const msgEl = document.getElementById('signup-error');
        if (msgEl) {
          msgEl.style.color = 'var(--clr-sucesso)';
          msgEl.style.borderColor = 'var(--clr-sucesso)';
          msgEl.textContent = '✓ Conta criada! Verifica o teu email para confirmar.';
          msgEl.classList.remove('hidden');
        }
        // Desabilitar botão de submit
        const btn2 = form.querySelector('button[type="submit"]');
        if (btn2) { btn2.disabled = true; btn2.textContent = 'Email enviado ✓'; }
      }

    } catch (err) {
      erro.textContent = err.message || 'Erro ao criar conta. Tenta novamente.';
      erro.classList.remove('hidden');
      if (btn) { btn.disabled = false; btn.innerHTML = 'Criar Conta <i class="fa-solid fa-arrow-right"></i>'; }
    }
  });
}

/** Fecha ao clicar no backdrop ou no botão ✕ */
function bindWelcomeClose() {
  document.getElementById('welcome-backdrop')?.addEventListener('click', fecharWelcome);
  document.getElementById('welcome-skip')?.addEventListener('click', fecharWelcome);

  // ESC também fecha
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharWelcome();
  });
}

/** Timer de 1s — mostra o welcome se não estiver autenticado.
 *  Usa app:ready (global.js) para garantir que a sessão Supabase
 *  já foi restaurada antes de decidir mostrar o modal.
 */
// Flag para evitar re-bind dos forms em navegações bfcache
let _scriptInited = false;

document.addEventListener('app:ready', () => {

  // Primeira vez: faz bind dos forms e close
  if (!_scriptInited) {
    _scriptInited = true;
    bindLoginForm();
    bindSignupForm();
    bindWelcomeClose();
  }

  // Sempre: fechar o welcome se o utilizador já está autenticado
  if (window.currentUser) {
    fecharWelcome();

    // ── Destaque do plano activo nos cards ──────
    window.supabaseClient
      .from('profiles')
      .select('plan')
      .eq('id', window.currentUser.id)
      .single()
      .then(({ data }) => {
        const plano = data?.plan;
        if (!plano) return;
        document.querySelectorAll('.btn-plano').forEach(btn => {
          if (btn.dataset.plano === plano) {
            btn.textContent = '✓ Plano actual';
            btn.disabled = true;
            btn.closest('.planos-cat')?.classList.add('plano-activo');
          }
        });
      });

    return;
  }

  // Auto-open via URL param (?auth=login ou ?auth=signup)
  const auth = new URLSearchParams(window.location.search).get('auth');
  if (auth === 'login') {
    document.getElementById('mode-login')?.click();
    mostrarWelcome();
    return;
  }
  if (auth === 'signup') {
    document.getElementById('mode-signup')?.click();
    mostrarWelcome();
    return;
  }

  // Sem sessão → welcome após 1s
  setTimeout(mostrarWelcome, 1000);
});

// Fechar o welcome quando o Supabase confirma login (SIGNED_IN)
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      fecharWelcome();
    }
  });
}



// ============================================
// MAP
// ============================================
const mapDetails = document.querySelector('#map');
const mapSummary = document.querySelector('#map summary');
const mapLocal   = document.querySelector('#map .local');

function fecharMapa() {
  mapLocal.classList.add('closing');
  setTimeout(() => {
    mapLocal.classList.remove('closing');
    mapDetails.removeAttribute('open');
  }, 350);
}

mapSummary.addEventListener('click', (e) => {
  if (mapDetails.open) {
    e.preventDefault();
    fecharMapa();
  } else {
    setTimeout(() => {
      mapDetails.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
});

document.addEventListener('click', (e) => {
  if (mapDetails.open && !mapDetails.contains(e.target)) {
    fecharMapa();
  }
});


// ============================================
// REFERÊNCIAS DOM
// ============================================
const imagemEl    = document.getElementById('imagem-principal');
const descEl      = document.getElementById('descricao-overlay');
const escolhas    = document.getElementById('escolhas');
const painel      = document.getElementById('painel');
const todasFatias = document.querySelectorAll('.fatia');

const todosCoachKeys = Object.keys(coaches).slice(0, 8);


// ============================================
// HELPERS
// ============================================
const getIniciais = (n) => n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase();

function renderCoaches(coachKeys) {
  const container = document.getElementById('coaches-row');
  if (!container) return;

  container.innerHTML = coachKeys.map(coachKey => {
    const c = coaches[coachKey];
    const modalidadeKey = c.modalidades[0];

    return `
      <div class="coach-wrapper">
        <a class="coach-avatar"
           href="/modalidades/modalidades.html#mod-${modalidadeKey}"
           aria-label="${c.nome}"
           ${c.avatar ? `style="background-image:url('${c.avatar}')"` : ''}>
          ${c.avatar ? '' : getIniciais(c.nome)}
        </a>
        <span class="coach-tooltip">${c.nome}</span>
      </div>
    `;
  }).join('');
}

function pararVideos() {
  document.querySelectorAll('.fatia-video').forEach(v => {
    v.pause();
    v.currentTime = 0;
  });
}

function limparFatias() {
  todasFatias.forEach(f => f.classList.remove('selecionada'));
  imagemEl.classList.remove('ativo');
}


// ============================================
// ESTADO 1 — Idle
// ============================================
function estado1() {
  pararVideos();
  limparFatias();
  descEl.textContent = '';
  descEl.classList.remove('visivel');
  renderCoaches(todosCoachKeys);
}


// ============================================
// ESTADO 3 — Click
// ============================================
function estado3(key) {
  const d = modalidadesData[key];
  limparFatias();
  imagemEl.classList.add('ativo');

  const fatiaAlvo = imagemEl.querySelector(`.fatia[data-modal="${key}"]`);
  if (fatiaAlvo) {
    fatiaAlvo.classList.add('selecionada');
    const video = fatiaAlvo.querySelector('.fatia-video');
    if (video && video.src) video.play();
  }

  document.getElementById('painel-titulo').textContent = d.titulo;
  document.getElementById('painel-horarios-bloco').innerHTML =
    `<span>${d.dias}</span><span>${d.horas}</span>`;
  document.getElementById('painel-coaches-lista').innerHTML =
    d.coaches.map(k => `<li>${coaches[k].nome}</li>`).join('');

  escolhas.classList.add('hidden');
  painel.classList.remove('hidden');
  descEl.textContent = d.descricao;
  descEl.classList.add('visivel');
  renderCoaches(d.coaches);

  const btnInsc = document.getElementById('painel-inscrever');
  if (btnInsc) btnInsc.href = `modalidades/modalidades.html?modal=${key}#inscricao`;
}


// ============================================
// FECHAR PAINEL
// ============================================
document.getElementById('painel-fechar').addEventListener('click', e => {
  e.preventDefault();
  painel.classList.add('hidden');
  escolhas.classList.remove('hidden');
  estado1();
});


// ============================================
// EVENTOS NOS CARDS
// ============================================
document.querySelectorAll('.modalidade-item').forEach(item => {
  item.addEventListener('click', () => estado3(item.dataset.modal));
});


// ============================================
// EQUIPA — carrossel
// ============================================
const equipaTrack = document.getElementById('equipa-track');

equipaTrack.innerHTML = Object.values(coaches).map(c => `
  <div class="equipa-card"
       ${c.avatar ? `style="background-image:url('${c.avatar}')"` : ''}>
    ${!c.avatar ? `<span class="equipa-card-iniciais">${getIniciais(c.nome)}</span>` : ''}
    <div class="equipa-info">
      <span class="equipa-nome">${c.nome}</span>
      <span class="equipa-tags">${c.modalidades.map(m => modalidadesData[m].titulo).join(' · ')}</span>
    </div>
  </div>
`).join('');

const scrollPorCard = () => equipaTrack.querySelector('.equipa-card')?.offsetWidth + 16 || 300;

document.getElementById('equipa-prev')
  .addEventListener('click', () => equipaTrack.scrollBy({ left: -scrollPorCard(), behavior: 'smooth' }));

document.getElementById('equipa-next')
  .addEventListener('click', () => equipaTrack.scrollBy({ left: scrollPorCard(), behavior: 'smooth' }));


// ============================================
// INIT
// ============================================
estado1();


// ============================================
// PWA — Botão de instalação
// ============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

  const btn      = document.getElementById('pwa-install-btn');
  const fallback = document.getElementById('app-fallback');

  if (btn) {
    btn.classList.remove('hidden');
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        btn.textContent = '✓ App instalada!';
        btn.disabled = true;
      }
      deferredPrompt = null;
    });
  }
  if (fallback) fallback.classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) { btn.textContent = '✓ App instalada!'; btn.disabled = true; }
  deferredPrompt = null;
});

// Se PWA não disponível (iOS/Safari), mostra instruções
window.addEventListener('load', () => {
  const isIos    = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInApp  = window.matchMedia('(display-mode: standalone)').matches;
  const fallback = document.getElementById('app-fallback');
  const btn      = document.getElementById('pwa-install-btn');

  if (isInApp) {
    btn?.classList.add('hidden');
    return;
  }

  if (isIos && !deferredPrompt && fallback) {
    fallback.classList.remove('hidden');
  }
});


// ============================================
// BOTÃO "Área de Membro"
// ============================================
document.getElementById('btn-membro')?.addEventListener('click', e => {
  if (!window.currentUser) {
    e.preventDefault();
    document.getElementById('mode-signup')?.click();
    mostrarWelcome();
  }
});


// ============================================
// STRIPE CHECKOUT
// ============================================
async function iniciarCheckout(priceId, btn) {
  if (!window.currentUser) {
    document.getElementById('mode-signup')?.click();
    mostrarWelcome();
    return;
  }

  const textoOriginal = btn.textContent.trim();
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId:    window.currentUser.id,
        userEmail: window.currentUser.email,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Resposta inválida');
    }

    window.location.href = data.url;

  } catch (err) {
    console.error('[checkout]', err);
    btn.disabled = false;
    btn.textContent = textoOriginal;
    mostrarErroPlanos(err.message);
  }
}

function mostrarErroPlanos(msg) {
  const secao = document.getElementById('planos');
  let erroEl = secao?.querySelector('.planos-erro');
  if (!erroEl) {
    erroEl = document.createElement('p');
    erroEl.className = 'planos-erro form-error';
    secao?.appendChild(erroEl);
  }
  erroEl.textContent = `Erro ao iniciar pagamento: ${msg}`;
  erroEl.classList.remove('hidden');
  setTimeout(() => erroEl.classList.add('hidden'), 5000);
}

document.querySelectorAll('.btn-plano').forEach(btn => {
  btn.addEventListener('click', () => iniciarCheckout(btn.dataset.priceId, btn));
});
