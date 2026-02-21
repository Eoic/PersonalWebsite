const LOG_ID = '[Worker]';
const CACHE_NAME = 'karolis-strazdas-v__VERSION__';

const PRECACHE_URLS = [
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
];

const NETWORK_FIRST_PATHS = ['/', '/positions', '/projects', '/education'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.info(`${LOG_ID} Opened cache...`);
            return cache.addAll(PRECACHE_URLS);
        })
    );

    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    try {
        const url = new URL(event.request.url);

        if (url.pathname === '/events' || url.pathname === '/alive') {
            return;
        }

        if (NETWORK_FIRST_PATHS.includes(url.pathname)) {
            event.respondWith(
                fetch(event.request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                        return response;
                    })
                    .catch(() => caches.match(event.request))
            );
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
        }).then(() => self.clients.claim())
    );
});
