importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCFXWuN7KJ5H-rilz6kBApmHA1o2EqnVlI',
  authDomain: 'passearcontigo.firebaseapp.com',
  projectId: 'passearcontigo',
  storageBucket: 'passearcontigo.firebasestorage.app',
  messagingSenderId: '898427379877',
  appId: '1:898427379877:web:d026b07303a523787dad4c'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(notification.title || 'PassearContigo', {
    body: notification.body || 'Tem uma nova notificação.',
    icon: '/assets/icon/favicon.png',
    data
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const publicacaoId = event.notification.data?.publicacaoId;
  const url = publicacaoId ? `/tabs/perfil/feed?publicacao=${publicacaoId}` : '/tabs/perfil/feed';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find(client => 'focus' in client);

      if (existingClient) {
        existingClient.focus();
        existingClient.navigate(url);
        return;
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return undefined;
    })
  );
});
