/* Home map card (PT and EN): eight municípios are buttons on the rain map; choosing one fills the
   panel beside the map (under it on the phone), which never covers the map. Pressing the chosen one
   again, or Escape, clears the choice and the panel shows a short hint at the same height. The
   figures are pre-formatted by the generator in the JSON block #mapa-dados; this file only swaps
   text. São Paulo is chosen in the HTML, so the panel is complete without this script. */
(function () {
  "use strict";
  var card = document.getElementById("por-que-agora");
  var dados = document.getElementById("mapa-dados");
  var painel = document.getElementById("mapa-painel");
  if (!card || !dados || !painel) return;
  var D = JSON.parse(dados.textContent);
  var pinos = card.querySelectorAll(".mapa__pino");
  var campos = painel.querySelectorAll("[data-f]");
  var atual = null;
  for (var i = 0; i < pinos.length; i++) {
    if (pinos[i].getAttribute("aria-pressed") === "true") atual = pinos[i].getAttribute("data-code");
  }

  function escolher(code) {
    atual = code && D[code] ? code : null;
    for (var i = 0; i < pinos.length; i++) {
      var on = String(pinos[i].getAttribute("data-code") === atual);
      pinos[i].setAttribute("aria-pressed", on);
      pinos[i].setAttribute("aria-expanded", on);
    }
    if (!atual) { painel.setAttribute("data-vazio", ""); return; }
    var d = D[atual];
    for (var j = 0; j < campos.length; j++) campos[j].textContent = d[campos[j].getAttribute("data-f")];
    painel.removeAttribute("data-vazio");
  }

  for (var k = 0; k < pinos.length; k++) {
    pinos[k].addEventListener("click", function () {
      var code = this.getAttribute("data-code");
      escolher(code === atual ? null : code);
    });
  }
  card.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && atual) escolher(null);
  });
})();
