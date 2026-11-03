// Service worker: cho app mở nhanh và chơi được khi mạng yếu.
// Đổi số phiên bản khi muốn xóa bộ nhớ đệm cũ.
const CACHE = 'len-chua-hoc-toan-v1';
const SCOPE = self.registration.scope; // ví dụ https://.../chambai/

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([SCOPE, SCOPE + 'manifest.webmanifest', SCOPE + 'icons/icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return; // Firebase, Google… luôn đi thẳng ra mạng

  // Trang chính: lấy bản mới nhất, mất mạng thì dùng bản đã lưu
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(SCOPE, copy)); return res; })
        .catch(() => caches.match(SCOPE))
    );
    return;
  }
  // Tệp tĩnh (JS, CSS, ảnh, phông chữ): dùng bản đã lưu, đồng thời cập nhật ngầm
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
