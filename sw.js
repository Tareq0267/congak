const CACHE_NAME = "congak-v2"; // bump version when you change files
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

  // echarts CDN (ok, but see note below)
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
