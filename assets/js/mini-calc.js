/* Mini calculator on the home page (PT and EN). Same arithmetic as calculadora.html, from calc-core.js
   (AgroCalc.calcular with the crop's researched harvest defaults, area not yet irrigated); this file
   only reads the four fields, prints the result and keeps the "full calculation" link carrying the
   visitor's values. The title is always the combined potential payback in years and months, marked as
   an estimate (Yvo 05-10-2026); the line under it gives the gain per hectare. Words come from the form's
   data-txt, set by the generator. On the grid it assumes the rural tariff without ICMS and the 60%
   irrigation discount, the cheapest grid case, so solar is never flattered. */
(function () {
  "use strict";
  var form = document.getElementById("mini");
  if (!form || !window.AgroCalc) return;
  var C = window.AgroCalc, K = C.K;
  var txt = JSON.parse(form.getAttribute("data-txt"));
  var lang = document.documentElement.lang || "pt-BR";
  var fmtR = new Intl.NumberFormat(lang, { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  var ha = document.getElementById("mini-ha"), cultura = document.getElementById("mini-cultura");
  var pb = document.getElementById("mini-pb"), sub = document.getElementById("mini-sub");
  var cta = document.getElementById("mini-cta"), base = cta.getAttribute("href").split("?")[0];

  function compute() {
    var haV = parseFloat(String(ha.value).replace(",", "."));
    var fonte = (form.querySelector("input[name=fonte]:checked") || {}).value;
    var energia = (form.querySelector("input[name=energia]:checked") || {}).value || "diesel";
    var ok = isFinite(haV) && haV >= K.HA.min && haV <= K.HA.max && K.HEAD[fonte] && K.LAMINA[cultura.value];
    ha.setAttribute("aria-invalid", ok ? "false" : "true");
    if (!ok) { pb.textContent = "–"; sub.textContent = "–"; cta.setAttribute("href", base); return; }
    var d = C.padroesColheita(cultura.value, false);
    var r = C.calcular({ ha: haV, cultura: cultura.value, fonte: fonte, energia: energia, irrigado: false,
      preco: energia === "gasolina" ? K.GASOLINA : K.DIESEL, tarifa: K.TARIFA, imposto: "isento", desconto: "sul",
      lamina: K.LAMINA[cultura.value], head: K.HEAD[fonte], eta: K.ETA, etaMotor: K.ETA_MOTOR,
      cec: energia === "gasolina" ? K.CEC_GASOLINA : K.CEC, consumo: 0, consumoUnit: "litros",
      semKg: d.semKg, comKg: d.comKg, precoKg: d.precoKg });
    pb.textContent = C.tempo(r.payback, lang.slice(0, 2) === "en" ? "en" : "pt");
    sub.textContent = txt.sub.replace("{porha}", fmtR.format(r.total / haV));
    cta.setAttribute("href", base + "?ha=" + encodeURIComponent(haV) + "&cultura=" + encodeURIComponent(cultura.value)
      + "&fonte=" + encodeURIComponent(fonte) + "&energia=" + encodeURIComponent(energia));
  }

  form.addEventListener("input", compute);
  form.addEventListener("change", compute);
  form.addEventListener("submit", function (e) { e.preventDefault(); compute(); });
  compute();
})();
