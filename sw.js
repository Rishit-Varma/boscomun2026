self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        self.registration.unregister()
            .then(() => self.clients.claim())
            .then(() => console.log('Service worker unregistered on activate'))
    );
});
