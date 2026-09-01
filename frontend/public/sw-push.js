// Service Worker — Push Notification Handler
// File ini diload oleh next-pwa sebagai custom service worker injection

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data = { title: "Notifikasi", body: "", url: "/meals" };
  try {
    data = JSON.parse(event.data.text());
  } catch (_) {
    data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/meals" },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/meals";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
