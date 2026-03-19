// ============================================
// HIIT-GYM — SERVICE WORKER (FINAL)
// Seguro para Supabase + PWA
// ============================================

const CACHE_NAME = 'hiitgym-static-v2';

// Apenas assets realmente estáticos
const STATIC_ASSETS = [
  '/',
  '/index.html',

  // CSS
  '/style.css',
  '/modalidades/modalidades.css',
  '/blog/blog.css',
  '/user/user.css',

  // HTML principais (visual)
  '/modalidades/modalidades.html',
  '/blog/blog.html',
  '/user/user.html',

  // Assets
  '/src/logo/logo_def1.svg',
  '/src/logo/favicon.svg',

  // Manifest
  '/manifest.json',
];


// ─────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});


// ─────────────────────────────────────────────
// ACTIVATE
// ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME)
              .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});


// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Apenas GET
  if (req.method !== 'GET') return;

  // ❌ Nunca tocar em Supabase
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/rest') ||
    url.pathname.startsWith('/storage')
  ) {
    return;
  }

  // ❌ Nunca tocar em APIs externas (QR, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML → network-first
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // CSS → stale-while-revalidate
  if (url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fresh = fetch(req).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          return res;
        });
        return cached || fresh;
      })
    );
    return;
  }

  // Imagens / fontes → cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // JS → network-only (SEGURANÇA)
  // Deixa passar
});