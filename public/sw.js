// Freq's service worker. It only exists so phones treat Freq as an installable app;
// it doesn't cache anything, so you always get the latest version from the server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
