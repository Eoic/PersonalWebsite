const LOG_ID = '[Worker]';
const CACHE_NAME = 'karolis-strazdas-v__VERSION__';

const urlsToCache = [
    '/',
    '/css/main.css',
    '/js/main.js',
    '/images/avatar.webp',
    '/images/initials.png',
    '/images/icons/github.svg',
    '/images/icons/linkedin.svg',
    '/images/icons/email.svg',
    '/images/icons/location.svg',
    '/images/icons/read.svg',
    '/images/icons/work.svg',
    '/images/icons/learn.svg',
    '/images/icons/theme-dark.svg',
    '/images/icons/theme-light.svg',
    '/positions',
    '/projects',
    '/education',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.info(`${LOG_ID} Opened cache...`);
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    try {
        const url = new URL(event.request.url);
        if (url.pathname === '/events' || url.pathname === '/alive') {
            return;
        }
    } catch (error) {
        console.error(`${LOG_ID} Fetch event error:`, error);
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.info(`${LOG_ID} Deleting old cache:`, cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
