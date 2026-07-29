// Sielsoord visit counter — fires on every page load
(function () {
  fetch("/api/counter.js", { method: "POST" }).catch(function () {});
})();
