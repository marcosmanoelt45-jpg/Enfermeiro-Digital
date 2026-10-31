if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (var i = 0; i < registrations.length; i++) {
      registrations[i].update().catch(function () {});
      registrations[i].unregister().catch(function () {});
    }
  }).catch(function () {});
}
if ('caches' in window) {
  caches.keys().then(function (keys) {
    for (var i = 0; i < keys.length; i++) {
      caches.delete(keys[i]).catch(function () {});
    }
  }).catch(function () {});
}

