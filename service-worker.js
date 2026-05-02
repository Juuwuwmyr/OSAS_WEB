const CACHE_NAME = "osas-cache-v3";

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.php",
  "/manifest.json",
  "/app/assets/styles/login.css",
  "/app/assets/styles/dashboard.css",
  "/app/assets/styles/topnav.css",
  "/app/assets/styles/content-layout.css",
  "/app/assets/styles/user_dashboard.css",
  "/app/assets/styles/user_topnav.css",
  "/app/assets/styles/settings.css",
  "/app/assets/styles/violation.css",
  "/app/assets/styles/chatbot.css",
  "/app/assets/img/default.png",
  "/app/assets/js/pwa.js",
  "/app/assets/js/dashboard.js",
  "/app/assets/js/user_dashboard.js",
  "/app/assets/js/dashboardData.js",
  "/app/assets/js/userDashboardData.js",
  "/app/assets/js/utils/theme.js",
  "/app/assets/js/utils/eyeCare.js",
  "/app/assets/js/utils/notification.js",
  "/app/assets/js/utils/offlineDB.js",
  "/app/assets/js/department.js",
  "/app/assets/js/section.js",
  "/app/assets/js/student.js",
  "/app/assets/js/violation.js",
  "/app/assets/js/reports.js",
  "/app/assets/js/announcement.js",
  "/app/assets/js/chatbot.js",
  "/app/assets/js/userViolations.js",
  "/app/assets/js/userAnnouncements.js"
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          fetch(url).then(res => { if (res.ok) cache.put(url, res); }).catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  // API / PHP — network first, cache fallback
  if (url.pathname.includes("/api/") || url.pathname.endsWith(".php")) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then(cached => cached ||
            new Response(
              JSON.stringify({ status: "offline", message: "You are offline. Showing cached data." }),
              { headers: { "Content-Type": "application/json" } }
            )
          )
        )
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        if (event.request.mode === "navigate") return caches.match("/index.php");
      });
    })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-violations") {
    event.waitUntil(syncPendingViolations());
  }
});

async function syncPendingViolations() {
  // Notify all clients to run their sync function
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach(client => {
    client.postMessage({ type: "SYNC_VIOLATIONS" });
  });
}

// ── MESSAGE HANDLER ───────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── INSTALL: pre-cache core assets ────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll fails if any single request fails — use individual puts to be resilient
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          fetch(url).then(res => {
            if (res.ok) cache.put(url, res);
          }).catch(() => {}) // silently skip failed assets
        )
      );
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: network-first for API/PHP, cache-first for static assets ───────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (except CDN assets already cached)
  if (event.request.method !== "GET") return;

  // API calls — network first, offline fallback
  if (url.pathname.includes("/api/") || url.pathname.endsWith(".php")) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Cache successful GET API responses for offline use
          if (res.ok && event.request.method === "GET") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline: return cached version if available
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Return a JSON offline response for API calls
            return new Response(
              JSON.stringify({ status: "offline", message: "You are offline. Showing cached data." }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/index.php");
        }
      });
    })
  );
});
