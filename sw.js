// ============================================
// HIIT-GYM — SERVICE WORKER
// Estratégia minimalista e segura:
// • Sem cache de ficheiros no install
//   (evita crashes por ficheiros inexistentes)
// • JS → sempre network
// • HTML → network-first
// • CSS/imagens → cache-first com fallback
// • Supabase/APIs → nunca interceptado
// ============================================

const CACHE = 'hiitgym-v5';

// ── SKIP WAITING ──────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// ── INSTALL ───────────────────────────────────
// Sem addAll — evita crashes por ficheiros em falta
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Apenas GET
  if (request.method !== 'GET') return;

  // Nunca interceptar origens externas (Supabase, CDNs, etc.)
  if (url.origin !== self.location.origin) return;

  // Nunca interceptar JS — sempre network
  if (url.pathname.match(/\.js(\?.*)?$/)) return;

  // Nunca interceptar rotas de API
  if (url.pathname.startsWith('/api/')) return;

  // HTML → network-first
  if (request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS e imagens → cache-first
  if (url.pathname.match(/\.(css|png|jpg|jpeg|svg|webp|woff2?)(\?.*)?$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fresh = fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        });
        return cached || fresh;
      })
    );
    return;
  }
});
