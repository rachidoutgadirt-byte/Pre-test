/* عامل الخدمة — تشغيل "رائز الموضعة" دون اتصال + تحديثٌ تلقائيٌّ بالكامل.
   لا حاجة لتغيير أيّ رقم إصدارٍ عند التحديث: يكتشف التطبيق النسخة الجديدة تلقائيًّا من بصمة index.html المنشور.
   الاستراتيجية «الشبكة أولًا» تُبقي المحتوى محدَّثًا، وتعود إلى الذاكرة عند انقطاع الاتصال. */
const CACHE = 'rayez-qabli';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// عند طلب التطبيق تفعيل التحديث من الشريط
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // طلبات فحص الإصدار: تمرّ إلى الشبكة دون تخزين
  if (new URL(req.url).searchParams.has('__swprobe')) {
    e.respondWith(fetch(req).catch(() => new Response('', { status: 504 })));
    return;
  }
  // الشبكة أولًا ثمّ الذاكرة (يبقى المحتوى محدَّثًا تلقائيًّا)
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
  );
});
