// ============================================
// HIIT GYM — SERVICE WORKER v4
// Atualiza CACHE_NAME a cada deploy relevante
// ============================================

const CACHE_NAME = 'hiitgym-v6';

// Assets estáticos: CSS, HTML, imagens, manifesto.
// JS está FORA desta lista — serve sempre da rede.
// Razão: JS antigo em cache causava "user.html sem dados"
// após deploy. Network Only garante deploy imediato.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/chat.css',
  '/supabase.js',
  '/manifest.json',
  '/user/user.html',
  '/user/user.css',
  '/blog/blog.html',
  '/blog/blog.css',
  '/modalidades/modalidades.html',
  '/modalidades/modalidades.css',
  '/admin/admin.html',
  '/admin/admin.css',
  '/src/logo/logo_def1.svg',
  '/src/logo/favicon.svg',
];


// ── INSTALL ───────────────────────────────────
// Pré-cache dos assets estáticos.
// allSettled: um 404 não bloqueia a instalação.
// skipWaiting: activa imediatamente sem esperar
// que o utilizador feche todas as tabs.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url))
      ))
      .then(() => self.skipWaiting())
  );
});


// ── ACTIVATE ──────────────────────────────────
// Apaga todos os caches de versões anteriores.
// clients.claim() toma controlo imediato de todas
// as tabs abertas — sem reload.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});


// ── MESSAGE ───────────────────────────────────
// global.js chama reg.waiting.postMessage('SKIP_WAITING')
// quando detecta um SW em espera.
// Aceita string (formato actual do global.js) e
// objecto com type (formato alternativo).
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING' || e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// ── FETCH ─────────────────────────────────────
// JS            → Network Only  (nunca em cache)
// HTML          → Network First (fresco, fallback ao cache)
// CSS / imagens → Cache First   (rápido, actualiza em background)
// Externo       → não interceptado
// API           → não interceptado
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Pedidos externos (Supabase, fonts, CDN)
  if (url.origin !== self.location.origin) return;

  // API e Cloudflare Functions — nunca interceptar
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/functions/')) return;

  // ── JS — Network Only ─────────────────────
  if (url.pathname.endsWith('.js')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ── HTML — Network First ──────────────────
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── CSS / imagens / fontes — Cache First ──
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(res => {
          cache.put(e.request, res.clone());
          return res;
        });
        return cached ?? networkFetch;
      })
    )
  );
});
