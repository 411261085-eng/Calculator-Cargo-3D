/* Service worker Kalkulator Cargo 3D - agar bisa diinstal dan tetap jalan offline.
   Ubah angka VERSI setiap kali Anda mengunggah index.html baru agar cache lama dibuang. */
const VERSI = "cargo3d-v1";
const INTI = ["./", "index.html", "manifest.json", "favicon.ico", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
const LUAR = ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSI);
    await c.addAll(INTI);
    await Promise.all(LUAR.map((u) => fetch(new Request(u, { mode: "no-cors" })).then((r) => c.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const k = await caches.keys();
    await Promise.all(k.filter((x) => x !== VERSI).map((x) => caches.delete(x)));
    await self.clients.claim();
  })());
});

function simpan(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    const salinan = res.clone();
    caches.open(VERSI).then((c) => c.put(req, salinan));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.protocol !== "http:" && u.protocol !== "https:") return;
  if (u.origin === location.origin) {
    // file milik aplikasi: ambil versi terbaru kalau online, cadangan dari cache kalau offline
    e.respondWith(fetch(req).then((r) => simpan(req, r)).catch(() => caches.match(req).then((m) => m || caches.match("index.html"))));
  } else {
    // pustaka luar (three.js, font): pakai cache dulu, simpan saat pertama kali online
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => simpan(req, r))));
  }
});
