// Service Worker 文件：sw.js
const CACHE_NAME = 'tax-map-pwa-cache-v2'; // 每次更新时更改版本号，例如 v1 -> v2
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png',
    '/icon-512.png',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// 安装 Service Worker，缓存指定资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存文件：', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活 Service Worker，清理旧缓存
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

// 拦截请求，优先使用缓存，并检查更新
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存中有匹配资源，返回缓存内容
                if (response) {
                    // 同时发起网络请求，检查是否有更新
                    fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse.ok) {
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, networkResponse.clone());
                                });
                            }
                        })
                        .catch(() => {});
                    return response;
                }
                // 如果缓存中没有，发起网络请求
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse.ok) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        return caches.match('/index.html');
                    });
            })
    );
});

// 监听消息，触发更新
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
