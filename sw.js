// sw.js - Ultimate Service Worker for Offline PWA

const CACHE_NAME = 'noor-quran-premium-v3';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/components.css',
    './css/player.css',
    './css/animations.css',
    './js/app.js',
    './js/api.js',
    './js/player.js',
    './js/router.js',
    './js/storage.js',
    './js/theme.js',
    './js/cursor.js',
    './js/tasbeeh.js',
    './data/config.json',
    './data/surahs.json',
    './data/reciters.json',
    './data/tafsir.json',
    './data/radio.json',
    './data/azkar.json',
    './data/playlists.json',
    './data/collections.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pre-caching Core Assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // عدم تخزين الملفات الصوتية لتجنب امتلاء ذاكرة الهاتف
    if (event.request.url.includes('.mp3') || event.request.url.includes('mp3quran') || event.request.url.includes('stream')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    // تحديث الكاش في الخلفية (Stale-While-Revalidate)
                    if (event.request.method === 'GET' && !event.request.url.includes('aladhan.com')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                });
                return networkResponse;
            }).catch(() => {
                console.warn('[SW] Offline Mode: Falling back to cache.');
            });
            return cachedResponse || fetchPromise;
        })
    );
});