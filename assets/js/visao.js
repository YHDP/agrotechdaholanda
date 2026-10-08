/* Visão e estratégia · the page's motion (design lab agrotech-water-community-2026-10, round 6/7).
   [data-rio-lado="riacho"]  the stream in the left margin that fills to where you have read
   [data-ciclo="gota"]       the seven-step ring: one clock drives the drop and the pops, so they never lag
   .vr                       the rain map: every município appears at once, then each warms to its own score;
                             the numbers come only when São Paulo is chosen (assets/js/mapa-pinos.js)
   [data-nexo-anim]          the nexus image draws itself in, then steps through each circle and overlap
   .vis-tap                  the Tapajós photo and its digital dry-season version, cross-fading on screen
   Everything pauses off-screen and in background tabs; prefers-reduced-motion gets the finished state. */
(function () {
  "use strict";
  var REDUZ = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

  // ── the stream on one side ───────────────────────────────────────────────
  function Rio(root) {
    var modo = root.getAttribute("data-rio-lado") || "fio", riacho = modo === "riacho";
    var svg = el("svg", { "class": "rl__svg", "aria-hidden": "true", focusable: "false" });
    var leito = el("path", { "class": "rl__leito" }), agua = el("path", { "class": "rl__agua" }), fluxo = el("path", { "class": "rl__fluxo" });
    var gAgua = el("g", {}), gNos = el("g", {});
    svg.appendChild(leito); svg.appendChild(gAgua); if (!riacho) gAgua.appendChild(agua); svg.appendChild(fluxo); svg.appendChild(gNos);
    root.insertBefore(svg, root.firstChild);
    var segs = [].slice.call(root.querySelectorAll("[data-no]")), nos = [], H = 0, X = 0, A = 0, t = 0, pts = [], raf = 0, vis = false, ult = 0, lido = 0;
    var pedacos = [];
    function mede() {
      var r = root.getBoundingClientRect(); H = root.scrollHeight;
      var largo = window.innerWidth > 860;
      X = largo ? 40 : 15; A = largo ? 15 : 5.5;
      svg.setAttribute("width", largo ? 80 : 30); svg.setAttribute("height", H); svg.setAttribute("viewBox", "0 0 " + (largo ? 80 : 30) + " " + H);
      gNos.innerHTML = ""; nos = [];
      segs.forEach(function (s) {
        var y = s.getBoundingClientRect().top - r.top + (largo ? 14 : 10);
        var c = el("circle", { "class": "rl__no", r: largo ? 8 : 6 }); gNos.appendChild(c); nos.push({ y: y, c: c, s: s });
      });
      if (riacho) {
        gAgua.innerHTML = ""; pedacos = [];
        for (var i = 0; i < 24; i++) { var p = el("path", { "class": "rl__agua", "stroke-width": (1.6 + i / 23 * (largo ? 6 : 3.2)).toFixed(2) }); gAgua.appendChild(p); pedacos.push(p); }
      }
    }
    function xAt(y) {   // travelling wave: the snake slides downward, very slowly
      var w = 2 * Math.PI * y / 360, mod = 1 + 0.28 * Math.sin(y / 1100 + 0.6);
      return X + A * mod * Math.sin(w - t * 0.22) + A * 0.18 * Math.sin(y / 97 - t * 0.31);
    }
    function desenha() {
      var d = "", passo = 8; pts = [];
      for (var y = 0; y <= H; y += passo) { var x = xAt(y); pts.push([x, y]); d += (y ? "L" : "M") + x.toFixed(1) + " " + y; }
      leito.setAttribute("d", d); fluxo.setAttribute("d", d);
      if (!riacho) agua.setAttribute("d", d);
      else {
        var ate = clamp(lido, 0, H), n = pedacos.length;
        for (var i = 0; i < n; i++) {
          var y0 = H * i / n, y1 = H * (i + 1) / n, dd = "";
          if (y0 > ate) { pedacos[i].setAttribute("d", ""); continue; }
          y1 = Math.min(y1, ate);
          for (var yy = y0; yy <= y1 + 0.1; yy += passo) dd += (yy === y0 ? "M" : "L") + xAt(yy).toFixed(1) + " " + yy.toFixed(1);
          pedacos[i].setAttribute("d", dd);
        }
        fluxo.style.clipPath = "inset(0 0 " + Math.max(0, H - ate) + "px 0)";
      }
      nos.forEach(function (n) {
        n.c.setAttribute("cx", xAt(n.y).toFixed(1)); n.c.setAttribute("cy", n.y);
        n.c.classList.toggle("rl__no--cheio", !riacho || lido >= n.y);
      });
      fluxo.style.strokeDashoffset = (-t * 16).toFixed(1);
    }
    function leitura() { var r = root.getBoundingClientRect(); lido = REDUZ ? H : clamp(window.innerHeight * 0.62 - r.top, 0, H); }
    function loop(now) {
      if (!vis) return;
      var dt = Math.min(0.05, (now - (ult || now)) / 1000); ult = now; t += dt;
      if (riacho) { var alvo = leitura2(); lido += (alvo - lido) * Math.min(1, dt * 2.5); }
      desenha(); raf = requestAnimationFrame(loop);
    }
    function leitura2() { var r = root.getBoundingClientRect(); return clamp(window.innerHeight * 0.62 - r.top, 0, H); }
    mede(); leitura(); desenha();
    addEventListener("resize", function () { mede(); desenha(); });
    addEventListener("load", function () { mede(); leitura(); desenha(); });
    if (REDUZ) { root.classList.add("rl--parado"); return; }
    function liga() { if (vis) return; vis = true; ult = 0; raf = requestAnimationFrame(loop); }
    function desl() { vis = false; cancelAnimationFrame(raf); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && !document.hidden) liga(); else desl(); }).observe(root);
    else liga();
    document.addEventListener("visibilitychange", function () { if (document.hidden) desl(); else liga(); });
  }

  // ── the cycle ring, one clock ────────────────────────────────────────────
  function Ciclo(root) {
    var modo = root.getAttribute("data-ciclo") || "gota", svgs = [].slice.call(root.querySelectorAll("svg.anel"));
    var CX = 930, CY = 430, R = 212, N = 7, T = 9.1, POR = T / N;   // 1.3 s per step
    var t = 0, raf = 0, vis = false, ult = 0;
    var partes = svgs.map(function (s) {
      var nos = [].slice.call(s.querySelectorAll(".no"));
      var trilha = el("circle", { cx: CX, cy: CY, r: R, fill: "none", "class": "ciclo__trilha", pathLength: 360, transform: "rotate(-90 " + CX + " " + CY + ")" });
      var gota = el("circle", { r: 10, "class": "ciclo__gota" }), cauda = [];
      var gCauda = el("g", {});
      for (var i = 0; i < 7; i++) { var c = el("circle", { r: 7 - i * 0.8, "class": "ciclo__cauda" }); gCauda.appendChild(c); cauda.push(c); }
      var antes = s.querySelector(".ciclo__nos");
      if (modo === "enche") s.insertBefore(trilha, antes);
      else { s.insertBefore(gCauda, antes); s.insertBefore(gota, antes); }
      return { nos: nos, trilha: trilha, gota: gota, cauda: cauda };
    });
    function pos(ang) { var a = (ang - 90) * Math.PI / 180; return [CX + Math.cos(a) * R, CY + Math.sin(a) * R]; }
    function quadro() {
      var f = (t % T) / T, ang = f * 360;   // 0 at Sol, clockwise, the same order as the steps
      partes.forEach(function (p) {
        if (modo === "gota") {
          var g = pos(ang); p.gota.setAttribute("cx", g[0].toFixed(1)); p.gota.setAttribute("cy", g[1].toFixed(1));
          p.cauda.forEach(function (c, i) { var q = pos(ang - (i + 1) * 4.2); c.setAttribute("cx", q[0].toFixed(1)); c.setAttribute("cy", q[1].toFixed(1)); c.style.opacity = (0.55 - i * 0.07).toFixed(2); });
        } else {
          var cheio = Math.min(360, f * 360 * 1.12);   // reaches the last node, then holds full briefly
          p.trilha.style.strokeDasharray = cheio.toFixed(1) + " 400";
          p.trilha.style.opacity = f > 0.93 ? (1 - (f - 0.93) / 0.07).toFixed(2) : 1;
        }
        p.nos.forEach(function (n, i) {
          var alvo = i * 360 / N, d;
          if (modo === "gota") d = ((ang - alvo) % 360 + 360) % 360;      // degrees since the drop passed node i
          else d = Math.min(360, f * 360 * 1.12) - alvo;
          // pop: rises in the last 6 degrees before arrival, peaks AT arrival, settles over ~35 degrees
          var antes2 = modo === "gota" ? 360 - d : -d, k = 0;
          if (modo === "gota" && antes2 < 6) k = 1 - antes2 / 6;
          else if (d >= 0 && d < 35) k = Math.exp(-d / 9);
          var s = 1 + 0.15 * k;
          n.style.transform = "scale(" + s.toFixed(3) + ")";
          if (modo === "enche") n.classList.toggle("no--cheio", d >= 0 && f < 0.97);
          else n.style.fill = k > 0.02 ? "rgb(" + Math.round(255 - 28 * k) + "," + Math.round(255 - 11 * k) + ",255)" : "#fff";
        });
      });
    }
    function loop(now) { if (!vis) return; var dt = Math.min(0.05, (now - (ult || now)) / 1000); ult = now; t += dt; quadro(); raf = requestAnimationFrame(loop); }
    if (REDUZ) { t = modo === "enche" ? T * 0.9 : 0.01; quadro(); if (modo === "gota") partes.forEach(function (p) { p.gota.style.display = "none"; p.cauda.forEach(function (c) { c.style.display = "none"; }); }); return; }
    quadro();
    function liga() { if (vis) return; vis = true; ult = 0; raf = requestAnimationFrame(loop); }
    function desl() { vis = false; cancelAnimationFrame(raf); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && !document.hidden) liga(); else desl(); }, { threshold: 0.15 }).observe(root);
    else liga();
    document.addEventListener("visibilitychange", function () { if (document.hidden) desl(); else liga(); });
  }

  // reveal-once for segments
  function revela() {
    var els = document.querySelectorAll("[data-revela]");
    if (REDUZ || !("IntersectionObserver" in window) || /[?&]tudo=1/.test(location.search)) { [].forEach.call(els, function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.15 });
    [].forEach.call(els, function (e) { io.observe(e); });
  }
  function tapajos() {
    var t = document.querySelector(".vis-tap"); if (!t || REDUZ || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) { t.classList.toggle("em-tela", es[0].isIntersecting); }).observe(t);
  }
  function mapaENexo() {
  "use strict";
  var R = REDUZ;
  // ── risk map: every município appears at once in the lightest colour, then a single rising level
  //    lifts each one toward its own score, so low-change areas stop early and the darkest keep warming ──
  var sec = document.querySelector(".vr");
  if (sec) (function () {
    var img = sec.querySelector(".vr-img img"), cv = sec.querySelector(".vr-cv"), feito = false;
    function escolhe() { if (feito) return; feito = true; sec.classList.add("escolhido"); var b = sec.querySelector('[data-code="3550308"]'); if (b) b.click(); }
    if (R || !cv.getContext || !("IntersectionObserver" in window)) { sec.classList.add("pronto"); escolhe(); return; }
    var STOPS = [[253, 238, 228], [250, 210, 187], [247, 177, 140], [241, 136, 91], [221, 97, 48], [168, 60, 19]];
    var W, H, base, score, alvoMask, ctx, out, lut = [];
    for (var i = 0; i <= 255; i++) { var t = i / 255 * (STOPS.length - 1), a = Math.min(STOPS.length - 2, Math.floor(t)), f = t - a;
      lut.push([0, 1, 2].map(function (c) { return Math.round(STOPS[a][c] + (STOPS[a + 1][c] - STOPS[a][c]) * f); })); }
    function prepara() {
      W = img.naturalWidth; H = img.naturalHeight; cv.width = W; cv.height = H; ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, W, H); base = ctx.getImageData(0, 0, W, H); out = ctx.createImageData(W, H);
      var d = base.data, n = W * H; score = new Uint8Array(n); alvoMask = new Uint8Array(n);
      for (var p = 0; p < n; p++) {
        var o = p * 4, r = d[o], g = d[o + 1], b = d[o + 2];
        if (d[o + 3] < 10 || (r > 248 && g > 246 && b > 242)) continue;   // paper background stays
        var best = 1e9, bs = 0;
        for (var k = 0; k < STOPS.length - 1; k++) {   // nearest point on the colour ramp
          var A = STOPS[k], B = STOPS[k + 1], vx = B[0] - A[0], vy = B[1] - A[1], vz = B[2] - A[2], L2 = vx * vx + vy * vy + vz * vz;
          var u = Math.max(0, Math.min(1, ((r - A[0]) * vx + (g - A[1]) * vy + (b - A[2]) * vz) / L2));
          var dx = r - A[0] - vx * u, dy = g - A[1] - vy * u, dz = b - A[2] - vz * u, dd = dx * dx + dy * dy + dz * dz;
          if (dd < best) { best = dd; bs = (k + u) / (STOPS.length - 1); }
        }
        if (best > 2600) continue;   // outlines and anything off the ramp stay as they are
        alvoMask[p] = 1; score[p] = Math.round(bs * 255);
      }
    }
    function pinta(L) {
      var d = base.data, q = out.data, n = W * H, lim = Math.round(L * 255);
      for (var p = 0; p < n; p++) {
        var o = p * 4;
        if (!alvoMask[p]) { q[o] = d[o]; q[o + 1] = d[o + 1]; q[o + 2] = d[o + 2]; q[o + 3] = d[o + 3]; continue; }
        var c = lut[score[p] < lim ? score[p] : lim]; q[o] = c[0]; q[o + 1] = c[1]; q[o + 2] = c[2]; q[o + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
    }
    function corre() {
      sec.classList.add("aparece"); pinta(0);
      var t0 = performance.now() + 900, D = 5600;
      (function passo() {
        var u = Math.max(0, Math.min(1, (performance.now() - t0) / D)), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        pinta(e);
        if (u < 1) setTimeout(passo, 90); else setTimeout(escolhe, 700);
      })();
    }
    function inicia() {
      try { prepara(); } catch (err) { sec.classList.add("pronto"); escolhe(); return; }
      sec.classList.add("canvas"); pinta(0);
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); corre(); } }, { threshold: 0.35 });
      io.observe(sec.querySelector(".vr-img"));
    }
    if (img.complete && img.naturalWidth) inicia(); else img.addEventListener("load", inicia);
  })();

  // ── nexus: the original image draws itself in, then steps through each circle and overlap ──
  var nx = document.querySelector("[data-nexo-anim]");
  if (!nx) return;
  var fig = nx.querySelector(".nexo-anim__fig"), bs = [].slice.call(nx.querySelectorAll("[data-nx-b]")), ks = bs.map(function (b) { return b.getAttribute("data-nx-b"); });
  var i = -1, vis = false, manual = 0, pronto = false;
  function mostra(k) { fig.setAttribute("data-p", k); bs.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-nx-b") === k ? "true" : "false"); }); }
  bs.forEach(function (b) { b.addEventListener("click", function () { fig.classList.add("nf-on", "pronto"); pronto = true; i = ks.indexOf(b.getAttribute("data-nx-b")); mostra(ks[i]); manual = Date.now() + 10000; }); });
  if (R) { fig.classList.add("nf-on", "pronto", "nexo-anim--todos"); return; }
  function passo() { if (!vis || !pronto || Date.now() < manual) return; i = (i + 1) % ks.length; mostra(ks[i]); }
  new IntersectionObserver(function (es) {
    vis = es[0].isIntersecting;
    if (vis && !fig.classList.contains("nf-on")) { fig.classList.add("nf-on"); setTimeout(function () { fig.classList.add("pronto"); pronto = true; passo(); }, 4400); }
  }, { threshold: 0.3 }).observe(fig);
  setInterval(passo, 4200);
  }
  function init() { [].forEach.call(document.querySelectorAll("[data-rio-lado]"), Rio); [].forEach.call(document.querySelectorAll("[data-ciclo]"), Ciclo); revela(); tapajos(); mapaENexo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
