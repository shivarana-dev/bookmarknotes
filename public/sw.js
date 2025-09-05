const CACHE_NAME = 'bookmark-v' + Date.now();
const STATIC_CACHE = 'bookmark-static-v1';

self.addEventListener('install', event => {
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clear all old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Never cache index.html - always fetch fresh
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store'
      }).catch(() => {
        // Fallback to cached version only if network fails
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Cache static assets (JS, CSS, images) with cache-first strategy
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Check if cached version is stale (older than 1 hour)
            const cached = response.headers.get('date');
            if (cached && Date.now() - new Date(cached).getTime() > 3600000) {
              // Fetch fresh version in background
              fetch(event.request).then(freshResponse => {
                if (freshResponse.ok) {
                  cache.put(event.request, freshResponse.clone());
                }
              });
            }
            return response;
          }
          
          // Not in cache, fetch and cache
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }
  
  // For everything else, network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});