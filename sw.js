const CACHE_PREFIX = 'snc-guided-';
const CACHE_NAME = `${CACHE_PREFIX}2.2.1-r1`;
const ASSETS = [
  './js/tutorialLinks.js',
  './', './index.html', './css/styles.css', './js/app.js', './js/dataUtils.js', './js/persistence.js', './js/improvements.js', './js/vendor/heic2any.min.js',
  './js/programData.js', './js/progressiveEngine.js', './js/excelExporter.js', './js/xlsxWriter.js',
  './js/nutritionEngine.js', './js/aiVisionEstimator.js', './js/whoopTracker.js',
  './js/workoutEngine.js', './js/coachUpdater.js', './js/storage.js', './manifest.json',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  // Updates wait until the old app closes or the user explicitly requests one.
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith(CACHE_PREFIX) || /^snc-workout-v\d+$/.test(key)) && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Serve a coherent version of the app, even if a deployment occurs mid-workout.
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return await cache.match('./index.html');
      throw error;
    }
  })());
});
