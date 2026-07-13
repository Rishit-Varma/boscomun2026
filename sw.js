self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);
    if (url.origin === self.location.origin && event.request.method === 'GET') {
        let path = url.pathname;
        const lastPart = path.split('/').pop();
        // If the path does not have a dot (no file extension) and is not a trailing slash directory
        if (lastPart && !lastPart.includes('.') && !path.endsWith('/')) {
            const cleanUrl = url.origin + path + '.html' + url.search + url.hash;
            event.respondWith(
                fetch(cleanUrl).catch(function() {
                    return fetch(event.request);
                })
            );
        }
    }
});
