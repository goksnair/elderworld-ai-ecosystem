// ElderWorld PWA Controller - Progressive Web App functionality
// Handles service worker registration, offline detection, push notifications

class ElderWorldPWA {
    constructor() {
        this.isOnline = navigator.onLine;
        this.swRegistration = null;
        this.pushSubscription = null;
        this.installPrompt = null;
        this.updateAvailable = false;

        this.init();
    }

    async init() {
        try {
            await this.registerServiceWorker();
            this.setupOfflineDetection();
            this.setupInstallPrompt();
            this.setupPushNotifications();
            this.setupUpdateNotifications();
            this.setupOfflineSync();

            console.log('ElderWorld PWA: Initialization complete');
        } catch (error) {
            console.error('ElderWorld PWA: Initialization failed', error);
        }
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/js/elderbridge-sw.js', {
                scope: '/'
            });

            console.log('ElderWorld PWA: Service Worker registered', this.swRegistration.scope);

            // Handle service worker updates
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.updateAvailable = true;
                        this.showUpdateNotification();
                    }
                });
            });

        } catch (error) {
            console.error('ElderWorld PWA: Service Worker registration failed', error);
        }
    }

    // Offline Detection and UI Updates
    setupOfflineDetection() {
        const updateOnlineStatus = () => {
            this.isOnline = navigator.onLine;
            this.updateOfflineUI();

            if (this.isOnline) {
                this.triggerBackgroundSync();
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial status update
        updateOnlineStatus();
    }

    updateOfflineUI() {
        const offlineIndicator = document.querySelector('.offline-indicator') || this.createOfflineIndicator();
        const offlineBanner = document.querySelector('.offline-banner') || this.createOfflineBanner();

        if (this.isOnline) {
            offlineIndicator.classList.add('hidden');
            offlineBanner.classList.add('hidden');
            document.body.classList.remove('offline-mode');
        } else {
            offlineIndicator.classList.remove('hidden');
            offlineBanner.classList.remove('hidden');
            document.body.classList.add('offline-mode');
        }
    }

    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator fixed top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 hidden';
        indicator.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 008.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
        </svg>
        <span>Offline Mode</span>
      </div>
    `;
        document.body.appendChild(indicator);
        return indicator;
    }

    createOfflineBanner() {
        const banner = document.createElement('div');
        banner.className = 'offline-banner bg-amber-100 border-l-4 border-amber-500 p-4 hidden';
        banner.innerHTML = `
      <div class="flex">
        <div class="ml-3">
          <p class="text-sm text-amber-700">
            You're currently offline. Some features may be limited, but emergency functions remain available.
          </p>
          <button class="mt-2 text-sm bg-amber-500 text-white px-4 py-1 rounded hover:bg-amber-600 transition-colors" onclick="elderworldPWA.retryConnection()">
            Retry Connection
          </button>
        </div>
      </div>
    `;

        const mainContent = document.querySelector('main') || document.body.firstElementChild;
        mainContent.insertBefore(banner, mainContent.firstChild);
        return banner;
    }

    // App Installation
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('ElderWorld PWA: App installed');
            this.hideInstallButton();
            this.trackInstallation();
        });
    }

    showInstallButton() {
        let installButton = document.querySelector('.install-pwa-btn');

        if (!installButton) {
            installButton = document.createElement('button');
            installButton.className = 'install-pwa-btn fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50';
            installButton.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>Install App</span>
        </div>
      `;

            installButton.addEventListener('click', () => this.installApp());
            document.body.appendChild(installButton);
        }

        installButton.classList.remove('hidden');
    }

    hideInstallButton() {
        const installButton = document.querySelector('.install-pwa-btn');
        if (installButton) {
            installButton.classList.add('hidden');
        }
    }

    async installApp() {
        if (!this.installPrompt) return;

        try {
            const result = await this.installPrompt.prompt();
            console.log('ElderWorld PWA: Install prompt result', result.outcome);

            this.installPrompt = null;
            this.hideInstallButton();
        } catch (error) {
            console.error('ElderWorld PWA: Installation failed', error);
        }
    }

    // Push Notifications
    async setupPushNotifications() {
        if (!('PushManager' in window) || !('Notification' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        // Check if user has granted permission
        if (Notification.permission === 'granted') {
            await this.subscribeToPush();
        } else if (Notification.permission !== 'denied') {
            this.showNotificationPrompt();
        }
    }

    showNotificationPrompt() {
        const promptContainer = document.createElement('div');
        promptContainer.className = 'notification-prompt fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50';
        promptContainer.innerHTML = `
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
          </svg>
          <span>Stay connected with real-time health alerts and family updates</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors" onclick="elderworldPWA.enableNotifications()">
            Enable
          </button>
          <button class="px-4 py-2 text-white hover:bg-blue-700 rounded transition-colors" onclick="elderworldPWA.dismissNotificationPrompt()">
            Not Now
          </button>
        </div>
      </div>
    `;

        document.body.insertBefore(promptContainer, document.body.firstChild);
    }

    async enableNotifications() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.subscribeToPush();
                console.log('ElderWorld PWA: Notifications enabled');
            }
        } catch (error) {
            console.error('ElderWorld PWA: Notification permission failed', error);
        }

        this.dismissNotificationPrompt();
    }

    dismissNotificationPrompt() {
        const prompt = document.querySelector('.notification-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    async subscribeToPush() {
        if (!this.swRegistration) return;

        try {
            // Public VAPID key (would be provided by backend)
            const applicationServerKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIiJHgOOGFNmjjOxVGSWlxzz7tJKrThOHwBON5oqCZshCmhZE4Qig';

            this.pushSubscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(applicationServerKey)
            });

            // Send subscription to server
            await this.sendSubscriptionToServer(this.pushSubscription);

            console.log('ElderWorld PWA: Push subscription active');
        } catch (error) {
            console.error('ElderWorld PWA: Push subscription failed', error);
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('ElderWorld PWA: Failed to send subscription to server', error);
        }
    }

    // Update Notifications
    showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 z-50';
        updateBanner.innerHTML = `
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
          <span>A new version of ElderWorld is available</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="px-4 py-2 bg-white text-green-600 rounded hover:bg-gray-100 transition-colors" onclick="elderworldPWA.applyUpdate()">
            Update Now
          </button>
          <button class="px-4 py-2 text-white hover:bg-green-700 rounded transition-colors" onclick="elderworldPWA.dismissUpdateBanner()">
            Later
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(updateBanner);
    }

    async applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }

    dismissUpdateBanner() {
        const banner = document.querySelector('.update-banner');
        if (banner) {
            banner.remove();
        }
    }

    // Background Sync
    setupOfflineSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            this.setupEmergencySync();
            this.setupHealthDataSync();
        }
    }

    async triggerBackgroundSync() {
        if (this.swRegistration && this.swRegistration.sync) {
            try {
                await this.swRegistration.sync.register('health-sync');
                await this.swRegistration.sync.register('emergency-sync');
                console.log('ElderWorld PWA: Background sync triggered');
            } catch (error) {
                console.error('ElderWorld PWA: Background sync failed', error);
            }
        }
    }

    setupEmergencySync() {
        // Store emergency actions for sync when online
        window.addEventListener('emergency-trigger', (event) => {
            this.storeOfflineAction('emergency', event.detail);
        });
    }

    setupHealthDataSync() {
        // Store health data updates for sync
        window.addEventListener('health-update', (event) => {
            this.storeOfflineAction('health', event.detail);
        });
    }

    storeOfflineAction(type, data) {
        // Store in IndexedDB for background sync
        const action = {
            type,
            data,
            timestamp: Date.now(),
            id: generateId()
        };

        // Implementation would use IndexedDB
        console.log('Stored offline action:', action);
    }

    // Utility Methods
    retryConnection() {
        // Force a network check
        fetch('/api/health-check', {
            method: 'HEAD',
            cache: 'no-cache'
        }).then(() => {
            if (!navigator.onLine) {
                // Manually trigger online event if fetch succeeds
                window.dispatchEvent(new Event('online'));
            }
        }).catch(() => {
            console.log('Still offline');
        });
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    trackInstallation() {
        // Analytics tracking for PWA installation
        if (window.gtag) {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'ElderWorld'
            });
        }
    }

    // Public API Methods
    async triggerEmergencyAlert(alertData) {
        const event = new CustomEvent('emergency-trigger', { detail: alertData });
        window.dispatchEvent(event);

        if (this.isOnline) {
            try {
                const response = await fetch('/api/emergency/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alertData)
                });
                return response.ok;
            } catch (error) {
                console.error('Emergency alert failed:', error);
                return false;
            }
        }
        return false; // Will be synced when online
    }

    getOfflineCapabilities() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            pushNotifications: 'PushManager' in window && 'Notification' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            installable: !!this.installPrompt,
            offline: !this.isOnline
        };
    }
}

// Utility function
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Initialize PWA when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.elderworldPWA = new ElderWorldPWA();
    });
} else {
    window.elderworldPWA = new ElderWorldPWA();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElderWorldPWA;
}
