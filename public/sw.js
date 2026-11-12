// Service Worker for Web Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Notificación Launcit', body: 'Tienes una nueva reserva.' };
  
  const options = {
    body: data.body,
    icon: './logo.png',
    badge: './logo.png',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
