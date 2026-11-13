// Кэширует сайт, чтобы он открывался без интернета. Чтобы обновить данные у всех, поменяйте номер версии.
var V = "katalog-v4";
var FILES = ["./", "index.html", "data.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "favicon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== V && k.indexOf("katalog-") === 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var u = new URL(e.request.url);
  var own = u.origin === location.origin;
  var font = u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com";
  if (!own && !font) return;
  if (own) {
    // свои файлы: сначала сеть (чтобы обновления доходили), без сети — кэш
    e.respondWith(
      fetch(e.request).then(function (r) {
        var c = r.clone();
        caches.open(V).then(function (x) { x.put(e.request, c); });
        return r;
      }).catch(function () {
        return caches.match(e.request).then(function (r) { return r || caches.match("index.html"); });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (n) {
          var c = n.clone();
          caches.open(V).then(function (x) { x.put(e.request, c); });
          return n;
        }).catch(function () { return r; });
      })
    );
  }
});
