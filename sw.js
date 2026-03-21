// ============================================
// HIIT-GYM — SERVICE WORKER
// Estratégia simples e segura:
// • JS → NUNCA em cache (sempre network)
// • HTML → network-first
// • CSS → stale-while-revalidate  
// • Imagens/fontes → cache-first
// • Supabase/APIs → nunca interceptado
// ============================================

const CACHE = 'hiitgym-v5';

const STATIC = [
  '/style.css',
  '/src/logo/logo_def1.svg',
  '/src/logo/favicon.svg',
  '/manifest.json',
];


// ── SKIP WAITING ──────────────────────────────
// Permite forçar activação imediata via postMessage
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
// ── INSTALL ───────────────────────────────────
self.addEventListener('install', e => {
  // skipWaiting IMEDIATO — nunca fica em "Wait"
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(STATIC.map(url => c.add(url)))
    )
  );
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

  // Nunca interceptar Supabase ou APIs externas
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
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS → stale-while-revalidate
  if (url.pathname.match(/\.css(\?.*)?$/)) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fresh = fetch(request).then(res => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Imagens e fontes → cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?)(\?.*)?$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Tudo o resto → network only
});
