const VER = 'mushafi-v2.4.1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const STATIC_HOSTS = ['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mushafi-') && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    if (req.mode === 'navigate') {
        e.respondWith(fetch(req).then(r => {
            if (r && r.ok) { const copy = r.clone(); caches.open(VER).then(c => c.put('./index.html', copy)); }
            return r;
        }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
        return;
    }

    if (STATIC_HOSTS.includes(url.hostname) || url.origin === self.location.origin) {
        e.respondWith(caches.open(VER).then(async c => {
            const hit = await c.match(req);
            const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
            return hit || net;
        }));
    }
});
