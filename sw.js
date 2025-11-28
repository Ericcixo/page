const CACHE_NAME = 'rf-v1-premium';
const OFFLINE_URL = 'offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  '/assets/js/config.js',
  '/assets/js/checkout.js',
  '/assets/js/i18n.js',
  '/img/logo.svg',
  '/img/icons/instagram.svg',
  '/img/icons/x.svg',
  '/img/icons/tiktok.svg'
];

// 1. Instalación: Guardamos los archivos esenciales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpiamos cachés viejas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// 3. Fetch: Servimos desde caché o red
self.addEventListener('fetch', (e) => {
  // Solo peticiones GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Si está en caché, lo devolvemos (velocidad extrema)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no, lo pedimos a la red
      return fetch(e.request)
        .catch(() => {
          // Si falla la red (sin internet) y es una página, mostramos offline.html
          if (e.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
