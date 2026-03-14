// ============================================
// HIIT GYM — SERVICE WORKER v3.0
// Atualiza CACHE_NAME a cada deploy relevante
// ============================================

const CACHE_NAME = 'hiitgym-v3.1';

// Ficheiros a guardar em cache na instalação
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data.js',
  '/supabase.js',
  '/global.js',
  '/chat.js',
  '/chat.css',
  '/manifest.json',
  '/user/user.html',
  '/user/user.css',
  '/user/user.js',
  '/blog/blog.html',
  '/blog/blog.css',
  '/blog/blog.js',
  '/modalidades/modalidades.html',
  '/modalidades/modalidades.css',
  '/modalidades/modalidades.js',
  '/src/logo/logo_def1.svg',
  '/src/logo/favicon.svg',
];


// ── INSTALL ───────────────────────────────────
// Guarda assets essenciais; erros individuais não bloqueiam
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});


// ── ACTIVATE ──────────────────────────────────
// Apaga caches de versões anteriores
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});


// ── FETCH ─────────────────────────────────────
// HTML   → Network First  (sempre fresco, fallback ao cache)
// CSS/JS → Stale-While-Revalidate
// Resto  → Cache First
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Ignora pedidos externos
  if (url.origin !== self.location.origin) return;

  // HTML — Network First
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

  // CSS / JS — Stale-While-Revalidate
  if (url.pathname.match(/\.(css|js)(\?.*)?$/)) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Imagens / fontes / vídeos — Cache First
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});
