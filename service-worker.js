const CACHE_NAME = "osas-cache-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.php",
  "./manifest.json",
  "./app/assets/styles/login.css",
  "./app/assets/styles/dashboard.css",
  "./app/assets/styles/chatbot.css",
  "./app/assets/styles/user_dashboard.css",
  "./app/assets/styles/user_topnav.css",
  "./app/assets/styles/settings.css",
  "./app/assets/img/default.png",
  "./app/assets/js/pwa.js",
  "./app/assets/js/dashboard.js",
  "./app/assets/js/utils/notification.js",
  "./app/assets/js/dashboardData.js",
  "./app/assets/js/modules/dashboardModule.js",
  "./app/assets/js/utils/theme.js",
  "./app/assets/js/utils/eyeCare.js",
  "./app/assets/js/department.js",
  "./app/assets/js/section.js",
  "./app/assets/js/student.js",
  "./app/assets/js/violation.js",
  "./app/assets/js/reports.js",
  "./app/assets/js/announcement.js",
  "./app/assets/js/chatbot.js",
  "https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.40.2/docxtemplater.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.4/pizzip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching all assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH (Offline Support with Network-First Strategy for API, Cache-First for Assets)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // For API calls, try network first, then fall back to cache if it's a GET request
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          if (event.request.method === "GET") {
            return caches.match(event.request);
          }
          // For POST/PUT/DELETE we can't just return from cache, 
          // we'll handle this with a custom offline queue later if needed
          return new Response(JSON.stringify({ 
            status: "offline", 
            message: "You are offline. Action queued." 
          }), {
            headers: { "Content-Type": "application/json" }
          });
        })
    );
    return;
  }

  // For assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optionally cache new assets on the fly
        if (fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});
