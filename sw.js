// Offline cache. Bump VERSION whenever any file changes so phones pick up the new game.
const VERSION = 'plaminky-v6';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/data.js', './js/track.js', './js/physics.js', './js/rig.js', './js/art.js', './js/world.js', './js/riderModel.js', './js/input.js', './js/audio.js', './js/results.js', './js/parks.js', './js/reading.js', './js/texts.js',
  './vendor/three/build/three.module.min.js',
  './vendor/three/examples/jsm/postprocessing/EffectComposer.js', './vendor/three/examples/jsm/postprocessing/RenderPass.js', './vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js',
  './vendor/three/examples/jsm/postprocessing/OutputPass.js', './vendor/three/examples/jsm/postprocessing/Pass.js', './vendor/three/examples/jsm/postprocessing/ShaderPass.js', './vendor/three/examples/jsm/postprocessing/MaskPass.js',
  './vendor/three/examples/jsm/shaders/CopyShader.js', './vendor/three/examples/jsm/shaders/LuminosityHighPassShader.js', './vendor/three/examples/jsm/shaders/OutputShader.js',
  './fonts/bungee-latin.woff2', './fonts/bungee-latin-ext.woff2', './fonts/lilita-latin.woff2', './fonts/lilita-latin-ext.woff2',
  './fonts/rubik-latin-500.woff2', './fonts/rubik-latin-ext-500.woff2', './fonts/rubik-latin-700.woff2', './fonts/rubik-latin-ext-700.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
