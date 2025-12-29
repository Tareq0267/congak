const CACHE_NAME = "congak-v2"; // bump when you change files
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./manifest.json",

  // images
  "./assets/logo.png",
  "./assets/logo_background.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",

  // sounds
  "./sounds/correct.mp3",
  "./sounds/wrong.mp3",
  "./sounds/end.mp3",

  // echarts CDN
  "https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Network-first for navigation so updates show up
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
