/* Página inicial (08-10-2026, lab agrotech-home-2026-10). Duas coisas, sem dependências:
   1. O cartaz do filme: o botão com a marca (as quatro pétalas, com o triângulo) aparece por cima do
      vídeo. Sem JS o botão fica `hidden` e o vídeo mostra os controles normais. O vídeo tem
      preload="none": nada do filme é baixado antes do clique. O clique esconde o cartaz e dá play.
      Com o mouse, a marca inclina um pouco na direção do ponteiro; ao pressionar (mouse, toque, Enter
      ou Espaço) ela aperta e volta com uma mola. Com "reduzir movimento", sem inclinação.
   2. Os dois produtos: "Saiba mais" abre o resto da coluna com uma transição de altura suave; sem JS
      tudo fica aberto. */
(function () {
  "use strict";
  var reduz = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  function filme(box) {
    var btn = box.querySelector(".filme__tela"), v = box.querySelector("video");
    if (!btn || !v) return;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      btn.hidden = true;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
      v.focus();
    });
    btn.addEventListener("pointerdown", function () { btn.classList.add("press"); });
    ["pointerup", "pointercancel", "pointerleave", "blur"].forEach(function (ev) {
      btn.addEventListener(ev, function () { btn.classList.remove("press"); });
    });
    btn.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") btn.classList.add("press"); });
    btn.addEventListener("keyup", function () { btn.classList.remove("press"); });
    var t = btn.querySelector(".mp__tilt");
    if (!t || reduz) return;
    var raf = 0, rx = 0, ry = 0;
    function aplica() { raf = 0; t.style.setProperty("--rx", rx.toFixed(2) + "deg"); t.style.setProperty("--ry", ry.toFixed(2) + "deg"); }
    btn.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = btn.getBoundingClientRect(), m = t.getBoundingClientRect();
      ry = clamp((e.clientX - (m.left + m.width / 2)) / (r.width / 2), -1, 1) * 12;
      rx = -clamp((e.clientY - (m.top + m.height / 2)) / (r.height / 2), -1, 1) * 12;
      if (!raf) raf = requestAnimationFrame(aplica);
    });
    btn.addEventListener("pointerleave", function () { rx = 0; ry = 0; if (!raf) raf = requestAnimationFrame(aplica); });
  }

  function produto(b) {
    var painel = document.getElementById(b.getAttribute("aria-controls"));
    var txt = b.querySelector("span"), abre = txt.textContent, fecha = b.getAttribute("data-txt-fecha") || abre;
    if (!painel) return;
    painel.hidden = true;
    var anim = null;
    b.addEventListener("click", function () {
      var abrir = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", abrir ? "true" : "false");
      txt.textContent = abrir ? fecha : abre;
      if (anim) anim.cancel();
      if (reduz || !painel.animate) { painel.hidden = !abrir; return; }
      painel.hidden = false;
      var h = painel.offsetHeight;
      painel.style.overflow = "hidden";
      anim = painel.animate(abrir ? [{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }]
                                  : [{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
                            { duration: 560, easing: "cubic-bezier(.22,.9,.24,1)" });
      anim.onfinish = function () { anim = null; painel.style.overflow = ""; if (!abrir) painel.hidden = true; };
      anim.oncancel = function () { painel.style.overflow = ""; };
    });
  }

  function init() {
    [].forEach.call(document.querySelectorAll("[data-filme]"), filme);
    [].forEach.call(document.querySelectorAll("[data-abre]"), produto);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
