// ============================================
// HIIT GYM — SERVICE WORKER
// Versão: 1.0.0
// Atualiza CACHE_NAME quando fizeres deploy
// ============================================

const CACHE_NAME = 'hiit-gym-v1.0.0';

// Ficheiros críticos que ficam em cache logo no install
const ASSETS_ESSENCIAIS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/src/logo/logo_def1.svg',
  '/src/logo/favicon.svg',
  '/src/pexels-dimkidama-6796964 (1).webp'
];


// ============================================
// INSTALL — Corre quando o SW é registado pela 1ª vez
// Guarda os assets essenciais em cache imediatamente
// ============================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_ESSENCIAIS))
      .then(() => self.skipWaiting()) // Ativa imediatamente sem esperar reload
  );
});


// ============================================
// ACTIVATE — Corre quando o SW toma controlo
// Apaga caches antigas (versões anteriores)
// ============================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME) // tudo menos a versão atual
          .map(name => caches.delete(name))    // apaga as antigas
      )
    ).then(() => self.clients.claim()) // toma controlo de todas as abas abertas
  );
});


// ============================================
// FETCH — Interceta todos os pedidos de rede
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora pedidos externos (Google Fonts, Font Awesome, etc.)
  if (url.origin !== location.origin) return;

  // Ignora pedidos que não sejam GET
  if (request.method !== 'GET') return;


  // ── HTML: Network First ──────────────────
  // Tenta sempre o servidor. Se falhar (offline), usa cache.
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Guarda a resposta fresca em cache
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request)) // offline → cache
    );
    return;
  }


  // ── CSS / JS: Stale-While-Revalidate ────
  // Responde com cache imediatamente, atualiza em segundo plano.
  if (url.pathname.match(/\.(css|js)(\?.*)?$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          const networkFetch = fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          });
          return cached || networkFetch; // cache imediato, rede em background
        })
      )
    );
    return;
  }


  // ── Imagens / Vídeos / Fontes: Cache First ──
  // Usa cache. Só vai à rede se não existir.
  if (url.pathname.match(/\.(webp|jpg|jpeg|png|svg|mp4|woff2?)(\?.*)?$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        // Não está em cache → busca e guarda
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }
});