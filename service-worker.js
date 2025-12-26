// Service Worker לשמירה על האפליקציה פעילה ברקע
const CACHE_NAME = 'car-music-player-v230';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'car-music-icon.png'
];

// התקנה
self.addEventListener('install', event => {
  console.log('🔧 Service Worker מותקן');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 מטמון נפתח');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// הפעלה
self.addEventListener('activate', event => {
  console.log('✅ Service Worker פעיל');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ מוחק מטמון ישן:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// טיפול בבקשות
self.addEventListener('fetch', event => {
  // רק לבקשות GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // החזר מהמטמון אם קיים
        if (response) {
          return response;
        }
        
        // אחרת, שלוף מהרשת
        return fetch(event.request).then(response => {
          // בדוק אם התשובה תקינה
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // שמור במטמון לפעם הבאה
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// שמירה על פעילות ברקע
self.addEventListener('message', event => {
  if (!event.data || !event.data.type) return;

  switch (event.data.type) {
    case 'KEEP_ALIVE':
      console.log('💓 Service Worker Heartbeat:', new Date(event.data.timestamp).toLocaleTimeString());
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'ALIVE',
          timestamp: Date.now()
        });
      }
      break;
    case 'SKIP_WAITING':
      console.log('⏭️ מתקבל SKIP_WAITING - מפעיל מיד את Service Worker החדש');
      self.skipWaiting();
      break;
    default:
      break;
  }
});

// טיפול בסגירת האפליקציה
self.addEventListener('sync', event => {
  console.log('🔄 Background Sync:', event.tag);
});

// התראות push (לעתיד)
self.addEventListener('push', event => {
  console.log('📬 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'נגן המוזיקה פועל ברקע',
    icon: 'car-music-icon.png',
    badge: 'car-music-icon.png',
    vibrate: [200, 100, 200],
    tag: 'music-player',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('🎵 נגן מוזיקה לרכב', options)
  );
});

// טיפול בלחיצה על התראה
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('index.html')
  );
});

console.log('🚀 Service Worker טעון ומוכן');
