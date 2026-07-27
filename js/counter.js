// Sielsoord unique device counter — invisible, counts 1 per device forever
(function () {
  var KEY = "sielsoord_v";
  if (localStorage.getItem(KEY)) return; // already counted this device
  localStorage.setItem(KEY, "1");
  // Fire-and-forget ping to the Netlify Function
  fetch("/api/counter.js", { method: "POST", mode: "cors" }).catch(function () {});
})();
