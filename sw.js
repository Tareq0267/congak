const CACHE_NAME = "pocket-kumon-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
