const CACHE_NAME = 'vida-pratica-financeira-v4';
const APP_SHELL = ['./', './index.html', './login.html', './cadastro.html', './redefinir-senha.html'];
const PRIVATE_PAGES = new Set(['/dashboard.html', '/financeiro.html', '/planejamento.html', '/perfil.html']);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || event.request.headers.has('authorization')) return;
  const basePath = new URL(self.registration.scope).pathname;
  const pagePath = `/${requestUrl.pathname.slice(basePath.length)}`;
  if (PRIVATE_PAGES.has(pagePath)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response.ok || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
