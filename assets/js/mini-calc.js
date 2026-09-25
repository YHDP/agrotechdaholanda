/* Mini calculator on the home page (PT and EN). Same numbers and the same arithmetic as
   calculadora.html, both taken from calc-core.js; this file only reads the three fields, prints the
   result and keeps the "full calculation" link carrying the visitor's values
   (calculadora.html?ha=&cultura=&fonte=). Words come from the form's data-txt, set by the generator. */
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
  var cta = document.getElementById("mini-cta"), base = cta.getAttribute("href").split("?")[0];

  function paybackText(p) {
    if (!isFinite(p) || p <= 0) return "–";
    if (p < 1) return txt.lt1;
    return "~" + fmt1.format(p) + " " + (p < 2 ? txt.um : txt.mais);
  }

  function compute() {
    var haV = parseFloat(String(ha.value).replace(",", "."));
    var fonte = (form.querySelector("input[name=fonte]:checked") || {}).value;
    var ok = isFinite(haV) && haV >= K.HA.min && haV <= K.HA.max && K.HEAD[fonte] && K.LAMINA[cultura.value];
    ha.setAttribute("aria-invalid", ok ? "false" : "true");
    if (!ok) { eco.textContent = "–"; pb.textContent = "–"; cta.setAttribute("href", base); return; }
    var est = C.estimar(haV, K.LAMINA[cultura.value], K.HEAD[fonte], K.ETA, K.CEC, K.DIESEL);
    eco.textContent = fmtR.format(est.economia);
    pb.textContent = paybackText(C.payback(C.custo(haV, fonte), est.economia));
    cta.setAttribute("href", base + "?ha=" + encodeURIComponent(haV) + "&cultura=" + encodeURIComponent(cultura.value)
      + "&fonte=" + encodeURIComponent(fonte));
  }

  form.addEventListener("input", compute);
  form.addEventListener("change", compute);
  form.addEventListener("submit", function (e) { e.preventDefault(); compute(); });
  compute();
})();
