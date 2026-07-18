const CACHE = 'ascend-v1';
const ASSETS = ['./','./index.html','./styles.css','./js/app.js','./js/data.js','./js/game.js','./js/state.js','./manifest.webmanifest','./assets/icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
