// sw.js - Service Worker for Offline Experience (PWA)

const CACHE_NAME = 'noor-alquran-cache-v1';

// الملفات الأساسية اللي لازم تتحفظ عشان الموقع يفتح أوفلاين
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './css/theme.css',
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
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&family=Inter:wght@300;400;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// تنزيل الملفات أول مرة المستخدم يفتح الموقع
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and saving assets...');
                // بنستخدم addAll مع تجاهل الأخطاء لبعض الروابط الخارجية
                return Promise.all(
                    ASSETS_TO_CACHE.map(url => {
                        return fetch(url).then(response => {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return cache.put(url, response);
                        }).catch(error => console.log('Failed to cache:', url, error));
                    })
                );
            })
    );
    self.skipWaiting();
});

// مسح النسخ القديمة لما نحدث التطبيق
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// إرجاع الملفات من الـ Cache لو مفيش نت
self.addEventListener('fetch', event => {
    // تجاهل طلبات الـ API والصوتيات عشان منخزنش ملفات عملاقة
    if (event.request.url.includes('api.quran.com') || 
        event.request.url.includes('alquran.cloud') || 
        event.request.url.includes('.mp3') || 
        event.request.url.includes('radiojar')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // لو الملف موجود في الـ Cache، رجعه فوراً (سريع جداً)
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // لو مش موجود جيبه من النت
            return fetch(event.request).then(response => {
                // لو شغال زي الفل احفظه للمرة الجاية
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        }).catch(() => {
            // لو النت فاصل والملف مش في الـ Cache، نرجعه للصفحة الرئيسية
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});