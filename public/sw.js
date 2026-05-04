const CACHE_NAME = 'hsaas-roster-admin-v4';

const ASSETS_TO_CACHE = [
    './',
    './login.html',
    './app.html',
    './style.css',
    './js/utils.js',
    './js/app.js',
    './js/admin.js',
    './js/audit.js',
    './js/auth.js',
    './js/contacts.js',
    './js/roster.js',
    './js/slots.js',
    './js/supabase-client.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './manifest.json',
    './USER_GUIDE.md'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS_TO_CACHE))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Ignore external Supabase database requests
    if (event.request.url.includes('supabase.co')) return;

    // Network-First strategy
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (event.request.method === 'GET' && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
