const CACHE_NAME = "congak-v3"; // bump when you change files
const SHELL_URL = "./index.html";

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

  // ✅ use local echarts ONLY
  "./vendor/echarts.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
      )
      .then(() => self.clients.claim())
  );
});

// self.addEventListener("fetch", (e) => {
//   const req = e.request;

//   // ✅ App-shell for navigations (offline safe)
//   if (req.mode === "navigate") {
//     e.respondWith(
//       fetch(req)
//         .then((res) => {
//           const copy = res.clone();
//           caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy));
//           return res;
//         })
//         .catch(() => caches.match(SHELL_URL))
//     );
//     return;
//   }

//   // Cache-first for everything else (fast + offline)
//   e.respondWith(
//     caches.match(req).then((cached) => cached || fetch(req))
//   );
// });

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // ✅ App-shell: CACHE FIRST for navigations (so ngrok errors won't replace your app)
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1) Serve cached shell immediately if we have it
      const cachedShell = await cache.match(SHELL_URL);
      if (cachedShell) {
        // 2) In the background, try to update the shell (best-effort)
        e.waitUntil(
          fetch(req)
            .then((res) => {
              // Only update cache if network looks okay
              if (res && res.ok) return cache.put(SHELL_URL, res.clone());
            })
            .catch(() => {})
        );
        return cachedShell;
      }

      // If no cached shell yet, fall back to network (first ever load)
      try {
        const res = await fetch(req);
        if (res && res.ok) await cache.put(SHELL_URL, res.clone());
        return res;
      } catch {
        return caches.match(SHELL_URL);
      }
    })());
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

