// Service Worker de expurgo de cache obsoleto e atualização forçada de abas (Opera GX / Chrome / Mobile)
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch (e) {}

      try {
        const cacheNames = await self.caches.keys();
        await Promise.all(cacheNames.map((name) => self.caches.delete(name)));
      } catch (e) {}

      try {
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        await self.registration.unregister();
        for (const client of windowClients) {
          if (client && client.url && typeof client.navigate === 'function') {
            try {
              const target = client.url.includes('dbhldtzf')
                ? client.url.replace(/dbhldtzf/g, 'dbhltdzf')
                : client.url;
              await client.navigate(target);
            } catch (e) {}
          }
        }
      } catch (e) {}
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url || '';
  if (url.includes('dbhldtzf')) {
    event.respondWith(fetch(url.replace(/dbhldtzf/g, 'dbhltdzf'), event.request));
  }
});
