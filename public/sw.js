const CACHE_NAME = 'urban-guardians-v1.0.0';
const RUNTIME_CACHE = 'runtime-cache-v1.0.0';
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// URLs to cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icon.svg'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.urban-guardians\.com\/api\/reports/,
  /^https:\/\/api\.urban-guardians\.com\/api\/analytics/,
  /^http:\/\/localhost:5000\/api\/reports/,
  /^http:\/\/localhost:5000\/api\/analytics/
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching precache resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different resource types with appropriate caching strategies
  if (request.destination === 'document') {
    // HTML pages - Network first, fallback to cache, then offline page
    event.respondWith(handleDocumentRequest(request));
  } else if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    // API requests - Network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache first, fallback to network
    event.respondWith(handleImageRequest(request));
  } else {
    // Other resources - Stale while revalidate
    event.respondWith(handleOtherResources(request));
  }
});

// Document request handler (Network first)
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for document, trying cache:', error);
    
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page as last resort
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline - Please check your connection');
  }
}

// API request handler (Network first with cache fallback)
async function handleApiRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API network failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker');
      response.headers.set('X-Cache-Status', 'HIT-OFFLINE');
      return response;
    }
    
    // Return error response for API failures
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'This request failed and no cached data is available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker'
        }
      }
    );
  }
}

// Image request handler (Cache first)
async function handleImageRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image load failed:', error);
    
    // Return placeholder image for failed image loads
    return new Response('', {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'image/svg+xml'
      }
    });
  }
}

// Other resources handler (Stale while revalidate)
async function handleOtherResources(request) {
  // In dev mode, skip caching for Vite HMR and dev resources
  if (isDev && (request.url.includes('?v=') || request.url.includes('@vite/client') || request.url.includes('@id/'))) {
    try {
      return await fetch(request);
    } catch (error) {
      // Silently fail for dev resources
      return new Response('', { status: 404 });
    }
  }
  
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached version immediately if available
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    // Don't log errors for expected dev failures
    if (!isDev || !request.url.includes('localhost')) {
      console.log('[SW] Resource fetch failed:', error);
    }
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Background sync for failed requests
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'report-submission') {
    event.waitUntil(syncFailedReports());
  }
});

// Sync failed report submissions
async function syncFailedReports() {
  try {
    console.log('[SW] Syncing failed reports...');
    
    // Get failed reports from IndexedDB (would need to implement IndexedDB storage)
    // For now, just log the attempt
    console.log('[SW] No failed reports to sync');
    
  } catch (error) {
    console.error('[SW] Failed to sync reports:', error);
  }
}

// Push notification handler
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have a new update on your civic report',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'civic-update',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Report',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: '/',
      reportId: 'default'
    }
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = payload.data || options.data;
    } catch (error) {
      console.error('[SW] Error parsing push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Urban Guardians', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'dismiss') {
    return;
  }
  
  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const targetUrl = action === 'view' && data.url ? data.url : '/';
        
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle message events from the main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'GET_VERSION':
        event.ports[0].postMessage({
          version: CACHE_NAME,
          runtime: RUNTIME_CACHE
        });
        break;
        
      case 'CLEAR_CACHE':
        caches.delete(RUNTIME_CACHE).then(success => {
          event.ports[0].postMessage({ cleared: success });
        });
        break;
        
      default:
        console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'analytics-update') {
    event.waitUntil(updateAnalyticsCache());
  }
});

// Update analytics cache
async function updateAnalyticsCache() {
  try {
    console.log('[SW] Updating analytics cache...');
    
    const cache = await caches.open(RUNTIME_CACHE);
    const analyticsEndpoints = [
      '/api/analytics/overall',
      '/api/analytics/categories',
      '/api/analytics/real-time'
    ];
    
    for (const endpoint of analyticsEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response);
        }
      } catch (error) {
        console.log(`[SW] Failed to update cache for ${endpoint}:`, error);
      }
    }
    
    console.log('[SW] Analytics cache updated');
  } catch (error) {
    console.error('[SW] Failed to update analytics cache:', error);
  }
}