/* Mini calculator on the home page (PT and EN). Same numbers and the same arithmetic as
   calculadora.html, both taken from calc-core.js; this file only reads the four fields, prints the
   result and keeps the "full calculation" link carrying the visitor's values
   (calculadora.html?ha=&cultura=&fonte=&energia=). Words come from the form's data-txt, set by the
   generator. On the grid it assumes the rural tariff without ICMS and the 60% irrigation discount,
   the cheapest grid case, so solar is never flattered. */
(function () {
  "use strict";
  var form = document.getElementById("mini");
  if (!form || !window.AgroCalc) return;
  var C = window.AgroCalc, K = C.K;
  var txt = JSON.parse(form.getAttribute("data-txt"));
  var lang = document.documentElement.lang || "pt-BR";
  var fmtR = new Intl.NumberFormat(lang, { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 });
  var ha = document.getElementById("mini-ha"), cultura = document.getElementById("mini-cultura");
  var eco = document.getElementById("mini-eco"), pb = document.getElementById("mini-pb");
  var per = document.getElementById("mini-per");
  var cta = document.getElementById("mini-cta"), base = cta.getAttribute("href").split("?")[0];

  function paybackText(p) {
    if (!isFinite(p) || p <= 0) return "–";
    if (p > txt.vida) return txt.alem;
    if (p < 1) return txt.lt1;
    return "~" + fmt1.format(p) + " " + (p < 2 ? txt.um : txt.mais);
  }

  function economia(haV, lamina, head, energia) {
    if (energia === "rede")
      return C.estimarRede(haV, lamina, head, K.ETA, K.ETA_MOTOR, K.TARIFA, K.IMPOSTO.isento, K.DESCONTO.sul).economia;
    if (energia === "gasolina") return C.estimar(haV, lamina, head, K.ETA, K.CEC_GASOLINA, K.GASOLINA).economia;
    return C.estimar(haV, lamina, head, K.ETA, K.CEC, K.DIESEL).economia;
  }

  function compute() {
    var haV = parseFloat(String(ha.value).replace(",", "."));
    var fonte = (form.querySelector("input[name=fonte]:checked") || {}).value;
    var energia = (form.querySelector("input[name=energia]:checked") || {}).value || "diesel";
    if (per && txt.per && txt.per[energia]) per.textContent = txt.per[energia];
    var ok = isFinite(haV) && haV >= K.HA.min && haV <= K.HA.max && K.HEAD[fonte] && K.LAMINA[cultura.value];
    ha.setAttribute("aria-invalid", ok ? "false" : "true");
    if (!ok) { eco.textContent = "–"; pb.textContent = "–"; cta.setAttribute("href", base); return; }
    var e = economia(haV, K.LAMINA[cultura.value], K.HEAD[fonte], energia);
    eco.textContent = fmtR.format(e);
    pb.textContent = paybackText(C.payback(C.custo(haV, fonte), e));
    cta.setAttribute("href", base + "?ha=" + encodeURIComponent(haV) + "&cultura=" + encodeURIComponent(cultura.value)
      + "&fonte=" + encodeURIComponent(fonte) + "&energia=" + encodeURIComponent(energia));
  }

  form.addEventListener("input", compute);
  form.addEventListener("change", compute);
  form.addEventListener("submit", function (e) { e.preventDefault(); compute(); });
  compute();
})();
