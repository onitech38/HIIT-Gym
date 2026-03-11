/* ============================================
   INSCRICAO.JS
   
   FLUXO:
   1. Lê ?modal=musculacao da URL
   2. Verifica se já está autenticado
      → Sim: salta o Step 1 (auth) e vai directo ao Step 2
      → Não: mostra Step 1 (login ou signup)
   3. Step 2 — dados do user + formulário de saúde
   4. Submissão → insere em `enrollments` no Supabase
   5. Step 3 — confirmação de sucesso
   ============================================ */

// ── Parâmetros da URL ─────────────────────────
const params     = new URLSearchParams(window.location.search);
const modalKey   = params.get('modal') || 'musculacao';
const modalData  = typeof modalidadesData !== 'undefined' ? modalidadesData[modalKey] : null;
const modalTitulo = modalData?.titulo || modalKey;

// ── Estado global ─────────────────────────────
let currentUser    = null;
let currentProfile = null;


// ============================================
// INIT — ponto de entrada
// ============================================
window.addEventListener('load', async () => {

  // Preenche títulos com o nome da modalidade
  preencherTitulosModalidade();

  // Verifica sessão Supabase
  const { data: { session } } = await window.supabase.auth.getSession();

  if (session) {
    // Já autenticado → carrega perfil e salta para Step 2
    currentUser = session.user;
    await carregarPerfil();
    actualizarNav();
    irParaStep2();
  } else {
    // Não autenticado → mostra Step 1
    document.body.classList.remove('loading');
    activarStep(1);
  }

  // Listeners
  bindTabsAuth();
  bindFormLogin();
  bindFormSignup();
  bindFormSaude();
  bindTogglesSaude();
});


// ============================================
// MODALIDADE — preenche textos dinâmicos
// ============================================
function preencherTitulosModalidade() {
  // Step 1
  const eyebrow1 = document.getElementById('modalidade-eyebrow');
  const titulo1  = document.getElementById('modalidade-titulo');
  if (eyebrow1) eyebrow1.textContent = 'Inscrição em';
  if (titulo1)  titulo1.textContent  = modalTitulo;

  // Step 2
  const eyebrow2 = document.getElementById('saude-eyebrow');
  const titulo2  = document.getElementById('saude-titulo');
  if (eyebrow2) eyebrow2.textContent = 'Inscrição em';
  if (titulo2)  titulo2.textContent  = modalTitulo;

  // Step 3
  const sucMod = document.getElementById('sucesso-modalidade');
  if (sucMod) sucMod.textContent = modalTitulo;
}


// ============================================
// NAV — actualiza avatar após autenticação
// ============================================
function actualizarNav() {
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navAvatar = document.getElementById('nav-avatar');
  const navImg    = document.getElementById('nav-avatar-img');

  if (!currentUser) return;

  navLogin?.classList.add('hidden');
  navSignup?.classList.add('hidden');
  navAvatar?.classList.remove('hidden');

  if (navImg && currentProfile) {
    if (currentProfile.avatar_url) {
      navImg.style.backgroundImage = `url('${currentProfile.avatar_url}')`;
      navImg.textContent = '';
    } else {
      const iniciais = (
        (currentProfile.first_name?.[0] || '') +
        (currentProfile.last_name?.[0]  || '')
      ).toUpperCase();
      navImg.textContent = iniciais;
      navImg.style.backgroundImage = '';
    }
  }
}


// ============================================
// PERFIL — carrega dados de `profiles`
// ============================================
async function carregarPerfil() {
  if (!currentUser) return;

  const { data, error } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!error && data) currentProfile = data;
}


// ============================================
// STEPS — navegação entre passos
// ============================================
function activarStep(num) {
  // Esconde todos
  document.querySelectorAll('.insc-step').forEach(s => s.classList.add('hidden'));

  // Mostra o correcto
  const map = { 1: 'step-auth', 2: 'step-saude', 3: 'step-sucesso' };
  document.getElementById(map[num])?.classList.remove('hidden');

  // Actualiza barra de progresso
  document.querySelectorAll('.progress-step').forEach(el => {
    const n = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (n === num)  el.classList.add('active');
    if (n < num)    el.classList.add('done');
  });
}

function irParaStep2() {
  preencherDadosUser();
  activarStep(2);
  document.body.classList.remove('loading');
}


// ============================================
// STEP 1 — TABS (login ↔ signup)
// ============================================
function bindTabsAuth() {
  const tabs      = document.querySelectorAll('.auth-tab-btn');
  const formLogin  = document.getElementById('insc-form-login');
  const formSignup = document.getElementById('insc-form-signup');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (tab.dataset.tab === 'login') {
        formLogin?.classList.remove('hidden');
        formSignup?.classList.add('hidden');
      } else {
        formSignup?.classList.remove('hidden');
        formLogin?.classList.add('hidden');
      }
    });
  });
}


// ============================================
// STEP 1 — LOGIN
// ============================================
function bindFormLogin() {
  const form = document.getElementById('insc-form-login');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const erro = document.getElementById('login-error');
    erro.classList.add('hidden');

    const btn = form.querySelector('button[type="submit"]');
    setLoading(btn, true);

    const { data, error } = await window.supabase.auth.signInWithPassword({
      email:    form.email.value.trim().toLowerCase(),
      password: form.password.value,
    });

    setLoading(btn, false);

    if (error) {
      erro.classList.remove('hidden');
      return;
    }

    currentUser = data.user;
    await carregarPerfil();
    actualizarNav();
    irParaStep2();
  });
}


// ============================================
// STEP 1 — SIGNUP
// ============================================
function bindFormSignup() {
  const form = document.getElementById('insc-form-signup');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const erro = document.getElementById('signup-error');
    erro.classList.add('hidden');

    if (form.password.value.length < 6) {
      mostrarErro(erro, 'A password deve ter pelo menos 6 caracteres.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    setLoading(btn, true);

    // 1. Cria conta Auth
    const { data, error } = await window.supabase.auth.signUp({
      email:    form.email.value.trim().toLowerCase(),
      password: form.password.value,
      options: {
        data: {
          first_name: form.firstName.value.trim(),
          last_name:  form.lastName.value.trim(),
          phone:      form.phone.value.trim(),
          age:        parseInt(form.age.value) || null,
          weight:     form.weight.value ? parseFloat(form.weight.value) : null,
        }
      }
    });

    setLoading(btn, false);

    if (error) {
      mostrarErro(erro, traduzirErroAuth(error.message));
      return;
    }

    // 2. Se confirmação de email activa → avisa
    if (data.user && !data.session) {
      mostrarErro(erro, '✉️ Verifica o teu email para confirmar a conta e volta aqui para continuar.', 'info');
      return;
    }

    currentUser = data.user;
    await carregarPerfil();
    actualizarNav();
    irParaStep2();
  });
}


// ============================================
// STEP 2 — PREENCHE DADOS DO UTILIZADOR
// ============================================
function preencherDadosUser() {
  const grid = document.getElementById('dados-grid');
  if (!grid || !currentProfile) return;

  const campos = [
    { label: 'Nome',    valor: `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim() },
    { label: 'Email',   valor: currentUser?.email || '—' },
    { label: 'Telefone',valor: currentProfile.phone || '—' },
    { label: 'Idade',   valor: currentProfile.age    ? `${currentProfile.age} anos` : null },
    { label: 'Peso',    valor: currentProfile.weight ? `${currentProfile.weight} kg` : null },
  ].filter(c => c.valor);

  grid.innerHTML = campos.map(c => `
    <div class="dado-item">
      <span class="dado-label">${c.label}</span>
      <span class="dado-valor">${c.valor}</span>
    </div>
  `).join('');

  // Mostra campos em falta (idade/peso)
  const falta = document.getElementById('dados-falta');
  const idadeWrap = document.getElementById('campo-idade-wrap');
  const pesoWrap  = document.getElementById('campo-peso-wrap');
  let mostrarFalta = false;

  if (!currentProfile.age) {
    idadeWrap?.classList.remove('hidden');
    mostrarFalta = true;
  } else {
    idadeWrap?.classList.add('hidden');
  }

  if (!currentProfile.weight) {
    pesoWrap?.classList.remove('hidden');
    mostrarFalta = true;
  } else {
    pesoWrap?.classList.add('hidden');
  }

  if (mostrarFalta) falta?.classList.remove('hidden');
}


// ============================================
// STEP 2 — TOGGLES DE SAÚDE (mostrar/esconder textareas)
// ============================================
function bindTogglesSaude() {
  // Problema de saúde → detalhe
  const chkSaude  = document.getElementById('chk-saude');
  const detalhe   = document.getElementById('campo-saude-detalhe');
  chkSaude?.addEventListener('change', () => {
    detalhe?.classList.toggle('hidden', !chkSaude.checked);
  });

  // Recomendação médica → notas
  const chkMedico = document.getElementById('chk-medico');
  const medDetalhe = document.getElementById('campo-medico-detalhe');
  chkMedico?.addEventListener('change', () => {
    medDetalhe?.classList.toggle('hidden', !chkMedico.checked);
  });
}


// ============================================
// STEP 2 — SUBMISSÃO DO FORMULÁRIO DE SAÚDE
// ============================================
function bindFormSaude() {
  const form = document.getElementById('form-saude');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const erro = document.getElementById('saude-error');
    erro.classList.add('hidden');

    const btn = form.querySelector('button[type="submit"]');
    setLoading(btn, true);

    // 1. Actualiza dados em falta no perfil (idade/peso)
    const updates = {};
    const novaIdade = form.age?.value;
    const novoPeso  = form.weight?.value;

    if (novaIdade && !currentProfile?.age)    updates.age    = parseInt(novaIdade);
    if (novoPeso  && !currentProfile?.weight) updates.weight = parseFloat(novoPeso);

    if (Object.keys(updates).length > 0) {
      await window.supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);
    }

    // 2. Verifica se já está inscrito nesta modalidade
    const { data: existing } = await window.supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', currentUser.id)
      .eq('modality', modalKey)
      .maybeSingle();

    if (existing && existing.status === 'active') {
      mostrarErro(erro, 'Já estás inscrito nesta modalidade.');
      setLoading(btn, false);
      return;
    }

    // 3. Insere (ou re-activa) a inscrição com dados de saúde
    const enrollData = {
      user_id:        currentUser.id,
      modality:       modalKey,
      status:         'pending',          // equipa confirma depois
      has_health:     form.has_health?.checked  || false,
      health_notes:   form.health_notes?.value.trim() || null,
      physio:         form.physio?.checked       || false,
      medical_ref:    form.medical_ref?.checked  || false,
      medical_notes:  form.medical_notes?.value.trim() || null,
    };

    let dbError;

    if (existing) {
      // Re-activar inscrição cancelada
      const { error } = await window.supabase
        .from('enrollments')
        .update({ ...enrollData, status: 'pending' })
        .eq('id', existing.id);
      dbError = error;
    } else {
      const { error } = await window.supabase
        .from('enrollments')
        .insert(enrollData);
      dbError = error;
    }

    setLoading(btn, false);

    if (dbError) {
      mostrarErro(erro, 'Erro ao guardar inscrição. Tenta novamente.');
      console.error(dbError);
      return;
    }

    // 4. Sucesso!
    activarStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


// ============================================
// HELPERS
// ============================================

/** Mostra estado de loading no botão */
function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
  btn.innerHTML = isLoading
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Aguarda...'
    : btn.dataset.originalText;
}

/** Mostra mensagem de erro (ou info) */
function mostrarErro(el, msg, tipo = 'erro') {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.style.borderLeftColor = tipo === 'info' ? 'var(--clr-4)' : '';
  el.style.color            = tipo === 'info' ? 'var(--clr-2)' : '';
}

/** Traduz mensagens de erro do Supabase para português */
function traduzirErroAuth(msg) {
  if (msg.includes('already registered')) return 'Este email já tem conta. Faz login em vez disso.';
  if (msg.includes('Invalid login'))       return 'Email ou password incorretos.';
  if (msg.includes('Email not confirmed')) return '✉️ Confirma o teu email antes de entrar.';
  if (msg.includes('Password'))            return 'A password deve ter pelo menos 6 caracteres.';
  return 'Ocorreu um erro. Tenta novamente.';
}