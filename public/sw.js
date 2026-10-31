// Safe Service Worker for BarOps PWA
// Cleans up any legacy Workbox precaches that could interfere with iframe auth redirects
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        // Ignore cache cleanup errors
      }
      await self.clients.claim();
    })()
  );
});
