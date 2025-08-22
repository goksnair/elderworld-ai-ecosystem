// ElderWorld Service Worker - Healthcare-grade PWA with offline functionality
// Version: 1.0.0

const CACHE_NAME = 'elderworld-v1.0.0';
const API_CACHE_NAME = 'elderworld-api-v1.0.0';
const OFFLINE_URL = '/offline.html';
const EMERGENCY_URL = '/emergency-offline.html';

// Critical files to cache for offline functionality
const STATIC_CACHE_URLS = [
    '/',
    '/desktop/PremiumDashboard.html',
    '/desktop/AnalyticsDashboard.html',
    '/mobile/MobileApp.html',
    '/shared/FamilyTouchpoints.html',
    '/css/elderworld-premium.css',
    '/css/elderworld-mobile.css',
    '/css/elderworld-animations.css',
    '/js/elderworld-animations.js',
    '/js/elderworld-charts.js',
    '/js/elderworld-pwa.js',
    '/assets/icons/elderworld-192x192.png',
    '/assets/icons/elderworld-512x512.png',
    '/assets/icons/emergency-96x96.png',
    '/assets/fonts/inter-var.woff2',
    '/assets/emergency/emergency-sound.mp3',
    OFFLINE_URL,
    EMERGENCY_URL
];

// API endpoints to cache for offline access
const API_CACHE_URLS = [
    '/api/health/latest',
    '/api/family/members',
    '/api/emergency/contacts',
    '/api/medications/schedule',
    '/api/alerts/recent'
];

// Emergency features that must work offline
const EMERGENCY_FEATURES = [
    '/api/emergency/trigger',
    '/api/emergency/contacts',
    '/emergency-offline.html'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
    console.log('ElderWorld Service Worker: Installing...');

    event.waitUntil(
        (async () => {
            try {
                // Open static cache and add core files
                const staticCache = await caches.open(CACHE_NAME);
                await staticCache.addAll(STATIC_CACHE_URLS);

                // Pre-cache critical API data
                const apiCache = await caches.open(API_CACHE_NAME);
                for (const url of API_CACHE_URLS) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await apiCache.put(url, response);
                        }
                    } catch (error) {
                        console.warn(`Failed to cache API endpoint: ${url}`, error);
                    }
                }

                console.log('ElderWorld Service Worker: Installation complete');
                // Activate immediately
                self.skipWaiting();
            } catch (error) {
                console.error('ElderWorld Service Worker: Installation failed', error);
            }
        })()
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('ElderWorld Service Worker: Activating...');

    event.waitUntil(
        (async () => {
            try {
                // Clean up old caches
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
                        .map(name => caches.delete(name))
                );

                // Claim all clients immediately
                await self.clients.claim();
                console.log('ElderWorld Service Worker: Activation complete');
            } catch (error) {
                console.error('ElderWorld Service Worker: Activation failed', error);
            }
        })()
    );
});

// Fetch event - serve cached content with fallbacks
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle different request types
    if (request.method !== 'GET') {
        return; // Only handle GET requests
    }

    event.respondWith(
        (async () => {
            try {
                // Emergency endpoints - critical offline functionality
                if (isEmergencyRequest(request)) {
                    return handleEmergencyRequest(request);
                }

                // API requests - cache first with network fallback
                if (isApiRequest(request)) {
                    return handleApiRequest(request);
                }

                // Static assets - cache first
                if (isStaticAsset(request)) {
                    return handleStaticRequest(request);
                }

                // HTML pages - network first with cache fallback
                if (isHtmlRequest(request)) {
                    return handleHtmlRequest(request);
                }

                // Default: network first
                return await fetch(request);

            } catch (error) {
                console.error('ElderWorld Service Worker: Fetch error', error);
                return getOfflineFallback(request);
            }
        })()
    );
});

// Emergency request handler - must work offline
async function handleEmergencyRequest(request) {
    try {
        // Try network first for real-time emergency response
        const networkResponse = await fetch(request, { timeout: 3000 });
        if (networkResponse.ok) {
            // Cache successful emergency responses
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.warn('Emergency network request failed, using cache', error);
    }

    // Fallback to cached emergency data
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Last resort: offline emergency page
    return caches.match(EMERGENCY_URL);
}

// API request handler - cache with network update
async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);

    try {
        // Network first for real-time data
        const networkResponse = await fetch(request, { timeout: 5000 });
        if (networkResponse.ok) {
            // Update cache with fresh data
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.warn('API network request failed, using cache', error);
    }

    // Fallback to cached data
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Add stale data header
        const response = cachedResponse.clone();
        response.headers.set('X-ElderWorld-Cache', 'stale');
        return response;
    }

    // Return offline indicator
    return new Response(
        JSON.stringify({
            error: 'offline',
            message: 'No cached data available',
            timestamp: Date.now()
        }),
        {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-ElderWorld-Cache': 'offline'
            }
        }
    );
}

// Static asset handler - cache first
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.warn('Static asset network request failed', error);
    }

    return new Response('Asset not available offline', { status: 404 });
}

// HTML request handler - network first with offline fallback
async function handleHtmlRequest(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            return networkResponse;
        }
    } catch (error) {
        console.warn('HTML network request failed, using cache', error);
    }

    // Try cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Fallback to offline page
    return caches.match(OFFLINE_URL);
}

// Utility functions
function isEmergencyRequest(request) {
    return EMERGENCY_FEATURES.some(pattern => request.url.includes(pattern));
}

function isApiRequest(request) {
    return request.url.includes('/api/') || request.url.includes('api.');
}

function isStaticAsset(request) {
    return /\.(css|js|png|jpg|jpeg|gif|svg|woff2|mp3)$/i.test(request.url);
}

function isHtmlRequest(request) {
    return request.headers.get('accept')?.includes('text/html');
}

async function getOfflineFallback(request) {
    if (isHtmlRequest(request)) {
        return caches.match(OFFLINE_URL);
    }
    return new Response('Offline', { status: 503 });
}

// Background sync for emergency alerts
self.addEventListener('sync', event => {
    if (event.tag === 'emergency-sync') {
        event.waitUntil(syncEmergencyData());
    } else if (event.tag === 'health-sync') {
        event.waitUntil(syncHealthData());
    }
});

async function syncEmergencyData() {
    try {
        // Sync pending emergency alerts
        const pendingAlerts = await getStoredEmergencyAlerts();
        for (const alert of pendingAlerts) {
            await fetch('/api/emergency/sync', {
                method: 'POST',
                body: JSON.stringify(alert)
            });
        }
        await clearStoredEmergencyAlerts();
    } catch (error) {
        console.error('Emergency sync failed:', error);
    }
}

async function syncHealthData() {
    try {
        // Sync cached health data with server
        const cache = await caches.open(API_CACHE_NAME);
        const requests = await cache.keys();

        for (const request of requests) {
            if (request.url.includes('/api/health/')) {
                try {
                    const freshResponse = await fetch(request);
                    if (freshResponse.ok) {
                        await cache.put(request, freshResponse);
                    }
                } catch (error) {
                    console.warn(`Failed to sync: ${request.url}`, error);
                }
            }
        }
    } catch (error) {
        console.error('Health data sync failed:', error);
    }
}

// Push notifications for health alerts
self.addEventListener('push', event => {
    const options = {
        body: 'You have a new health alert',
        icon: '/assets/icons/elderworld-192x192.png',
        badge: '/assets/icons/elderworld-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/desktop/PremiumDashboard.html#alerts'
        },
        actions: [
            {
                action: 'view',
                title: 'View Alert',
                icon: '/assets/icons/view-16x16.png'
            },
            {
                action: 'emergency',
                title: 'Emergency Call',
                icon: '/assets/icons/emergency-16x16.png'
            }
        ],
        requireInteraction: true
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            options.title = payload.title || 'ElderWorld Alert';
            options.body = payload.body || options.body;
            options.data.url = payload.url || options.data.url;

            // High priority for emergency alerts
            if (payload.type === 'emergency') {
                options.tag = 'emergency';
                options.renotify = true;
                options.requireInteraction = true;
                options.vibrate = [300, 200, 300, 200, 300];
            }
        } catch (error) {
            console.warn('Failed to parse push payload:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification('ElderWorld Alert', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'emergency') {
        event.waitUntil(
            clients.openWindow('/emergency-offline.html')
        );
    } else {
        const urlToOpen = event.notification.data?.url || '/desktop/PremiumDashboard.html';

        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clients => {
                // Focus existing ElderWorld window if available
                for (const client of clients) {
                    if (client.url.includes('elderworld') && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Open new window
                return clients.openWindow(urlToOpen);
            })
        );
    }
});

// Utility functions for IndexedDB storage
async function getStoredEmergencyAlerts() {
    // Implementation would use IndexedDB for offline storage
    return [];
}

async function clearStoredEmergencyAlerts() {
    // Implementation would clear IndexedDB emergency storage
}

console.log('ElderWorld Service Worker: Loaded successfully');
