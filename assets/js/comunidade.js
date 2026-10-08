/* Comunidade da água · Agrotech da Holanda (design lab agrotech-water-community-2026-10, round 7).
   One procedural river-delta world drawn with canvas 2D: no libraries, no network. Each stage is a
   <div class="wc" data-wc="KEY"> with its configuration in <script type="application/json" id="wc-cfg-KEY">
   (JSON, never executed: the CSP keeps script-src 'self'). English pages add #wc-txt, a PT -> EN table.
   Paused off-screen (IntersectionObserver) and in background tabs; prefers-reduced-motion gets a still. */
(function () {
  "use strict";
  var WW = 1600, WH = 1000, M = 240, STEP = 3;
  var REDUZ = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var Q = new URLSearchParams(location.search);
  var TXT = {};
  function tr(x) { return TXT[x] || x; }

  // ── small utils ──────────────────────────────────────────────────────────
  function lerp(a, b, k) { return a + (b - a) * k; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function ease(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function easeS(u) { return -(Math.cos(Math.PI * u) - 1) / 2; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var HC = {};
  function hx(h) { return HC[h] || (HC[h] = hex(h)); }
  function mix(a, b, k) { var x = hx(a), y = hx(b); k = clamp(k, 0, 1); return "rgb(" + Math.round(lerp(x[0], y[0], k)) + "," + Math.round(lerp(x[1], y[1], k)) + "," + Math.round(lerp(x[2], y[2], k)) + ")"; }
  function mixh(a, b, k) { var x = hx(a), y = hx(b); k = clamp(k, 0, 1); var r = function (i) { var v = Math.round(lerp(x[i], y[i], k)).toString(16); return v.length < 2 ? "0" + v : v; }; return "#" + r(0) + r(1) + r(2); }
  function rgba(h, a) { var x = hx(h); return "rgba(" + x[0] + "," + x[1] + "," + x[2] + "," + clamp(a, 0, 1).toFixed(3) + ")"; }
  function rnd(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function hash(x, y) { var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
  }
  function fbm(x, y) { return 0.55 * vnoise(x, y) + 0.3 * vnoise(x * 2.1 + 7, y * 2.1 + 3) + 0.15 * vnoise(x * 4.3 + 1, y * 4.3 + 9); }

  // ── palettes (land that looks like land) ─────────────────────────────────
  var PAL = {
    papelVerde: { nome: "Papel verde", fundo: "#EEF0DE", fundo2: "#E2E8CC", relevoL: "#FFFFFF", relevoE: "#7E8F68", terra: "#D49A74", estrada: "#E0CDB2", relevo: 1.3,
      campos: ["#CFE0B0", "#BCD49C", "#DCE0BA", "#E2D6B2", "#AFCC8E", "#E6E6C6", "#CBD3A4", "#C4DBA6"], capim: "#E3E5C6", pivo: "#B4D290", pivoSeco: "#E3D2A9",
      floresta: "#8FB47C", florestaE: "#79A06A", copa: "#A2C38E", copaL: "#C3DBAE", sombra: "rgba(70,90,50,.20)", seco: "#E8CF9C",
      leito: "#F0E5C9", agua: "#8ACCEB", aguaE: "#5DB8E6", aguaL: "#D4EEF9", linhaAgua: "#38B6FF", mar: "#C3E4F0", marE: "#A9D8EC", areia: "#F4EAD0", mangue: "#86AE78",
      telhado: ["#E8B49A", "#EBC4A8", "#D9D3C9", "#EEE9DF", "#DFA287"], parede: "#E7E0D3", cidade: "#EEE8DC", solo: "#DDBB98", soloMolhado: "#B48C68", texto: "#14263C", cor: "#FF914D" },
    papelRelevo: { nome: "Papel verde com relevo", fundo: "#ECEFDA", fundo2: "#DCE4C3", relevoL: "#FFFFFF", relevoE: "#6E7F55", terra: "#D49A74", estrada: "#E0CDB2", relevo: 2.4, morros: 1,
      campos: ["#CBDEAA", "#B5CF92", "#DADFB4", "#E0D3AC", "#A6C784", "#E5E5C2", "#C6CF9C", "#BFD89F"], capim: "#E0E3C0", pivo: "#ADCD86", pivoSeco: "#E3D2A9",
      floresta: "#7FA86C", florestaE: "#678F59", copa: "#94B97F", copaL: "#BDD6A6", sombra: "rgba(60,80,40,.26)", seco: "#E8CF9C",
      leito: "#F0E5C9", agua: "#86CAEA", aguaE: "#55B4E4", aguaL: "#D2EDF9", linhaAgua: "#38B6FF", mar: "#C0E2EF", marE: "#A3D4EA", areia: "#F4EAD0", mangue: "#7AA36B",
      telhado: ["#E2A98D", "#E8BE9F", "#D6D0C5", "#ECE6DB", "#D8977B"], parede: "#E4DCCD", cidade: "#ECE6D9", solo: "#DAB591", soloMolhado: "#AE8662", texto: "#14263C", cor: "#FF914D" },
    cerrado: { nome: "Cerrado claro", fundo: "#ECE3CC", fundo2: "#E2D5B5", relevoL: "#FFF8E8", relevoE: "#9C7A52", terra: "#C97A50", estrada: "#D7B593",
      campos: ["#BFC98A", "#A9BD76", "#D4C892", "#CDB083", "#94B06B", "#DCD3A2", "#B7A36F", "#C9C27E"], capim: "#DCCDA0", pivo: "#9DBA6E", pivoSeco: "#CDB27A",
      floresta: "#6E8F5C", florestaE: "#55774B", copa: "#7FA06A", copaL: "#9DB985", sombra: "rgba(70,55,30,.22)", seco: "#D8B77A",
      leito: "#E9D7AE", agua: "#6DB0C8", aguaE: "#4C97B7", aguaL: "#BFE2EA", linhaAgua: "#FFFFFF", mar: "#A9D3DA", marE: "#88C0CC", areia: "#F1E4C2", mangue: "#5D7F55",
      telhado: ["#C8714E", "#D88F66", "#BDB6A9", "#E3DCCF", "#B9644A"], parede: "#D9CFBF", cidade: "#E2DBCB", solo: "#C79A6E", soloMolhado: "#9E7653", texto: "#14263C", cor: "#FF914D" },
    satelite: { nome: "Satélite suave", fundo: "#D9D2BC", fundo2: "#CFC6A8", relevoL: "#F4EEDC", relevoE: "#7D6A4C", terra: "#B9805A", estrada: "#CBB79A",
      campos: ["#A7B37C", "#8FA56B", "#BDB385", "#C2A884", "#7E9C62", "#C9C29C", "#A99A6F", "#B6B884"], capim: "#CFC39C", pivo: "#86A564", pivoSeco: "#C2A877",
      floresta: "#4F6E48", florestaE: "#3E5C3B", copa: "#5E7F53", copaL: "#7A9868", sombra: "rgba(40,40,25,.25)", seco: "#CFAE79",
      leito: "#DCCDA9", agua: "#6F9E9F", aguaE: "#557F86", aguaL: "#B4CFC9", linhaAgua: "#F4FBF8", mar: "#90B9BC", marE: "#729FA8", areia: "#E6DBBE", mangue: "#4A6646",
      telhado: ["#B86F52", "#C98A6A", "#B0ABA2", "#D8D2C6", "#A65F48"], parede: "#CEC5B5", cidade: "#D6CFBF", solo: "#B98F68", soloMolhado: "#8E6C4E", texto: "#14263C", cor: "#FF914D" },
    papel: { nome: "Mapa de papel", fundo: "#F6F1E6", fundo2: "#EFE8D8", relevoL: "#FFFFFF", relevoE: "#B49A78", terra: "#D9A07C", estrada: "#E2CDB3",
      campos: ["#DDE5C2", "#CFDDB1", "#E6E1C2", "#E3D3B7", "#C6D8A8", "#ECE7CD", "#D9D1AE", "#D7E0B6"], capim: "#ECE5CD", pivo: "#C4D9A0", pivoSeco: "#E3D2A9",
      floresta: "#A9C494", florestaE: "#93B37E", copa: "#B5CEA0", copaL: "#CADDB8", sombra: "rgba(120,100,70,.16)", seco: "#E8CF9C",
      leito: "#F0E5C9", agua: "#8ACCEB", aguaE: "#5DB8E6", aguaL: "#D4EEF9", linhaAgua: "#38B6FF", mar: "#C9E7F3", marE: "#B2DCEE", areia: "#F4EAD0", mangue: "#97B784",
      telhado: ["#E8B49A", "#EBC4A8", "#D9D3C9", "#EEE9DF", "#DFA287"], parede: "#E7E0D3", cidade: "#EEE8DC", solo: "#DDBB98", soloMolhado: "#C09A76", texto: "#14263C", cor: "#FF914D" },
    dourado: { nome: "Fim de tarde", fundo: "#EBD6B2", fundo2: "#E2C89F", relevoL: "#FFF1D6", relevoE: "#8A5E3A", terra: "#C46B42", estrada: "#D9AE86",
      campos: ["#C2C07F", "#ABB36C", "#D8C185", "#D3A774", "#9DA862", "#E0CB95", "#BE9A62", "#CDB874"], capim: "#E0C590", pivo: "#A9B466", pivoSeco: "#D6AE70",
      floresta: "#6C8250", florestaE: "#526941", copa: "#7E935D", copaL: "#A2AE76", sombra: "rgba(90,50,20,.30)", seco: "#E0AF6C",
      leito: "#EED3A2", agua: "#69A9BE", aguaE: "#468FAB", aguaL: "#F3D9AE", linhaAgua: "#FFF4E0", mar: "#9FC6CB", marE: "#7FB0BB", areia: "#F2DCB2", mangue: "#5B744B",
      telhado: ["#C2603F", "#D5835A", "#BBAE9E", "#E1D3BE", "#AE5539"], parede: "#DDC8AA", cidade: "#E3D3B9", solo: "#C98F60", soloMolhado: "#9B6C47", texto: "#14263C", cor: "#FF914D" }
  };

  // ── scenes ───────────────────────────────────────────────────────────────
  var BASE = { agua: 1, chuva: 0, seco: 0, sujo: 0, desvio: 0, irr: 0.45, sua: 0.9, viz: 0.9, pivo: 0.35, nuvem: 0.25, res: 0.55, poco: 0.3, fert: 0, smart: 0.5, agro: 1, fruto: 0.6, qual: 0, previsao: 0, frio: 0 };
  function C(nome, txt, s, tag, grupo) { var o = {}, k2; for (k2 in BASE) o[k2] = BASE[k2]; for (k2 in s) o[k2] = s[k2]; return { nome: nome, txt: txt, s: o, tag: tag, grupo: grupo }; }
  function J(a, b) { var o = {}, k2; for (k2 in a) o[k2] = a[k2]; for (k2 in b) o[k2] = b[k2]; return o; }
  var sSeca = { agua: 0.25, seco: 1, irr: 0.7, sua: 0.15, viz: 0.2, pivo: 0.15, nuvem: 0, res: 0.04, poco: 0 };
  var sCheia = { agua: 2.1, chuva: 1, irr: 0, sua: 0.45, viz: 0.4, pivo: 0, nuvem: 1, res: 0.3 };
  var sDesvio = { desvio: 1, seco: 0.35, irr: 0.7, sua: 0.3, viz: 0.3, pivo: 1, nuvem: 0, res: 0.1, poco: 0 };
  var CENAS = {
    equilibrio: C("Equilíbrio", "Água para todos. A nascente, a floresta, a indústria, os vizinhos, a sua roça e a cidade dividem o mesmo rio.", {}),
    seca: C("Seca", "Na seca o rio baixa e aparecem bancos de areia. A água fica longe da captação e a bomba não alcança. A lavoura murcha.", sSeca),
    cheia: C("Cheia", "Na cheia o rio sai da calha. A água ocupa as várzeas e forma lagoas onde antes era roça.", sCheia),
    suja: C("Água suja", "Um despejo da indústria rio acima. A mancha desce o rio e chega à sua captação: a água que você bombeia vem suja.", { sujo: 1, irr: 0.6, sua: 0.55, viz: 0.6 }),
    desvio: C("Desperdício rio acima", "Uma fazenda rio acima tira água demais. O rio afina e, na sua captação, chega pouca.", sDesvio),
    medida: C("Irrigação na medida", "A planta recebe o que pede, você colhe mais e o rio segue vivo.", { irr: 1, sua: 1, viz: 0.9, pivo: 0.3, seco: 0.2, nuvem: 0.15, res: 0.7, poco: 0.5, fert: 0.7, smart: 1, fruto: 1 }),
    murcha: C("Lavoura murcha", "Calor e pouca água. As folhas amarelam e caem, o fruto não enche e a colheita se perde.", { agua: 0.4, seco: 0.95, irr: 0, sua: 0.04, viz: 0.25, pivo: 0.1, nuvem: 0, fruto: 0, res: 0.04, poco: 0 }),
    cheiaSem: C("Cheia", "A cheia alaga a roça e leva o solo. A água passa e vai embora.", J(sCheia, { agro: 0, res: 0 }), "sem", "cheia"),
    cheiaCom: C("Cheia", "A fazenda não vai para debaixo d'água: o excesso vai para a represa do projeto da fazenda e fica guardado para a seca.", J(sCheia, { res: 1, sua: 0.95, viz: 0.4 }), "com", "cheia"),
    secaSem: C("Seca", "O rio baixa e a bomba não alcança a água. A lavoura murcha.", J(sSeca, { agro: 0, res: 0 }), "sem", "seca"),
    secaCom: C("Seca", "A água guardada na represa e o poço com bomba submersa mantêm o gotejamento. A lavoura segue verde.", J(sSeca, { irr: 0.8, sua: 1, res: 0.35, poco: 1, smart: 1 }), "com", "seca"),
    desvioSem: C("Desperdício rio acima", "Rio acima tiram água demais. Na sua captação chega pouca, e a lavoura sente.", J(sDesvio, { agro: 0 }), "sem", "desvio"),
    desvioCom: C("Desperdício rio acima", "Sensores no solo e o aplicativo mostram quanto a planta pede. Você tira do rio só isso, medido em metros cúbicos.", J(sDesvio, { irr: 0.45, sua: 0.95, smart: 1, poco: 0.6, res: 0.25 }), "com", "desvio"),
    colheitaSem: C("Colheita", "Água sem nutriente na hora certa: a planta vive, mas o fruto não enche.", { irr: 0.6, sua: 0.72, fruto: 0.2, agro: 0, res: 0 }, "sem", "colheita"),
    colheitaCom: C("Colheita", "Fertirrigação: o adubo vai junto com a água, na medida. Mais colheita com a mesma água.", { irr: 1, sua: 1, fruto: 1, fert: 1, smart: 1, res: 0.25 }, "com", "colheita"),
    sujaSem: C("Água suja", "Um despejo da indústria rio acima chega à sua captação. A bomba manda a água ruim para a lavoura, e a lavoura sofre.", { sujo: 1, irr: 0.7, sua: 0.25, viz: 0.55, agro: 0, res: 0 }, "sem", "suja"),
    sujaCom: C("Água suja", "O sensor na captação detecta a água ruim e a irrigação para. A represa e o poço seguram a lavoura até o rio limpar.", { sujo: 1, irr: 0.7, sua: 0.95, viz: 0.55, qual: 1, res: 0.45, poco: 1, smart: 1 }, "com", "suja"),
    chuvaVem: C("Chuva prevista", "A estação meteorológica vê a chuva chegando. A irrigação para antes, e nenhuma gota é bombeada à toa.", { irr: 0, sua: 1, nuvem: 1, previsao: 1, res: 0.6, smart: 1, fruto: 0.8 }, "com", "chuva"),
    chuvaCai: C("Chuva prevista", "A chuva rega a lavoura. A bomba fica parada e a represa recebe a água.", { irr: 0, sua: 1, chuva: 0.8, nuvem: 1, previsao: 0.4, res: 0.85, smart: 1, fruto: 0.8 }, "com", "chuva"),
    frioCom: C("Frio pós-colheita", "Você colhe o cacau e leva direto para a câmara fria solar. A colheita dura mais e você vende na hora certa.", { irr: 0.5, sua: 1, fruto: 0.5, frio: 1, smart: 1, res: 0.5 }, "com", "colheita"),
    intro0: C("Conheça a fazenda", "Um só sistema, movido a sol, da captação até a venda.", { irr: 0.8, sua: 1, fert: 0.6, smart: 1, res: 0.6, poco: 0.4, fruto: 0.8, qual: 1 }),
    intro1: C("Energia solar e bomba", "Os painéis movem a bomba. Sem diesel e sem esperar a rede.", { irr: 0.8, sua: 1, smart: 1, res: 0.6, fruto: 0.8, qual: 1 }),
    intro2: C("Captação medida", "O medidor mostra quanta água sai do rio. Um sensor na captação vigia a qualidade da água.", { irr: 0.8, sua: 1, smart: 1, res: 0.6, fruto: 0.8, qual: 1 }),
    intro3: C("Poço e represa", "Um poço com bomba submersa e uma represa, do projeto da fazenda, guardam água para a seca.", { irr: 0.8, sua: 1, smart: 1, res: 0.6, poco: 1, fruto: 0.8, qual: 1 }),
    intro4: C("Gotejamento e sensores de solo", "Os sensores medem a umidade do solo. O gotejamento leva a água até a raiz.", { irr: 1, sua: 1, smart: 1, res: 0.6, fruto: 0.8, qual: 1 }),
    intro5: C("Irrigação inteligente", "O controle e o aplicativo juntam o solo e o clima: a bomba liga quando a planta pede e para quando vem chuva.", { irr: 0.8, sua: 1, smart: 1, res: 0.6, fruto: 0.8, qual: 1 }),
    intro6: C("Microaspersão e fertirrigação", "No cacau, a microaspersão molha sob a copa. A fertirrigação leva o adubo junto com a água.", { irr: 1, sua: 1, smart: 1, fert: 1, res: 0.6, fruto: 1, qual: 1 }),
    intro7: C("Frio pós-colheita", "A câmara fria solar guarda a colheita na própria fazenda.", { irr: 0.6, sua: 1, smart: 1, res: 0.6, fruto: 0.8, frio: 1, qual: 1 }),
    estresse: C("Comunidade sob pressão", "", { seco: 0.45, viz: 0.35, agua: 0.75, desvio: 0.45, pivo: 0.8, irr: 0.4, sua: 0.85, nuvem: 0 }),
    virada: C("Agora, com Agrotech da Holanda", "Os mesmos riscos. Agora com bomba solar, represa no projeto da fazenda, poço, sensores e irrigação na medida.", {}, "com", "virada")
  };
  var ORDEM = ["equilibrio", "seca", "cheia", "suja", "desvio", "medida"];

  // ── world (generated once, in landscape coordinates) ─────────────────────
  var MUNDO = null;
  function catmull(ctrl, per) {
    var out = [];
    for (var i = 0; i < ctrl.length - 1; i++) {
      var p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (var j = 0; j < per; j++) {
        var t = j / per, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }
  function resample(pts, step) {
    var out = [pts[0].slice()], acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), pos = 0;
      while (acc + d - pos >= step) { var k = (pos + step - acc) / d; pos += step - acc; acc = 0; out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); }
      acc += d - pos;
    }
    return out;
  }
  function normais(p) {
    var n = [];
    for (var j = 0; j < p.length; j++) { var a = p[Math.max(0, j - 2)], b = p[Math.min(p.length - 1, j + 2)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; n.push([-dy / l, dx / l]); }
    return n;
  }
  function canal(id, ctrl, w0, w1, amp, lam, seed) {
    var p = resample(catmull(ctrl, 24), STEP), n = normais(p), L = p.length;
    if (amp) {   // meander: a slow lateral wave, tapered at both ends
      for (var i = 0; i < L; i++) { var s = i * STEP, tap = sstep(0, 60, s) * sstep(0, 60, (L - 1 - i) * STEP);
        var o = amp * tap * (Math.sin(s / lam + seed) + 0.35 * Math.sin(s / (lam * 0.43) + seed * 2.3)); p[i] = [p[i][0] + n[i][0] * o, p[i][1] + n[i][1] * o]; }
      p = resample(p, STEP); n = normais(p); L = p.length;
    }
    var c = { id: id, n: L, x: new Float32Array(L), y: new Float32Array(L), nx: new Float32Array(L), ny: new Float32Array(L), wb: new Float32Array(L),
              q: new Float32Array(L), c: new Float32Array(L), len: (L - 1) * STEP, filhos: [] };
    for (var k = 0; k < L; k++) { c.x[k] = p[k][0]; c.y[k] = p[k][1]; c.nx[k] = n[k][0]; c.ny[k] = n[k][1]; c.wb[k] = lerp(w0, w1, Math.pow(k / (L - 1), 0.8)); c.q[k] = 1; }
    return c;
  }
  function idxAt(ch, f) { return clamp(Math.round(f * (ch.n - 1)), 0, ch.n - 1); }
  function margem(ch, f, lado, dist) { var i = idxAt(ch, f); var o = (ch.wb[i] / 2 + dist) * lado; return [ch.x[i] + ch.nx[i] * o, ch.y[i] + ch.ny[i] * o, i]; }

  function gerar(variante) {
    var R = rnd(1234), W = {};
    W.costa = function (y) { return 1500 + 34 * Math.sin(y / 110 + 1) + 18 * Math.sin(y / 37); };
    function ateCosta(c) {   // cut a delta arm where it meets the sea
      var n = c.n; for (var i = 0; i < c.n; i++) if (c.x[i] > W.costa(c.y[i]) + 3) { n = i + 1; break; }
      ["x", "y", "nx", "ny", "wb", "q", "c"].forEach(function (k) { c[k] = c[k].slice(0, n); });
      c.n = n; c.len = (n - 1) * STEP; return c;
    }
    var main = canal("rio", [[22, 318], [90, 336], [170, 306], [262, 352], [360, 338], [462, 392], [574, 378], [684, 426], [792, 468], [900, 478], [990, 468], [1080, 516], [1172, 512], [1235, 555]], 4.5, 21, 10, 46, 1.3);
    var trib = canal("afluente", [[40, 1150], [120, 1000], [210, 880], [300, 790], [400, 690], [470, 560], [540, 440], [588, 392]], 3, 8, 12, 34, 2.1);
    var trib2 = canal("afluente2", [[250, -220], [258, -90], [238, 40], [222, 160], [208, 250], [203, 316]], 2.5, 6, 9, 30, 3.3);
    // the delta as a tree: main splits in two, each arm splits again, tangents continue
    var n1 = canal("n1", [[1235, 555], [1262, 566], [1300, 557], [1350, 522], [1400, 484]], 14, 12, 0, 1, 0);
    var s1 = canal("s1", [[1235, 555], [1262, 578], [1288, 616], [1318, 668], [1350, 718]], 13, 11, 0, 1, 0);
    var d1 = canal("d1", [[1400, 484], [1450, 446], [1520, 408], [1600, 376], [1720, 344], [1860, 320]], 10, 14, 5, 50, 0.7);
    var d2 = canal("d2", [[1400, 484], [1452, 492], [1530, 505], [1620, 510], [1760, 512], [1860, 512]], 10, 15, 5, 50, 2.6);
    var d3 = canal("d3", [[1350, 718], [1402, 742], [1480, 768], [1560, 790], [1720, 820], [1860, 840]], 9, 13, 5, 46, 4.1);
    var d4 = canal("d4", [[1350, 718], [1372, 778], [1410, 858], [1470, 940], [1560, 1040], [1680, 1160]], 7, 11, 5, 44, 5.2);
    [d1, d2, d3, d4].forEach(ateCosta);
    main.filhos = [n1, s1]; n1.pai = main; s1.pai = main;
    n1.filhos = [d1, d2]; d1.pai = n1; d2.pai = n1;
    s1.filhos = [d3, d4]; d3.pai = s1; d4.pai = s1;
    trib.foz = main; trib2.foz = main;
    W.canais = [main, trib, trib2, n1, s1, d1, d2, d3, d4]; W.main = main;
    // creeks from the highlands (static)
    W.corregos = [
      [[330, 110], [340, 210], [352, 290], [356, 342]],
      [[110, 570], [180, 500], [230, 420], [262, 360]], [[760, 770], [800, 650], [830, 560], [842, 486]], [[1040, 190], [1060, 320], [1090, 420], [1110, 505]]
    ].map(function (c, i) { var ch = canal("c" + i, c, 1.2, 2, 7, 22, i * 1.7); var pts = []; for (var j = 0; j < ch.n; j++) pts.push([ch.x[j], ch.y[j]]); return pts; });
    // edge-distance field: distance to the nearest bank (negative inside water), 8-unit grid
    var G = 8, gw = Math.ceil((WW + 2 * M) / G), gh = Math.ceil((WH + 2 * M) / G), E = new Float32Array(gw * gh).fill(999);
    W.canais.forEach(function (ch) {
      for (var i = 0; i < ch.n; i += 2) {
        var cx = ch.x[i], cy = ch.y[i], hw = ch.wb[i] / 2, r = 70;
        var x0 = Math.max(0, Math.floor((cx - r + M) / G)), x1 = Math.min(gw - 1, Math.ceil((cx + r + M) / G));
        var y0 = Math.max(0, Math.floor((cy - r + M) / G)), y1 = Math.min(gh - 1, Math.ceil((cy + r + M) / G));
        for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) {
          var d = Math.hypot(gx * G - M - cx, gy * G - M - cy) - hw, o = gy * gw + gx; if (d < E[o]) E[o] = d;
        }
      }
    });
    var Er = E.slice();
    W.corregos.forEach(function (c) {
      for (var i = 0; i < c.length; i += 2) {
        var cx = c[i][0], cy = c[i][1], r = 40;
        var x0 = Math.max(0, Math.floor((cx - r + M) / G)), x1 = Math.min(gw - 1, Math.ceil((cx + r + M) / G));
        var y0 = Math.max(0, Math.floor((cy - r + M) / G)), y1 = Math.min(gh - 1, Math.ceil((cy + r + M) / G));
        for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) { var d = Math.hypot(gx * G - M - cx, gy * G - M - cy) - 1, o = gy * gw + gx; if (d < E[o]) E[o] = d; }
      }
    });
    W.Er = function (x, y) { var gx = clamp(Math.round((x + M) / G), 0, gw - 1), gy = clamp(Math.round((y + M) / G), 0, gh - 1); return Er[gy * gw + gx]; };
    W.E = function (x, y) { var gx = clamp(Math.round((x + M) / G), 0, gw - 1), gy = clamp(Math.round((y + M) / G), 0, gh - 1); return E[gy * gw + gx]; };

    // upstream estate (fazenda grande): pivots, reservoir, intake canal
    var fg = margem(main, 0.3, -1, 0);
    W.intake = { i: fg[2], x: fg[0], y: fg[1] };
    W.pivos = [];
    [[-70, -150, 56], [55, -165, 60], [-10, -270, 52], [125, -265, 48], [-135, -265, 44], [190, -150, 46]].forEach(function (p) { W.pivos.push({ x: fg[0] + p[0], y: fg[1] + p[1], r: p[2], a: R() * 6.28 }); });
    W.pivos.push({ x: 300, y: 650, r: 50, a: 1 }, { x: 410, y: 860, r: 58, a: 2 }, { x: 640, y: 930, r: 52, a: 3 }, { x: 980, y: 140, r: 46, a: 4 });
    W.acude = { x: fg[0] + 40, y: fg[1] - 70, rx: 26, ry: 14 };
    W.canalTomada = [[fg[0], fg[1]], [fg[0] + 8, fg[1] - 30], [fg[0] + 28, fg[1] - 58], [fg[0] + 40, fg[1] - 70]];

    // upstream industry on the north bank: the discharge source
    var ind = margem(main, 0.405, -1, 12);
    W.industria = { x: ind[0] - 52, y: ind[1] - 66, w: 104, h: 58 };
    var fb = margem(main, 0.405, -1, 2);
    W.fabrica = { x: ind[0] - 4, y: ind[1] - 16, i: idxAt(main, 0.405), bx: fb[0], by: fb[1] };
    W.decanta = [{ x: W.industria.x + 70, y: W.industria.y + 6, w: 28, d: 12 }, { x: W.industria.x + 70, y: W.industria.y + 22, w: 28, d: 10 }];
    var vi = margem(main, 0.47, -1, 14);
    W.vila = { x: vi[0], y: vi[1] - 46, w: 120, h: 72 };
    var ci = margem(main, 0.88, -1, 10);
    W.cidade = { x: ci[0] - 30, y: ci[1] - 62, w: 190, h: 100 };
    W.pesca = { x: 1452, y: 600, w: 46, h: 36 };

    // your farm, laid out from the south bank: pump at the bank, solar beside it, well, control with
    // filter + fertigation, a reservoir (project design), header -> manifold -> curved drip beds, orchard rows
    var top = 0;
    for (var i = 0; i < main.n; i++) if (main.x[i] > 850 && main.x[i] < 1090) top = Math.max(top, main.y[i] + main.wb[i] / 2);
    var T = Math.round(top + 12);
    var F = { T: T, x0: 840, x1: 1094, y0: T - 8, y1: T + 138 };
    F.bomba = (function () { var best = 0, bd = 1e9; for (var i = 0; i < main.n; i++) { var d = Math.abs(main.x[i] - 892); if (d < bd) { bd = d; best = i; } }
      return { i: best, x: main.x[best], y: main.y[best] + main.wb[best] / 2 + 1, cy: main.y[best], wb: main.wb[best] }; })();
    F.pump = { x: 892, y: T + 2 };
    F.casaBomba = F.pump;
    F.painel = []; for (var r = 0; r < 4; r++) F.painel.push({ x: 848, y: T + 4 + r * 7.5, w: 32, d: 4 });
    F.caboBomba = [[880, T + 14], [886, T + 9], [890, T + 4]];
    F.caboPoco = [[858, T + 34], [860, T + 42], [864, T + 48]];
    F.medidor = { x: 904, y: T + 7 };
    F.controle = { x: 912, y: T + 3, w: 14, d: 9, h: 6 };
    F.tanques = [[931, T + 6, "#4E9B6E"], [935.5, T + 6, "#FF914D"], [940, T + 6, "#38B6FF"], [944.5, T + 6, "#C9A35A"]];
    F.poco = { x: 866, y: T + 50 };
    F.represa = { x: 1014, y: T + 20, rx: 27, ry: 13 };
    // ── the farm, organic: irregular parcels on the contour that bend with the river ──
    // Shapes and rhythm after Tomé-Açu agroforestry (SAF: rows of palms and fruit trees following the
    // land, under scattered tall shade trees) and contour farming: no grid, no square edge.
    var bancoY = function (x) { var best = 0, bd = 1e9; for (var i = 0; i < main.n; i++) { var d = Math.abs(main.x[i] - x); if (d < bd) { bd = d; best = i; } } return main.y[best] + main.wb[best] / 2; };
    var BX0 = 800, bys = [];
    for (var bx = BX0; bx <= 1140; bx += 3) bys.push(bancoY(bx));
    for (var it = 0; it < 40; it++) { var nb = bys.slice(); for (var i2 = 1; i2 < bys.length - 1; i2++) nb[i2] = (bys[i2 - 1] + 2 * bys[i2] + bys[i2 + 1]) / 4; bys = nb; }
    var minB = 1e9; for (var i3 = 0; i3 < bys.length; i3++) { var xx3 = BX0 + i3 * 3; if (xx3 >= 860 && xx3 <= 1060) minB = Math.min(minB, bys[i3]); }
    var VAR = { a: { amp: 5, linhas: 0 }, b: { amp: 4.2, linhas: 0 }, c: { amp: 7, linhas: 1 } }[variante] || { amp: 5, linhas: 0 };
    var OFF = T + 46 - minB;
    function baseY(x) { var f = clamp((x - BX0) / 3, 0, bys.length - 1.001), i = Math.floor(f), k = f - i; return lerp(bys[i], bys[i + 1], k) + OFF; }
    function Pt(s, d) {   // along-river s, contour offset d -> world point
      var y0 = baseY(s), y1 = baseY(s + 2), l = Math.hypot(2, y1 - y0), nx = -(y1 - y0) / l, ny = 2 / l;
      var dd = d + VAR.amp * Math.sin(s / 27 + d / 23 + 1.3) + VAR.amp * 0.6 * Math.sin(s / 11 - d / 17) + VAR.amp * 0.35 * Math.sin(s / 6.5 + d / 9);
      return [s + nx * dd, y0 + ny * dd];
    }
    function chaikin(pts, n) {
      for (var r = 0; r < n; r++) { var q = []; for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } pts = q; }
      return pts;
    }
    var DEF = {
      a: [{ id: "horta", s0: 884, s1: 938, d0: 0, d1: 44 }, { id: "acai", s0: 946, s1: 988, d0: -2, d1: 38 }, { id: "saf", s0: 996, s1: 1054, d0: 6, d1: 96 },
          { id: "mandioca", s0: 880, s1: 966, d0: 56, d1: 98 }, { id: "horta2", s0: 950, s1: 988, d0: 50, d1: 82 }],
      b: [{ id: "horta", s0: 882, s1: 912, d0: 0, d1: 34 }, { id: "horta2", s0: 922, s1: 952, d0: -2, d1: 32 }, { id: "acai", s0: 964, s1: 994, d0: 0, d1: 38 },
          { id: "saf", s0: 1008, s1: 1056, d0: 10, d1: 76 }, { id: "mandioca", s0: 880, s1: 932, d0: 52, d1: 92 }, { id: "feijao", s0: 944, s1: 992, d0: 56, d1: 92 }],
      c: [{ id: "horta", s0: 884, s1: 950, d0: 0, d1: 40 }, { id: "saf", s0: 958, s1: 1054, d0: 4, d1: 66 }, { id: "mandioca", s0: 880, s1: 950, d0: 50, d1: 96 },
          { id: "acai", s0: 958, s1: 1030, d0: 76, d1: 104 }]
    }[variante] || null;
    var defs = DEF || [{ id: "horta", s0: 884, s1: 938, d0: 0, d1: 44 }, { id: "acai", s0: 946, s1: 988, d0: -2, d1: 38 }, { id: "saf", s0: 996, s1: 1054, d0: 6, d1: 96 }, { id: "mandioca", s0: 880, s1: 966, d0: 56, d1: 98 }, { id: "horta2", s0: 950, s1: 988, d0: 50, d1: 82 }];
    F.parcelas = []; F.leitos = []; F.leitoTipo = []; F.fileiras = []; F.pomar = []; F.sombras = []; F.cercas = [];
    var rede = [];
    var header = []; for (var hs = 872; hs <= 1054; hs += 3) header.push(Pt(hs, -8));
    var naCab = function (s) { return Pt(s, -8); };
    defs.forEach(function (df, pi) {
      var sd = pi * 3.7 + 1;
      var nL = function (d) { return 1.6 * Math.sin(d / 9 + sd) + 0.8 * Math.sin(d / 4.3 + sd * 2); };
      var nR = function (d) { return 1.6 * Math.sin(d / 8 + sd * 1.7) + 0.8 * Math.sin(d / 3.7 + sd); };
      var nT = function (s) { return 1.2 * Math.sin(s / 11 + sd); }, nB = function (s) { return 1.2 * Math.sin(s / 9 + sd * 3); };
      var sL = function (d) { return df.s0 + nL(d); }, sR = function (d) { return df.s1 + nR(d); };
      var poly = [], s, d;
      for (s = sL(df.d0); s <= sR(df.d0); s += 3) poly.push(Pt(s, df.d0 + nT(s)));
      for (d = df.d0; d <= df.d1; d += 3) poly.push(Pt(sR(d), d));
      for (s = sR(df.d1); s >= sL(df.d1); s -= 3) poly.push(Pt(s, df.d1 + nB(s)));
      for (d = df.d1; d >= df.d0; d -= 3) poly.push(Pt(sL(d), d));
      poly = chaikin(poly, 2);
      var cx = 0, cy = 0; poly.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= poly.length; cy /= poly.length;
      var par = { id: df.id, poly: poly, cx: cx, cy: cy, sL: sL, sR: sR, d0: df.d0, d1: df.d1 };
      F.parcelas.push(par);
      var arv = df.id === "saf" || df.id === "acai";
      var starts = [];
      if (!arv) {   // beds on the contour, spacing varies a little
        var c = df.d0 + 3.4, k = 0;
        while (c < df.d1 - 2.5) {
          var row = []; for (s = sL(c) + 2.5; s <= sR(c) - 2.5; s += 2.5) row.push(Pt(s, c));
          if (row.length > 3) { F.leitos.push(row); F.leitoTipo.push(df.id === "mandioca" ? "mandioca" : df.id === "feijao" ? "feijao" : "horta"); starts.push(row[0]); }
          c += (df.id === "mandioca" ? 7.2 : 5.8) + 1.1 * Math.sin(k * 1.7 + sd); k++;
        }
      } else {   // agroforestry rows on the contour: cacao or açaí, shade trees scattered in the rows
        var c2 = df.d0 + 6, kk2 = 0;
        while (c2 < df.d1 - 6) {
          var lin = []; for (s = sL(c2) + 3; s <= sR(c2) - 3; s += 2.5) lin.push(Pt(s, c2));
          if (lin.length > 2) { F.fileiras.push(lin); starts.push(lin[0]); }
          var passoA = df.id === "acai" ? 6.2 : 8.2;
          for (s = sL(c2) + 6 + (kk2 % 2) * passoA / 2; s <= sR(c2) - 6; s += passoA + 1.6 * (hash(s, c2) - 0.5)) {
            var jit = 1.4 * (hash(c2, s) - 0.5), p2 = Pt(s, c2 + jit);
            if (df.id === "saf" && hash(s * 1.3, c2 * 0.7) < 0.2) F.sombras.push({ x: p2[0], y: p2[1], r: 4.2 + 1.4 * hash(s, 3), t: hash(c2, 1) < 0.5 ? 0 : 1 });
            else F.pomar.push({ x: p2[0], y: p2[1], k: kk2, f: R(), kind: df.id === "acai" ? "acai" : "cacau" });
          }
          c2 += (df.id === "acai" ? 8 : 10.5) + 1.6 * Math.sin(kk2 * 1.3 + sd); kk2++;
        }
      }
      // feeder from the main line down the parcel's left edge, then along the row starts
      var se = sL(df.d0) - 1.5, feed = [naCab(se)];
      for (d = -6; d < df.d0; d += 3) feed.push(Pt(se, d));
      starts.forEach(function (p) { feed.push([p[0] - 1.6, p[1]]); });
      rede.push(feed);
      // hedgerow / tree line on parts of the parcel edge
      for (var e2 = 0; e2 < poly.length; e2 += 5) { var pe = poly[e2], dx = pe[0] - cx, dy = pe[1] - cy, l2 = Math.hypot(dx, dy) || 1;
        if (hash(e2 + pi * 31, 5) < (df.id === "saf" ? 0.75 : 0.32)) F.cercas.push({ x: pe[0] + dx / l2 * 3.2, y: pe[1] + dy / l2 * 3.2, r: 1.9 + 0.9 * hash(e2, pi), t: 1, ox: pe[0] + dx / l2 * 10, oy: pe[1] + dy / l2 * 10, pi: pi }); }
    });
    // tree lines only on the farm's outer edges: never in the gap between two parcels
    F.cercas = F.cercas.filter(function (c) { for (var q = 0; q < F.parcelas.length; q++) if (q !== c.pi && dentroPoli(F.parcelas[q].poly, c.ox, c.oy)) return false; return true; });
    // farm tracks: one along the contour between the upper and lower parcels, one to the house
    F.trilhas = [];
    var tr = []; for (var ts = 870; ts <= 1060; ts += 4) tr.push(Pt(ts, variante === "c" ? 45 : variante === "b" ? 44 + 1.5 * Math.sin(ts / 40) : 48 + 3 * Math.sin(ts / 40)));
    F.trilhas.push(tr);
    F.trilhas.push([Pt(1060, 48), [1072, T + 70], [1076, T + 36]]);
    F.contornos = [];
    if (VAR.linhas) for (var cl = -4; cl < 112; cl += 8) { var ln = []; for (var cs = 862; cs <= 1070; cs += 4) ln.push(Pt(cs, cl)); F.contornos.push(ln); }
    var maxY = 0; F.parcelas.forEach(function (pc) { pc.poly.forEach(function (p) { maxY = Math.max(maxY, p[1]); }); });
    F.y1 = Math.round(maxY + 12);
    var cab = header;
    var pontoCab = function (x) { var b = cab[0], bd = 1e9; cab.forEach(function (p) { var d = Math.abs(p[0] - x); if (d < bd) { bd = d; b = p; } }); return b; };
    F.tubos = {
      suc: [[F.bomba.x, F.bomba.cy + F.bomba.wb * 0.18], [F.bomba.x, F.bomba.y], [892, T + 2]],
      rec: [[892, T + 2], [904, T + 7], [912, T + 8]],
      resIn: [[926, T + 8], [958, T + 6], [987, T + 14]],
      resOut: [[1002, T + 30], pontoCab(1004)],
      poco: [[866, T + 50], pontoCab(872)],
      desce: [[920, T + 12], pontoCab(920)],
      header: cab, manifold: [], submain: [], redes: rede
    };
    var pq = function (id) { for (var i = 0; i < F.parcelas.length; i++) if (F.parcelas[i].id === id) return F.parcelas[i]; return F.parcelas[0]; };
    var hp = pq("horta"), sp = pq("saf"), mp = pq("mandioca");
    F.sensores = [{ x: hp.cx - 4, y: hp.cy + 2 }, { x: sp.cx, y: sp.cy + 3 }, { x: mp.cx + 6, y: mp.cy + 2 }];
    F.casa = { x: 1062, y: T + 22, w: 15, d: 10, h: 8 };
    F.camara = { x: 1060, y: T + 50, w: 22, d: 6, h: 9 };
    F.galpao = { x: 1062, y: T + 68, w: 16, d: 12, h: 7 };
    var hl = F.leitos.filter(function (b, j) { return F.leitoTipo[j] === "horta"; });
    var ida = hl[Math.min(2, hl.length - 1)] || F.leitos[0], volta = (hl[Math.min(5, hl.length - 1)] || F.leitos[1]).slice().reverse();
    F.caminho = ida.filter(function (p, n) { return n % 3 === 0; }).map(function (p) { return [p[0], p[1] + 3.2]; }).concat(volta.filter(function (p, n) { return n % 3 === 0; }).map(function (p) { return [p[0], p[1] + 3.2]; }));
    F.cx = 965; F.cy = (T + F.y1) / 2;
    F.estacao = { x: 1046, y: T + 4 };
    F.hortaC = [hp.cx, hp.cy]; F.safC = [sp.cx, sp.cy];
    W.fazenda = F;

    // floodplain lake (lagoa) and flood basins that fill like small lakes in high water
    var lg = margem(main, 0.54, 1, 30);
    W.bacias = [{ x: lg[0], y: lg[1] + 8, r: 24, ch: 0, i: lg[2], lagoa: 1 }];
    // flood potential on a 5-unit grid. Pattern from the 2024 Rio Grande do Sul floods (NASA Earth
    // Observatory): deepest in and next to the channels, a wide shallow sheet over the valley floor,
    // fingers up the tributary valleys, and a broad sheet over the low delta.
    var FG = 5, fw = Math.ceil((WW + 2 * M) / FG), fh = Math.ceil((WH + 2 * M) / FG), fv = new Float32Array(fw * fh).fill(9999), fci = new Uint8Array(fw * fh), fsi = new Uint16Array(fw * fh);
    function carimbo(cx, cy, hw, r, ci, si, k3) {
      var x0 = Math.max(0, Math.floor((cx - r + M) / FG)), x1 = Math.min(fw - 1, Math.ceil((cx + r + M) / FG));
      var y0 = Math.max(0, Math.floor((cy - r + M) / FG)), y1 = Math.min(fh - 1, Math.ceil((cy + r + M) / FG));
      for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) { var d = (Math.hypot(gx * FG - M - cx, gy * FG - M - cy) - hw) * k3, o = gy * fw + gx; if (d < fv[o]) { fv[o] = d; fci[o] = ci; fsi[o] = si; } }
    }
    W.canais.forEach(function (ch, ci) { for (var i = 0; i < ch.n; i += 3) carimbo(ch.x[i], ch.y[i], ch.wb[i] / 2, 200, ci, i, 1); });
    W.corregos.forEach(function (c) {   // creeks: fingers up their valleys, fed by the river level at their mouth
      var e = c[c.length - 1], mi = 0, md = 1e9; for (var i = 0; i < main.n; i += 2) { var d = Math.hypot(main.x[i] - e[0], main.y[i] - e[1]); if (d < md) { md = d; mi = i; } }
      for (var k4 = 0; k4 < c.length; k4 += 3) carimbo(c[k4][0], c[k4][1], 1, 110, 0, mi, 1.15 + 1.4 * (1 - k4 / c.length));
    });
    var fz2 = new Float32Array(fw * fh), fcx = (F.x0 + F.x1) / 2, fcy = (F.T + F.y1) / 2, frx = (F.x1 - F.x0) / 2 + 8, fry = (F.y1 - F.T) / 2 + 10;
    for (var gy = 0; gy < fh; gy++) for (var gx = 0; gx < fw; gx++) {
      var o = gy * fw + gx, X = gx * FG - M, Y = gy * FG - M;
      if (X > W.costa(Y) - 4) { fv[o] = 9999; continue; }
      var low = 0.6 + 0.85 * sstep(950, 1460, X) + 0.5 * (fbm(X / 110, Y / 110) - 0.5) - 0.35 * sstep(380, 0, X);
      fv[o] = fv[o] <= 0 ? 0 : fv[o] / Math.max(0.25, low);
      var ed = Math.hypot((X - fcx) / frx, (Y - fcy) / fry) + 0.12 * (fbm(X / 30, Y / 30) - 0.5); fz2[o] = ed;
      if (ed < 1.25) fv[o] = Math.min(fv[o], 20 + 0.3 * Math.max(0, Y - F.T) + 140 * Math.max(0, ed - 0.95));
    }
    W.cheia = { fw: fw, fh: fh, FG: FG, v: fv, ci: fci, si: fsi, faz: fz2 };
    W.bacias.forEach(function (b, n) { b.raio = []; for (var a = 0; a < 20; a++) b.raio.push(0.72 + 0.5 * hash(a * 3.1, n + 7)); });

    // parcels: estates on oriented grids, rejected where water, forest, towns or the farm are
    var ocupado = function (x, y) {
      if (x > W.costa(y) - 30) return true;
      if (W.E(x, y) < 16) return true;
      var zs = [W.vila, W.cidade, W.pesca, W.industria];
      for (var z = 0; z < zs.length; z++) { var v = zs[z]; if (x > v.x - 8 && x < v.x + v.w + 8 && y > v.y - 8 && y < v.y + v.h + 8) return true; }
      if (x > F.x0 - 10 && x < F.x1 + 10 && y > F.y0 - 10 && y < F.y1 + 10) return true;
      for (var i = 0; i < W.pivos.length; i++) { var p = W.pivos[i]; if (Math.hypot(x - p.x, y - p.y) < p.r + 6) return true; }
      if (Math.hypot(x - W.acude.x, y - W.acude.y) < 34) return true;
      if (Math.hypot(x - W.bacias[0].x, y - W.bacias[0].y) < 34) return true;
      return false;
    };
    W.matoAlto = function (x, y) {   // highland forest + legal reserves
      var n = fbm(x / 140, y / 140);
      if (x < 300 + 60 * Math.sin(y / 160)) return n > 0.47;
      return n > 0.69;
    };
    W.ocupado = ocupado;
    W.parcelas = [];
    function grade(x0, y0, x1, y1, ang, cw, chh, kind) {
      var ca = Math.cos(ang), sa = Math.sin(ang), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, span = Math.hypot(x1 - x0, y1 - y0) / 2;
      for (var v = -span; v < span; v += chh) for (var u = -span; u < span; u += cw) {
        var w = cw * (0.7 + R() * 0.6), h = chh, gap = 2.2;
        var corners = [[u + gap, v + gap], [u + w - gap, v + gap], [u + w - gap, v + h - gap], [u + gap, v + h - gap]].map(function (p) { return [cx + p[0] * ca - p[1] * sa, cy + p[0] * sa + p[1] * ca]; });
        var ok = true;
        for (var k = 0; k < 4 && ok; k++) { var p = corners[k]; if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1 || ocupado(p[0], p[1]) || W.matoAlto(p[0], p[1])) ok = false; }
        var mx = (corners[0][0] + corners[2][0]) / 2, my = (corners[0][1] + corners[2][1]) / 2;
        if (ok && (ocupado(mx, my) || W.matoAlto(mx, my))) ok = false;
        if (!ok) continue;
        if (R() < 0.12) continue;
        u += w - cw;
        W.parcelas.push({ p: corners, cor: Math.floor(R() * 8), ang: ang + (R() < 0.5 ? 0 : Math.PI / 2), tipo: R() < 0.65 ? "linhas" : "liso", mx: mx, my: my, e: W.Er(mx, my), kind: kind });
      }
    }
    grade(240, -M, 1240, 330, 0.12, 64, 42, "a");
    grade(240, 330, 860, 620, 0.12, 50, 36, "b");
    grade(1100, 330, 1330, 640, -0.08, 40, 30, "b");
    grade(200, 560, 1260, WH + M, -0.2, 70, 48, "c");
    grade(1260, 380, 1520, 1100, 0.6, 28, 22, "d");
    grade(1240, -M, 1500, 380, -0.3, 34, 26, "d");
    W.parcelas.forEach(function (p, n) {
      p.viz = p.e < 70 && p.mx > 560 && p.mx < 1340; p.varzea = p.e < 55;
      var q = [];
      for (var e = 0; e < 4; e++) { var a = p.p[e], b = p.p[(e + 1) % 4], nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1;
        for (var t = 0; t < 3; t++) { var u = t / 3, j = t ? (hash(n * 13 + e * 3 + t, 7) - 0.5) * 2.6 : 0; q.push([lerp(a[0], b[0], u) + nx / l * j, lerp(a[1], b[1], u) + ny / l * j]); } }
      p.quad = p.p; p.p = chaikin(q, 2);
    });
    W.instalaveis = []; var ultX = -999;
    W.parcelas.filter(function (p) { return p.e < 75 && p.e > 18 && p.mx > 300 && p.mx < 1380 && Math.abs(p.mx - 960) > 70; })
      .sort(function (a, b) { return a.mx - b.mx; }).forEach(function (p) { if (p.mx - ultX > 120 && W.instalaveis.length < 8) { W.instalaveis.push(p); ultX = p.mx; } });

    // trees
    W.arvores = [];
    for (var ty = -M; ty < WH + M; ty += 6.5) for (var tx = -M; tx < WW + M; tx += 6.5) {
      var x = tx + (hash(tx, ty) - 0.5) * 6, y = ty + (hash(ty, tx) - 0.5) * 6;
      if (x > W.costa(y) + 6) continue;
      if (x > F.x0 - 2 && x < F.x1 + 2 && y > F.y0 && y < F.y1) continue;
      var e = W.E(x, y), mangue = x > W.costa(y) - 110 && e < 30 && e > 1;
      var er = W.Er(x, y), ripa = (er > 1.5 && er < (x > 1240 ? 14 : 11)) || (e > 0.5 && e < 6 && er > 1.5);
      var alto = !ocupado(x, y) && W.matoAlto(x, y);
      if (mangue || ripa || alto) W.arvores.push({ x: x, y: y, r: (mangue ? 2.3 : 2.8) + hash(x, y + 3) * 1.8, t: mangue ? 2 : hash(y, x + 1) < 0.5 ? 0 : 1 });
      else if (!ocupado(x, y) && hash(x * 3, y * 7) < 0.035 && x < W.costa(y) - 40) {
        var dentro = false;
        for (var q = 0; q < W.parcelas.length && !dentro; q++) { var pp = W.parcelas[q]; if (Math.abs(pp.mx - x) < 40 && Math.abs(pp.my - y) < 40 && dentroPoli(pp.p, x, y)) dentro = true; }
        if (!dentro) W.arvores.push({ x: x, y: y, r: 2 + hash(x, y) * 1.6, t: 3 });
      }
    }
    // the farm's tree lines and the tall shade trees of the SAF (static, they stand up in the tilted view)
    F.cercas.concat(F.sombras).forEach(function (a) { W.arvores.push(a); });
    for (var rb = 846; rb < 1092; rb += 4.5) if (Math.abs(rb - 892) > 9 && hash(rb, 2) > 0.2) { var yb = bancoY(rb); W.arvores.push({ x: rb + hash(rb, 4) * 2, y: yb + 4 + hash(rb, 6) * 5, r: 2.2 + hash(rb, 8), t: hash(rb, 9) < 0.5 ? 0 : 1 }); }
    // buildings
    W.predios = [];
    function bloco(z, n, hmin, hmax, viz) {
      for (var by = z.y; by < z.y + z.h - 6; by += 13) for (var bx = z.x; bx < z.x + z.w - 6; bx += 12) {
        if (R() < 0.12) continue;
        if (W.E(bx + 4, by + 4) < 6) continue;
        var w = 6 + R() * 4, d = 5 + R() * 4;
        W.predios.push({ x: bx + R() * 2, y: by + R() * 2, w: w, d: d, h: hmin + R() * (hmax - hmin), cor: Math.floor(R() * 5), z: viz });
      }
    }
    bloco(W.vila, 0, 2.5, 5, "vila"); bloco(W.cidade, 0, 3, 12, "cidade"); bloco(W.pesca, 0, 2, 3.5, "pesca");
    var I = W.industria;
    W.predios.push({ x: I.x + 4, y: I.y + 4, w: 30, d: 16, h: 8, cor: 2, z: "fabrica", fab: 1 });
    W.predios.push({ x: I.x + 38, y: I.y + 6, w: 26, d: 14, h: 7, cor: 2, z: "fabrica", fab: 1 });
    W.predios.push({ x: I.x + 14, y: I.y + 30, w: 36, d: 15, h: 9, cor: 2, z: "fabrica", fab: 1 });
    W.tanquesInd = [[I.x + 60, I.y + 38, 5], [I.x + 72, I.y + 42, 5], [I.x + 84, I.y + 40, 4.5]];
    W.predios.push({ x: F.casa.x, y: F.casa.y, w: F.casa.w, d: F.casa.d, h: F.casa.h, cor: 0, z: "farm" });
    W.predios.push({ x: F.galpao.x, y: F.galpao.y, w: F.galpao.w, d: F.galpao.d, h: F.galpao.h, cor: 2, z: "farm" });
    W.predios.push({ x: F.controle.x, y: F.controle.y, w: F.controle.w, d: F.controle.d, h: F.controle.h, cor: 3, z: "farm" });
    // roads
    W.estradas = [
      { t: "asfalto", p: resample(catmull([[-M, 470], [200, 470], [420, 520], [640, 470], [760, 418], [880, 380], [1080, 420], [1240, 470], [1330, 480]], 16), 5) },
      { t: "terra", p: resample(catmull([[1075, T + 36], [1076, T + 100], [1110, T + 150], [1160, 640], [1250, 720], [1300, 820]], 16), 5) },
      { t: "terra", p: resample(catmull([[F.x0 + 6, F.y1 + 4], [760, 700], [600, 760], [380, 780], [150, 760]], 16), 5) },
      { t: "terra", p: resample(catmull([[W.vila.x + 40, W.vila.y], [700, 250], [720, 160], [700, 90], [640, 40]], 16), 5) },
      { t: "terra", p: resample(catmull([[W.cidade.x + 120, W.cidade.y], [1250, 300], [1300, 180], [1340, 40]], 16), 5) },
      { t: "terra", p: resample(catmull([[1075, T + 36], [1040, T + 46], [990, T + 46], [940, T + 30], [928, T + 14]], 16), 4) }
    ];
    W.ponte = margem(main, 0.885, 1, 0);
    var nas = { x: main.x[0], y: main.y[0] };
    W.lugares = {
      helicoptero: { x: 800, y: 500, z: 1 },
      fazenda: { x: 966, y: (T + F.y1) / 2 - 4, z: 4.4 },
      fazendaMeio: { x: 960, y: T + 46, z: 3.7 },
      fazendaPerto: { x: F.safC[0] - 30, y: F.safC[1], z: 7 },
      captacao: { x: 905, y: T - 2, z: 6.5 },
      bombaPerto: { x: 892, y: T + 14, z: 10 },
      pocoPerto: { x: 872, y: T + 40, z: 9.5 },
      represaPerto: { x: 1004, y: T + 26, z: 8.5 },
      estacaoPerto: { x: 1030, y: T + 10, z: 8 },
      camaraPerto: { x: F.camara.x + 4, y: F.camara.y + 2, z: 7.5 },
      colheitaVista: { x: (F.safC[0] + F.camara.x + 14) / 2 + 2, y: (F.safC[1] + F.camara.y + 6) / 2 + 3, z: 7.6 },
      captacaoPerto: { x: 902, y: T + 2, z: 9 },
      leitos: { x: F.hortaC[0], y: F.hortaC[1], z: 8.5 },
      pomar: { x: F.safC[0], y: F.safC[1], z: 8.5 },
      fazendaGrande: { x: fg[0] + 60, y: fg[1] - 110, z: 2.2 },
      industria: { x: I.x + 60, y: I.y + 50, z: 3.2 },
      vila: { x: W.vila.x + 40, y: W.vila.y + 40, z: 3.1 },
      lagoa: { x: lg[0], y: lg[1], z: 2.6 },
      rioAbaixo: { x: 960, y: 500, z: 2.4 },
      cidade: { x: W.cidade.x + 90, y: W.cidade.y + 70, z: 2.6 },
      delta: { x: 1330, y: 600, z: 1.9 },
      nascente: { x: nas.x + 120, y: nas.y + 30, z: 2.4 },
      trecho: { x: 800, y: 470, z: 2.7 }
    };
    W.rotulos = [
      { id: "nascente", t: "nascente", x: nas.x + 8, y: nas.y - 22, n: 1 },
      { id: "floresta", t: "floresta", x: 120, y: 190, n: 2 },
      { id: "grande", t: "fazenda grande", x: fg[0] + 30, y: fg[1] - 225, n: 1 },
      { id: "industria", t: "indústria", x: I.x + 50, y: I.y - 12, n: 1 },
      { id: "vila", t: "vila", x: W.vila.x + 50, y: W.vila.y - 12, n: 1 },
      { id: "despejo", t: "despejo", x: W.fabrica.bx - 34, y: W.fabrica.by - 10, n: 3, cenas: ["suja", "sujaSem", "sujaCom"] },
      { id: "lagoa", t: "lagoa", x: lg[0], y: lg[1] + 36, n: 2 },
      { id: "sua", t: "sua fazenda", x: F.cx, y: F.y1 + 12, n: 1, eu: 1 },
      { id: "viz1", t: "vizinhos", x: 780, y: 610, n: 2 },
      { id: "viz2", t: "vizinhos", x: 1150, y: 650, n: 2 },
      { id: "cidade", t: "cidade", x: W.cidade.x + 100, y: W.cidade.y - 14, n: 1 },
      { id: "delta", t: "delta", x: 1390, y: 780, n: 2 },
      { id: "mar", t: "mar", x: 1590, y: 650, n: 2 },
      { id: "afluente", t: "afluente", x: 420, y: 650, n: 3 },
      { id: "afluente2", t: "afluente", x: 232, y: 110, n: 3 },
      { id: "painel", t: "energia solar", x: 856, y: T - 2, n: 9 },
      { id: "poco", t: "poço com bomba submersa", x: 866, y: T + 60, n: 9 },
      { id: "represa", t: "represa (projeto da fazenda)", x: 1014, y: T + 40, n: 9 },
      { id: "fert", t: "filtro e fertirrigação", x: 934, y: T + 22, n: 9 },
      { id: "medidorR", t: "medidor de vazão", x: F.medidor.x + 2, y: F.medidor.y + 14, n: 9 },
      { id: "estacao", t: "estação meteorológica", x: F.estacao.x, y: F.estacao.y - 14, n: 9 },
      { id: "controle", t: "controle e aplicativo", x: 919, y: T - 6, n: 9 },
      { id: "qualidade", t: "sensor de qualidade da água", x: F.tubos.suc[1][0] - 26, y: F.tubos.suc[1][1] - 8, n: 9 },
      { id: "goteja", t: "gotejamento", x: F.hortaC[0], y: F.hortaC[1] + 30, n: 9 },
      { id: "acai", t: "açaí", x: F.parcelas.filter(function (q) { return q.id === "acai"; }).concat(F.parcelas)[0].cx, y: F.parcelas.filter(function (q) { return q.id === "acai"; }).concat(F.parcelas)[0].cy, n: 10 },
      { id: "mandioca", t: "mandioca", x: F.parcelas.filter(function (q) { return q.id === "mandioca"; }).concat(F.parcelas)[0].cx, y: F.parcelas.filter(function (q) { return q.id === "mandioca"; }).concat(F.parcelas)[0].cy + 18, n: 10 },
      { id: "micro", t: "cacau em SAF, microaspersão", x: F.safC[0], y: F.safC[1] + 44, n: 9 },
      { id: "camara", t: "câmara fria solar: frio pós-colheita", x: F.camara.x + 11, y: F.camara.y - 15, n: 9 }
    ];
    return W;
  }
  function dentroPoli(p, x, y) {
    var c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    return c;
  }

  // ── engine instance ─────────────────────────────────────────────────────
  function Comunidade(root, cfg) {
    if (!MUNDO) MUNDO = gerar(cfg.fazenda || "b");
    var W0 = MUNDO, P = PAL[cfg.paleta || "cerrado"], tiltAlvo = cfg.tilt || 0;
    var marcaModo = cfg.marca || null, estilo = cfg.agua || "misto", vida = !!cfg.vida, ligacoes = cfg.ligacoes || false, dados = !!cfg.dados, nivelRot = cfg.rotulos == null ? 1 : cfg.rotulos;
    var cv = document.createElement("canvas"); cv.className = "wc__cv"; cv.setAttribute("aria-hidden", "true");
    root.insertBefore(cv, root.firstChild);
    var g = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, retrato = false, k = 1, GW = WW, GH = WH, fit = 1;
    var base = null, detalhes = [], fila = [];
    var st = {}, alvo = CENAS.equilibrio.s; for (var key in alvo) st[key] = alvo[key];
    var cenaId = "equilibrio", tempo = 0, rodando = false, visivel = false, raf = 0, t0 = 0, auto = !REDUZ;
    var cam = { x: 800, y: 500, z: 1 }, voo = null;
    var passos = cfg.passos || [{ cena: "equilibrio", cam: "helicoptero", hold: 1e9 }], passo = 0, tPasso = 0;
    var drift = cfg.drift || 0;

    // ── geometry helpers (ground / projection) ────────────────────────────
    function Rg(x, y) { return retrato ? [WH - y, x] : [x, y]; }
    function Pj(x, y) { var r = Rg(x, y); return [r[0], r[1] * k]; }
    function groundTx(c) { c.scale(1, k); if (retrato) c.transform(0, 1, -1, 0, WH, 0); }
    function ptCam(l) { return typeof l === "string" ? W0.lugares[l] : l; }

    // ── sizes and caches ──────────────────────────────────────────────────
    function tamanho() {
      var r = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(280, Math.round(r.width)); H = Math.max(220, Math.round(r.height));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px";
      var novoRet = W / H < 0.9;
      k = tiltAlvo ? (novoRet ? Math.min(0.78, tiltAlvo + 0.12) : tiltAlvo) : 1;
      if (novoRet !== retrato || !base) { retrato = novoRet; }
      GW = retrato ? WH : WW; GH = retrato ? WW : WH;
      fit = Math.min(W / GW, H / (GH * k));
      if (retrato) fit *= 1.12;   // phones: crop the far edges slightly, the story is in the middle
      base = null; detalhes = []; fila = [];
    }
    function constroiBase() {
      var ext = [-M, -M, GW + M, GH + M];
      var cs = Math.min(fit * dpr * 1.25, 4096 / (GW + 2 * M), 4096 / ((GH + 2 * M) * k));
      base = cache(ext, cs);
      // detail canvases for the places the director will zoom into, built one per idle slot
      var alvoZ = {};
      passos.forEach(function (p) { var l = ptCam(p.cam); if (l && l.z > 1.6) alvoZ[typeof p.cam === "string" ? p.cam : JSON.stringify(p.cam)] = l; });
      (cfg.extras || []).forEach(function (n) { alvoZ[n] = W0.lugares[n]; });
      Object.keys(alvoZ).forEach(function (n) { fila.push(alvoZ[n]); });
    }
    function cache(ext, cs) {   // ext in GROUND coords [x0,y0,x1,y1]
      var c = document.createElement("canvas");
      c.width = Math.max(2, Math.round((ext[2] - ext[0]) * cs)); c.height = Math.max(2, Math.round((ext[3] - ext[1]) * k * cs));
      var x = c.getContext("2d");
      x.setTransform(cs, 0, 0, cs, -ext[0] * cs, -ext[1] * k * cs);
      desenhaEstatico(x, cs, ext);
      return { c: c, ext: ext, cs: cs };
    }
    function constroiDetalhe(l) {
      var vwG = W / (fit * l.z), vhG = H / (fit * l.z * k);   // ground extent visible at that zoom
      var r = Rg(l.x, l.y), mx = vwG * 0.75 + 40, my = vhG * 0.75 + 40;
      var ext = [r[0] - mx, r[1] - my, r[0] + mx, r[1] + my];
      var cs = Math.min(fit * l.z * dpr * 1.4, 4096 / (ext[2] - ext[0]), 4096 / ((ext[3] - ext[1]) * k));
      detalhes.push(cache(ext, cs));
    }
    function trabalhaFila() {
      if (!fila.length) return;
      var l = fila.shift(); constroiDetalhe(l);
      if (fila.length) setTimeout(trabalhaFila, 60);
    }

    // ── static land ───────────────────────────────────────────────────────
    function noGround(x, ext) {   // world bbox cull against a ground extent
      return function (wx, wy, r) { var p = Rg(wx, wy); return p[0] + r > ext[0] && p[0] - r < ext[2] && p[1] + r > ext[1] && p[1] - r < ext[3]; };
    }
    function desenhaEstatico(x, cs, ext) {
      var vis = noGround(x, ext), det = cs * Math.max(1, k);   // px per world unit
      x.save(); groundTx(x);
      // ground and its slow colour variation
      x.fillStyle = P.fundo; x.fillRect(-M - 400, -M - 400, WW + 2 * M + 800, WH + 2 * M + 800);
      var nz = document.createElement("canvas"), nw = 128, nh = 84; nz.width = nw; nz.height = nh;
      var nx = nz.getContext("2d"), id = nx.createImageData(nw, nh), f2 = hx(P.fundo2), f1 = hx(P.fundo);
      for (var j = 0; j < nh; j++) for (var i = 0; i < nw; i++) {
        var wx = -M + i / nw * (WW + 2 * M), wy = -M + j / nh * (WH + 2 * M), v = sstep(0.35, 0.75, fbm(wx / 160, wy / 160)), o = (j * nw + i) * 4;
        id.data[o] = lerp(f1[0], f2[0], v); id.data[o + 1] = lerp(f1[1], f2[1], v); id.data[o + 2] = lerp(f1[2], f2[2], v); id.data[o + 3] = 255;
      }
      nx.putImageData(id, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(nz, -M, -M, WW + 2 * M, WH + 2 * M);
      // relief: soft light and shade on the highlands, a few contour lines
      var rel = [[90, 120, 170, 0.5], [210, 520, 200, 0.45], [60, 820, 180, 0.4], [420, 140, 140, 0.25]];
      if (P.morros) rel = rel.concat([[700, 180, 150, 0.35], [520, 760, 170, 0.35], [1000, 820, 160, 0.3], [1180, 220, 130, 0.3], [860, 640, 120, 0.25]]);
      var RS = P.relevo || 1;
      rel.forEach(function (h) {
        var gl = x.createRadialGradient(h[0] - h[2] * 0.35, h[1] - h[2] * 0.35, 0, h[0], h[1], h[2]);
        gl.addColorStop(0, rgba(P.relevoL, 0.5 * h[3] * RS)); gl.addColorStop(1, rgba(P.relevoL, 0)); x.fillStyle = gl; x.fillRect(h[0] - h[2] * 1.4, h[1] - h[2] * 1.4, h[2] * 2.8, h[2] * 2.8);
        var gd = x.createRadialGradient(h[0] + h[2] * 0.45, h[1] + h[2] * 0.45, 0, h[0] + h[2] * 0.3, h[1] + h[2] * 0.3, h[2]);
        gd.addColorStop(0, rgba(P.relevoE, 0.16 * h[3] * RS)); gd.addColorStop(1, rgba(P.relevoE, 0)); x.fillStyle = gd; x.fillRect(h[0] - h[2], h[1] - h[2], h[2] * 2.6, h[2] * 2.6);
      });
      x.strokeStyle = rgba(P.relevoE, 0.13 * Math.min(RS, 1.6)); x.lineWidth = 0.7;
      rel.slice(0, 3).forEach(function (h, hi) {
        for (var kk = 1; kk <= 5; kk++) {
          x.beginPath();
          for (var a = 0; a <= 72; a++) { var an = a / 72 * 6.283, rr = kk * h[2] * 0.15 * (1 + 0.16 * Math.sin(an * 3 + kk + hi) + 0.07 * Math.sin(an * 7 - kk)); x[a ? "lineTo" : "moveTo"](h[0] + Math.cos(an) * rr * 1.2, h[1] + Math.sin(an) * rr * 0.85); }
          x.closePath(); x.stroke();
        }
      });
      // fields
      W0.parcelas.forEach(function (p) {
        if (!vis(p.mx, p.my, 60)) return;
        x.beginPath(); p.p.forEach(function (q, i) { x[i ? "lineTo" : "moveTo"](q[0], q[1]); }); x.closePath();
        x.fillStyle = P.campos[p.cor]; x.fill();
        if (p.tipo === "linhas" && det > 1.1) {   // crop rows
          x.save(); x.clip();
          x.strokeStyle = rgba(P.relevoE, det > 3 ? 0.16 : 0.1); x.lineWidth = det > 3 ? 0.5 : 0.8;
          var ca = Math.cos(p.ang), sa = Math.sin(p.ang), sp = det > 3 ? 2.2 : 3.6;
          x.beginPath();
          for (var o = -60; o < 60; o += sp) { x.moveTo(p.mx - ca * 60 - sa * o, p.my - sa * 60 + ca * o); x.lineTo(p.mx + ca * 60 - sa * o, p.my + sa * 60 + ca * o); }
          x.stroke(); x.restore();
        }
      });
      // centre pivots (static disc; the arm is drawn live)
      W0.pivos.forEach(function (p) {
        if (!vis(p.x, p.y, p.r)) return;
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fillStyle = P.pivo; x.fill();
        x.strokeStyle = rgba(P.relevoE, 0.12); x.lineWidth = 0.6;
        for (var rr = 8; rr < p.r; rr += det > 3 ? 4 : 8) { x.beginPath(); x.arc(p.x, p.y, rr, 0, 6.283); x.stroke(); }
      });
      // the estate's reservoir bed
      var ac = W0.acude; x.beginPath(); x.ellipse(ac.x, ac.y, ac.rx + 3, ac.ry + 3, -0.3, 0, 6.283); x.fillStyle = P.leito; x.fill();
      // roads
      W0.estradas.forEach(function (r) {
        x.beginPath(); r.p.forEach(function (q, i) { x[i ? "lineTo" : "moveTo"](q[0], q[1]); });
        x.lineJoin = "round"; x.lineCap = "round";
        if (r.t === "asfalto") { x.strokeStyle = rgba("#FFFFFF", 0.55); x.lineWidth = 4.2; x.stroke(); x.strokeStyle = "#B8B2A6"; x.lineWidth = 2.6; x.stroke(); }
        else { x.strokeStyle = P.terra; x.globalAlpha = 0.75; x.lineWidth = 2; x.stroke(); x.globalAlpha = 1; }
      });
      // creeks
      x.strokeStyle = P.agua; x.lineCap = "round";
      W0.corregos.forEach(function (c) { x.lineWidth = 1.4; x.beginPath(); c.forEach(function (q, i) { x[i ? "lineTo" : "moveTo"](q[0], q[1]); }); x.stroke(); });
      // sea, beach
      x.beginPath(); x.moveTo(WW + M + 400, -M - 400);
      for (var yy = -M - 400; yy <= WH + M + 400; yy += 6) x.lineTo(W0.costa(yy), yy);
      x.lineTo(WW + M + 400, WH + M + 400); x.closePath();
      var mg = x.createLinearGradient(1450, 0, WW + M, 0); mg.addColorStop(0, P.mar); mg.addColorStop(1, P.marE); x.fillStyle = mg; x.fill();
      x.strokeStyle = P.areia; x.lineWidth = 6; x.beginPath(); for (yy = -M - 400; yy <= WH + M + 400; yy += 6) x[yy === -M - 400 ? "moveTo" : "lineTo"](W0.costa(yy) - 2, yy); x.stroke();
      x.strokeStyle = rgba("#FFFFFF", 0.5); x.lineWidth = 0.8; x.beginPath(); for (yy = -M - 400; yy <= WH + M + 400; yy += 6) x[yy === -M - 400 ? "moveTo" : "lineTo"](W0.costa(yy) + 6 + 2 * Math.sin(yy / 13), yy); x.stroke();
      // riverbed (sand shows when water drops); water is drawn live on top
      W0.canais.forEach(function (ch) { faixa(x, ch, 0, ch.n - 1, function (i) { return ch.wb[i] * 0.5 + 1.2; }); x.fillStyle = P.leito; x.fill(); });
      var F = W0.fazenda, T = F.T;
      if (vis(F.cx, F.cy, 170)) {
        x.fillStyle = mixh(P.solo, P.fundo, 0.66);
        x.beginPath(); x.ellipse(1068, T + 46, 32, 42, 0, 0, 6.283); x.fill();
        x.beginPath(); x.ellipse(898, T + 14, 64, 19, -0.05, 0, 6.283); x.fill();
        x.lineJoin = "round"; x.lineCap = "round";
        F.contornos.forEach(function (ln) { x.beginPath(); ln.forEach(function (p, i) { x[i ? "lineTo" : "moveTo"](p[0], p[1]); }); x.strokeStyle = rgba(P.relevoE, 0.16); x.lineWidth = 0.5; x.setLineDash([2, 2]); x.stroke(); x.setLineDash([]); });
        var COR = { horta: mixh(P.solo, P.fundo, 0.42), horta2: mixh(P.solo, P.fundo, 0.5), mandioca: mixh(P.campos[6], P.solo, 0.4), feijao: mixh(P.campos[2], P.solo, 0.3), acai: mixh(P.floresta, P.fundo, 0.62), saf: mixh(P.floresta, P.fundo, 0.5) };
        F.parcelas.forEach(function (pc) { x.beginPath(); pc.poly.forEach(function (p, i) { x[i ? "lineTo" : "moveTo"](p[0], p[1]); }); x.closePath(); x.fillStyle = COR[pc.id] || COR.horta; x.fill(); });
        F.leitos.forEach(function (b, j) { var tp = F.leitoTipo[j]; x.beginPath(); b.forEach(function (p, i) { x[i ? "lineTo" : "moveTo"](p[0], p[1]); });
          x.strokeStyle = tp === "mandioca" ? mixh(P.solo, P.campos[6], 0.3) : P.solo; x.lineWidth = tp === "mandioca" ? 3.8 : 3.2; x.stroke(); });
        F.trilhas.forEach(function (tr) { x.beginPath(); tr.forEach(function (p, i) { x[i ? "lineTo" : "moveTo"](p[0], p[1]); }); x.strokeStyle = rgba(P.terra, 0.55); x.lineWidth = 2.6; x.stroke(); x.strokeStyle = rgba("#FFFFFF", 0.25); x.lineWidth = 0.9; x.stroke(); });
      }
      var I = W0.industria;
      if (vis(I.x + 50, I.y + 30, 90)) {
        x.fillStyle = "#DEDBD2"; x.fillRect(I.x, I.y, I.w, I.h);
        W0.decanta.forEach(function (d) { x.fillStyle = "#C9C2B4"; x.fillRect(d.x - 1.5, d.y - 1.5, d.w + 3, d.d + 3); x.fillStyle = "#9EAA8A"; x.fillRect(d.x, d.y, d.w, d.d); });
        W0.tanquesInd.forEach(function (t) { x.fillStyle = "#C9CDD2"; x.beginPath(); x.arc(t[0], t[1], t[2], 0, 6.283); x.fill(); x.strokeStyle = "#9EA4AA"; x.lineWidth = 0.8; x.stroke(); });
      }
      x.restore();
      // upright things, painter-sorted by projected y
      var sp = [];
      W0.arvores.forEach(function (a) { if (vis(a.x, a.y, 6)) sp.push({ y: Pj(a.x, a.y)[1], a: a }); });
      W0.predios.forEach(function (b) { if (vis(b.x, b.y, 30)) sp.push({ y: Pj(b.x + b.w / 2, b.y + b.d)[1], b: b }); });
      if (vis(F.cx, F.cy, 140)) { F.painel.forEach(function (pn) { sp.push({ y: Pj(pn.x, pn.y + pn.d)[1], pn: pn }); }); sp.push({ y: Pj(F.camara.x, F.camara.y + F.camara.d)[1], cam: F.camara }); }
      sp.sort(function (a, b) { return a.y - b.y; });
      // shadows first (one pass), then the bodies
      x.fillStyle = P.sombra;
      sp.forEach(function (s) { if (s.a) { var p = Pj(s.a.x, s.a.y), r = s.a.r; x.beginPath(); if (k < 1) x.ellipse(p[0] + r * 0.6, p[1] + r * 0.15, r * 1.1, r * 0.45, 0, 0, 6.283); else x.arc(p[0] + r * 0.45, p[1] + r * 0.45, r, 0, 6.283); x.fill(); } });
      sp.forEach(function (s) {
        if (s.a) arvore(x, s.a, det);
        else if (s.b) predio(x, s.b);
        else if (s.pn) painel(x, s.pn);
        else if (s.cam) camara(x, s.cam);
      });
    }
    function arvore(x, a, det) {
      var p = Pj(a.x, a.y), r = a.r, up = k < 1 ? r * 1.1 : 0;
      var cor = a.t === 2 ? P.mangue : a.t === 0 ? P.floresta : a.t === 3 ? P.copa : P.florestaE;
      if (k < 1 && det > 1.5) { x.strokeStyle = rgba("#6B5240", 0.7); x.lineWidth = 0.6; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0], p[1] - up); x.stroke(); }
      x.fillStyle = cor; x.beginPath(); x.arc(p[0], p[1] - up, r, 0, 6.283); x.fill();
      if (det > 1.2) { x.fillStyle = rgba(P.copaL, 0.55); x.beginPath(); x.arc(p[0] - r * 0.3, p[1] - up - r * 0.3, r * 0.5, 0, 6.283); x.fill(); }
    }
    function quad(x, pts) { x.beginPath(); pts.forEach(function (q, i) { x[i ? "lineTo" : "moveTo"](q[0], q[1]); }); x.closePath(); }
    function predio(x, b) {
      var c = [Pj(b.x, b.y), Pj(b.x + b.w, b.y), Pj(b.x + b.w, b.y + b.d), Pj(b.x, b.y + b.d)];
      var hh = k < 1 ? b.h * 0.9 : 0, cor = b.fab ? "#B9BDC2" : P.telhado[b.cor % 5];
      if (k >= 1) {   // top-down: soft offset shadow, roof, ridge line
        x.fillStyle = P.sombra; quad(x, c.map(function (q) { return [q[0] + b.h * 0.35, q[1] + b.h * 0.35]; })); x.fill();
        x.fillStyle = cor; quad(x, c); x.fill();
        x.strokeStyle = rgba("#FFFFFF", 0.35); x.lineWidth = 0.5; x.beginPath(); x.moveTo((c[0][0] + c[3][0]) / 2, (c[0][1] + c[3][1]) / 2); x.lineTo((c[1][0] + c[2][0]) / 2, (c[1][1] + c[2][1]) / 2); x.stroke();
        return;
      }
      var lo = c.slice().sort(function (a, b2) { return b2[1] - a[1]; }), roof = c.map(function (q) { return [q[0], q[1] - hh]; });
      // front walls: edges whose both ends are on the lower half
      x.fillStyle = mixh(P.parede, "#000000", 0.08);
      for (var i = 0; i < 4; i++) { var a = c[i], d = c[(i + 1) % 4]; if (a[1] + d[1] >= lo[0][1] + lo[1][1] - 0.01) { quad(x, [a, d, [d[0], d[1] - hh], [a[0], a[1] - hh]]); x.fill(); } }
      x.fillStyle = cor; quad(x, roof); x.fill();
      x.strokeStyle = rgba("#FFFFFF", 0.3); x.lineWidth = 0.5; x.stroke();
      if (b.fab) { var cx = roof[1][0] - 3, cy = roof[1][1]; x.fillStyle = "#9EA4AA"; x.fillRect(cx - 1.2, cy - 9, 2.4, 9); }
    }
    function painel(x, pn) {
      var c = [Pj(pn.x, pn.y), Pj(pn.x + pn.w, pn.y), Pj(pn.x + pn.w, pn.y + pn.d), Pj(pn.x, pn.y + pn.d)];
      if (k < 1) c = [[c[0][0], c[0][1] - 2.2], [c[1][0], c[1][1] - 2.2], c[2], c[3]];
      x.fillStyle = "#2E5C86"; quad(x, c); x.fill();
      x.strokeStyle = rgba("#DCEBF7", 0.55); x.lineWidth = 0.35; x.beginPath();
      for (var i = 1; i < 10; i++) { var u = i / 10; x.moveTo(lerp(c[0][0], c[1][0], u), lerp(c[0][1], c[1][1], u)); x.lineTo(lerp(c[3][0], c[2][0], u), lerp(c[3][1], c[2][1], u)); }
      x.stroke(); x.strokeStyle = rgba("#FFFFFF", 0.7); x.lineWidth = 0.4; quad(x, c); x.stroke();
    }
    function camara(x, cm) {
      predio(x, { x: cm.x, y: cm.y, w: cm.w, d: cm.d, h: cm.h, cor: 3 });
      var hh = k < 1 ? cm.h * 0.9 : 0, a = Pj(cm.x, cm.y + cm.d), b = Pj(cm.x + cm.w, cm.y + cm.d), r0 = Pj(cm.x + 2, cm.y + 1), r1 = Pj(cm.x + cm.w - 2, cm.y + cm.d - 1);
      x.fillStyle = "#FFFFFF"; quad(x, [[r0[0], r0[1] - hh], [r1[0], r0[1] - hh], [r1[0], r1[1] - hh], [r0[0], r1[1] - hh]]); x.fill();
      x.fillStyle = "#2E5C86"; x.fillRect(r0[0] + 1, r0[1] - hh + 0.6, (r1[0] - r0[0]) * 0.6, Math.max(1.2, (r1[1] - r0[1]) - 1.2));
      x.fillStyle = P.cor; if (k < 1) x.fillRect(a[0], a[1] - hh * 0.55, b[0] - a[0], 1.1); else x.fillRect(a[0], a[1] - 1.4, b[0] - a[0], 1.1);
    }
    function faixa(x, ch, i0, i1, half, passo, semInicio) {   // polygon along a channel between samples i0..i1, half-width function
      passo = passo || 2; if (!semInicio) x.beginPath();
      var i, w;
      for (i = i0; i <= i1; i += passo) { w = half(i); x[i === i0 ? "moveTo" : "lineTo"](ch.x[i] + ch.nx[i] * w, ch.y[i] + ch.ny[i] * w); }
      i = i1; w = half(i); x.lineTo(ch.x[i] + ch.nx[i] * w, ch.y[i] + ch.ny[i] * w);
      for (i = i1; i >= i0; i -= passo) { w = half(i); x.lineTo(ch.x[i] - ch.nx[i] * w, ch.y[i] - ch.ny[i] * w); }
      i = i0; w = half(i); x.lineTo(ch.x[i] - ch.nx[i] * w, ch.y[i] - ch.ny[i] * w);
      x.closePath();
    }

    // ── water model ───────────────────────────────────────────────────────
    var V_Q = 330, V_C = 58, camada = null;
    function advecta(arr, v, dt) {
      var sh = v * dt / STEP; if (sh <= 0) return;
      for (var i = arr.length - 1; i >= 1; i--) { var src = i - sh, a = Math.floor(src); if (a < 0) { arr[i] = arr[0]; continue; } var f = src - a; arr[i] = lerp(arr[a], arr[Math.min(arr.length - 1, a + 1)], f); }
    }
    function agua(dt) {
      var m = W0.main, fi = W0.fabrica.i;
      W0.canais.forEach(function (ch) {
        if (ch.pai) { ch.q[0] = ch.pai.q[ch.pai.n - 1]; ch.c[0] = ch.pai.c[ch.pai.n - 1] * 0.85; } else ch.q[0] = st.agua;
        advecta(ch.q, V_Q, dt); advecta(ch.c, V_C, dt);
        if (ch === m) {
          var ii = W0.intake.i, ib = W0.fazenda.bomba.i;
          m.q[ii] = m.q[ii - 1] * (1 - st.desvio * 0.93);
          m.q[ib] = m.q[ib - 1] * (1 - 0.04 * st.irr);
          m.c[fi] = Math.max(m.c[fi], st.sujo); if (st.sujo < 0.05) m.c[fi] *= 0.9;
          for (var i = 0; i < fi; i++) m.c[i] = 0;
        }
        var dec = Math.pow(ch.pai ? 0.9985 : 0.9993, dt * 60); for (var j = 0; j < ch.n; j++) ch.c[j] *= dec;
      });
    }
    function largAgua(ch, i) { var q = ch.q[i]; return ch.wb[i] * clamp(0.93 * Math.pow(Math.max(q, 0.05), 0.62), 0.14, 1.4); }
    function aguaNaFazenda() { var m = W0.main, i = W0.fazenda.bomba.i; return { q: m.q[i], c: m.c[i] }; }

    // ── particles (flow lines, glints) ────────────────────────────────────
    var PN = 0, pch, ps, pu, pv, pf;
    function particulas() {
      var tot = 0, chs = W0.canais; chs.forEach(function (c) { tot += c.len * (c.wb[c.n - 1] + c.wb[0]) / 2; });
      PN = Math.round((estilo === "linhas" ? 1100 : estilo === "misto" ? 600 : estilo === "brilho" ? 800 : 0) * (W * H > 900000 ? 1 : 0.7));
      pch = new Uint8Array(PN); ps = new Float32Array(PN); pu = new Float32Array(PN); pv = new Float32Array(PN); pf = new Float32Array(PN);
      var r = rnd(99);
      for (var i = 0; i < PN; i++) {
        var x = r() * tot, ci = 0; for (; ci < chs.length - 1; ci++) { var a = chs[ci].len * (chs[ci].wb[chs[ci].n - 1] + chs[ci].wb[0]) / 2; if (x < a) break; x -= a; }
        pch[i] = ci; ps[i] = r() * chs[ci].len; pu[i] = (r() * 2 - 1) * 0.85; pv[i] = 0.7 + r() * 0.6; pf[i] = r() * 6.28;
      }
    }
    function moveParticulas(dt) {
      var chs = W0.canais;
      for (var i = 0; i < PN; i++) {
        var ch = chs[pch[i]], ix = clamp(Math.round(ps[i] / STEP), 0, ch.n - 1);
        var v = (14 + 22 * clamp(ch.q[ix], 0.2, 2.2)) * pv[i] * (1 - 0.5 * pu[i] * pu[i]);
        ps[i] += v * dt;
        if (ps[i] > ch.len) {
          if (ch.filhos.length) { var f = ch.filhos[Math.floor(Math.random() * ch.filhos.length)]; pch[i] = chs.indexOf(f); ps[i] = 0; }
          else if (ch.foz) { pch[i] = 0; ps[i] = Math.random() * 30; }
          else { pch[i] = Math.random() < 0.7 ? 0 : 1; ps[i] = Math.random() * 20; }
        }
      }
    }

    // ── live drawing ──────────────────────────────────────────────────────
    var vx0, vy0, vx1, vy1;   // visible ground rect (for culling)
    // focus point on screen: centred for the overview, moved clear of the caption when close in
    var temUI = !!(cfg.ui && (cfg.ui.botoes || cfg.ui.legenda || cfg.ui.nota || cfg.ui.grupos));
    function foco() {
      if (!temUI) return [W / 2, H / 2];
      var a = sstep(1.3, 3, cam.z);
      var fo = cfg.foco || [0.6, 0.42], f0 = cfg.foco0 || [0.5, 0.5];   // foco0: where the overview sits (clear of the caption)
      return retrato ? [W / 2, H * lerp(f0[1], cfg.foco ? 0.64 : 0.34, a)] : [W * lerp(f0[0], fo[0], a), H * lerp(f0[1], fo[1], a)];
    }
    function camTx() {   // context transform for projected space
      var S = fit * cam.z, c = Pj(cam.x, cam.y), f = foco();
      g.setTransform(dpr * S, 0, 0, dpr * S, dpr * (f[0] - c[0] * S), dpr * (f[1] - c[1] * S));
      return S;
    }
    function toScreen(wx, wy) { var S = fit * cam.z, c = Pj(cam.x, cam.y), p = Pj(wx, wy), f = foco(); return [f[0] + (p[0] - c[0]) * S, f[1] + (p[1] - c[1]) * S]; }
    function visW(wx, wy, r) { var p = toScreen(wx, wy), rr = r * fit * cam.z; return p[0] > -rr && p[0] < W + rr && p[1] > -rr && p[1] < H + rr; }

    var rotulosOcup = [];
    function desenha() {
      rotulosOcup = [];
      if (cfg.seletivo) { var rr = root.getBoundingClientRect(); [].forEach.call(root.querySelectorAll(".wc__cap,.vs__titulo,.wc__ctl"), function (e) { var b = e.getBoundingClientRect(); if (b.width) rotulosOcup.push([b.left - rr.left - 6, b.top - rr.top - 6, b.width + 12, b.height + 12]); }); }
      if (!base) constroiBase();
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = P.fundo; g.fillRect(0, 0, cv.width, cv.height);
      var S = camTx();
      g.imageSmoothingEnabled = true;
      (function () {   // base cache: crop to the view as well
        var cc = Pj(cam.x, cam.y), hwv = W / S, hhv = H / S, e = base.ext;
        var vx0 = Math.max(e[0], cc[0] - hwv), vx1 = Math.min(e[2], cc[0] + hwv), vy0 = Math.max(e[1] * k, cc[1] - hhv), vy1 = Math.min(e[3] * k, cc[1] + hhv);
        if (vx1 > vx0 && vy1 > vy0) g.drawImage(base.c, (vx0 - e[0]) * base.cs, (vy0 - e[1] * k) * base.cs, (vx1 - vx0) * base.cs, (vy1 - vy0) * base.cs, vx0, vy0, vx1 - vx0, vy1 - vy0);
      })();
      var pxu = S * dpr;
      if (pxu > base.cs * 1.15) {
        var al = sstep(base.cs * 1.15, base.cs * 1.7, pxu);
        var cc = Pj(cam.x, cam.y), hwv = W / S, hhv = H / S;   // only detail canvases that overlap the view
        // draw just ONE detail canvas: the one that covers most of the view, sharpest first
        var melhor = null, mv = -1;
        detalhes.forEach(function (d) {
          var ox = Math.max(0, Math.min(d.ext[2], cc[0] + hwv / 2) - Math.max(d.ext[0], cc[0] - hwv / 2)), oy = Math.max(0, Math.min(d.ext[3] * k, cc[1] + hhv / 2) - Math.max(d.ext[1] * k, cc[1] - hhv / 2));
          var v = ox * oy * (1 + 0.15 * Math.min(d.cs, pxu) / Math.max(pxu, 0.01)); if (v > mv) { mv = v; melhor = d; } });
        (melhor ? [melhor] : []).forEach(function (d) {
          if (d.ext[2] < cc[0] - hwv || d.ext[0] > cc[0] + hwv || d.ext[3] * k < cc[1] - hhv || d.ext[1] * k > cc[1] + hhv) return;
          g.globalAlpha = al;
          // crop to the visible part of the detail canvas: far fewer pixels to scale
          var vx0 = Math.max(d.ext[0], cc[0] - hwv), vx1 = Math.min(d.ext[2], cc[0] + hwv), vy0 = Math.max(d.ext[1] * k, cc[1] - hhv), vy1 = Math.min(d.ext[3] * k, cc[1] + hhv);
          if (vx1 <= vx0 || vy1 <= vy0) return;
          var sx = (vx0 - d.ext[0]) * d.cs, sy = (vy0 - d.ext[1] * k) * d.cs, sw = (vx1 - vx0) * d.cs, sh = (vy1 - vy0) * d.cs;
          g.drawImage(d.c, sx, sy, sw, sh, vx0, vy0, vx1 - vx0, vy1 - vy0);
        });
        g.globalAlpha = 1;
      }
      // dry season over the land
      if (st.seco > 0.02) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "multiply"; g.fillStyle = rgba(P.seco, 0.42 * st.seco); g.fillRect(0, 0, cv.width, cv.height); g.restore(); }
      g.save(); groundTx(g);
      // neighbours' fields react: dry, flooded
      var q = aguaNaFazenda(), cheia = clamp((q.q - 1.15) / 0.8, 0, 1);
      W0.parcelas.forEach(function (p) {
        if (!(p.viz || (p.varzea && cheia > 0.02)) || !visW(p.mx, p.my, 60)) return;
        var seca = p.viz ? 1 - st.viz : 0;
        if (seca < 0.03 && !(p.varzea && cheia > 0.02)) return;
        g.beginPath(); p.p.forEach(function (qq, i) { g[i ? "lineTo" : "moveTo"](qq[0], qq[1]); }); g.closePath();
        if (seca > 0.03) { g.fillStyle = rgba(P.seco, 0.75 * seca); g.fill(); }
        if (p.varzea && cheia > 0.02) { g.fillStyle = rgba(mixh(P.agua, "#A9C4CC", 0.3), 0.3 * cheia * sstep(55, 10, p.e)); g.fill(); }
      });
      pivos(true);
      fazendaChao();
      aguas(S);
      g.restore();
      upright(S);
      if (vida) vidaMov(S);
      ceu(S);
      if (cfg.ui && cfg.ui.tilt) desfoca();
      if (ligacoes) desenhaLigacoes(S);
      avisosRio();
      if (cfg.agrotechjes) instalacoes();
      rotulos(S);
    }

    function pivos(chao) {
      W0.pivos.forEach(function (p, n) {
        if (!visW(p.x, p.y, p.r + 10)) return;
        var big = n < 6, saude = big ? clamp(0.9 - st.seco * 0.4 + st.desvio * 0.2, 0, 1) : 1 - st.seco * 0.6;
        if (saude < 0.98) { g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fillStyle = rgba(P.pivoSeco, (1 - saude) * 0.85); g.fill(); }
        var on = big ? st.pivo : st.pivo * 0.6, a = p.a + tempo * (0.05 + 0.1 * on);
        if (on > 0.05) {   // wetted wedge behind the arm
          g.beginPath(); g.moveTo(p.x, p.y); g.arc(p.x, p.y, p.r, a - 0.6 * on - 0.05, a); g.closePath(); g.fillStyle = rgba(P.agua, 0.32 * on); g.fill();
          if (on > 0.4) { g.fillStyle = rgba("#DDF2FF", 0.85 * on); for (var dd = 6; dd < p.r; dd += 5) { var fl = 0.6 + 0.4 * Math.sin(tempo * 9 + dd); g.beginPath(); g.arc(p.x + Math.cos(a - 0.05) * dd, p.y + Math.sin(a - 0.05) * dd, 1.1 * fl, 0, 6.283); g.fill(); } }
        }
        g.strokeStyle = rgba("#F4F1EA", 0.95); g.lineWidth = 0.9; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r); g.stroke();
        g.fillStyle = "#F4F1EA"; g.beginPath(); g.arc(p.x, p.y, 1.4, 0, 6.283); g.fill();
      });
      // the factory outlet: a pipe to the bank, brown outflow while discharging
      var fb = W0.fabrica; g.strokeStyle = "#8E959C"; g.lineWidth = 1.4; g.lineCap = "round"; g.beginPath(); g.moveTo(fb.x, fb.y + 4); g.lineTo(fb.bx, fb.by); g.stroke();
      if (st.sujo > 0.05) { g.fillStyle = rgba("#8C6232", 0.75 * st.sujo); g.beginPath(); g.arc(fb.bx, fb.by + 2, 3 + 1.2 * Math.sin(tempo * 4), 0, 6.283); g.fill(); }
      // the estate's reservoir and intake canal
      var ac = W0.acude, lv = clamp(0.55 + 0.35 * st.agua - 0.4 * st.seco + 0.3 * st.desvio, 0.15, 1.15);
      g.beginPath(); g.ellipse(ac.x, ac.y, ac.rx * lv, ac.ry * lv, -0.3, 0, 6.283); g.fillStyle = P.agua; g.fill();
      var ct = W0.canalTomada; g.beginPath(); ct.forEach(function (qq, i) { g[i ? "lineTo" : "moveTo"](qq[0], qq[1]); });
      g.strokeStyle = P.leito; g.lineWidth = 3.2; g.lineCap = "round"; g.stroke();
      var fl = clamp(0.25 + st.desvio, 0, 1.2); g.strokeStyle = P.agua; g.lineWidth = 1.2 + 3.4 * fl; g.stroke();
      if (fl > 0.3) { g.setLineDash([2, 4]); g.lineDashOffset = -tempo * 14 * fl; g.strokeStyle = rgba(P.linhaAgua, 0.8); g.lineWidth = 0.8; g.stroke(); g.setLineDash([]); }
    }

    // ── farm state: where the water comes from, how much, and whether the pump can reach it ──
    var hoje = 0, diaT = 0, fz = { alc: 1, dem: 0, rio: 0, outros: 0, entregue: 0, rioRate: 0, enche: 0, c: 0, q: 1 };
    function fazendaEstado(dt) {
      if (cenaId === "frioCom" && frioT0 < 0) frioT0 = tempo;
      var m = W0.main, ib = W0.fazenda.bomba.i;
      fz.q = m.q[ib]; fz.c = m.c[ib];
      fz.alc = sstep(0.4, 0.62, fz.q);
      fz.dem = st.irr * 4.2;
      fz.rio = fz.dem * fz.alc;
      fz.outros = (fz.dem - fz.rio) * st.agro * clamp(alvo.poco * st.poco + (alvo.res > 0.1 && st.res > 0.1 ? 1 : 0), 0, 1);
      fz.fecha = st.agro > 0.5 && st.qual > 0.5 && fz.c > 0.12 ? 1 : 0;
      if (fz.fecha) { fz.rio = 0; fz.enche = 0; fz.outros = fz.dem * st.agro * clamp(alvo.poco * st.poco + (alvo.res > 0.1 && st.res > 0.1 ? 1 : 0), 0, 1); }
      fz.entregue = fz.rio + fz.outros;
      fz.enche = st.agro * clamp((alvo.res - st.res) * 6, 0, 1) * fz.alc;
      fz.rioRate = fz.fecha ? 0 : fz.rio + 3.2 * fz.enche;
      diaT += dt; if (diaT > 45) { diaT = 0; hoje = 0; }   // one simulated day = 45 s
      hoje += fz.rioRate * dt * 0.35;
    }
    function linha(pts) { g.beginPath(); pts.forEach(function (p, i) { g[i ? "lineTo" : "moveTo"](p[0], p[1]); }); }
    function tubo(pts, larg, flui, cor, lw) {
      linha(pts); g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#7D8792"; g.lineWidth = larg; g.stroke();
      if (flui > 0.03) { g.setLineDash([1.1, 2.2]); g.lineDashOffset = -(marcaModo ? golpes() * 6.5 : tempo * 7); g.strokeStyle = rgba(cor, 0.95 * clamp(flui, 0, 1)); g.lineWidth = larg * 0.62; g.stroke(); g.setLineDash([]); }
    }
    function corAguaTubo() { return fz.c > 0.15 ? "#8C6232" : "#38B6FF"; }

    function fazendaChao() {
      var F = W0.fazenda, T = F.T; if (!visW(F.cx, F.cy, 190)) return;
      var zz = fit * cam.z, ent = fz.dem > 0.05 ? fz.entregue / Math.max(0.5, fz.dem) : 0, molhado = st.irr * ent;
      // reservoir (part of the farm's water design): embankment, bottom, water level
      if (st.agro > 0.02) {
        var rp = F.represa; g.globalAlpha = st.agro;
        g.fillStyle = mixh(P.terra, P.fundo, 0.55); g.beginPath(); g.ellipse(rp.x, rp.y, rp.rx + 4, rp.ry + 3.5, -0.08, 0, 6.283); g.fill();
        g.fillStyle = P.leito; g.beginPath(); g.ellipse(rp.x, rp.y, rp.rx, rp.ry, -0.08, 0, 6.283); g.fill();
        var lv = clamp(st.res, 0, 1);
        if (lv > 0.02) { var sc = 0.3 + 0.7 * Math.sqrt(lv); g.fillStyle = P.agua; g.beginPath(); g.ellipse(rp.x, rp.y + (1 - sc) * 2, rp.rx * sc, rp.ry * sc, -0.08, 0, 6.283); g.fill();
          g.strokeStyle = rgba(P.aguaL, 0.8); g.lineWidth = 0.5; g.stroke(); }
        g.globalAlpha = 1;
      }
      // beds: wet strips, cracks in dry soil, drip lines with drops
      var fert = st.fert * st.agro;
      F.leitos.forEach(function (b, j) {
        if (!visW(b[0][0], b[0][1], 140)) return;
        if (molhado > 0.04) { linha(b); g.strokeStyle = rgba(P.soloMolhado, 0.5 * clamp(molhado, 0, 1)); g.lineWidth = 2.4; g.stroke(); }
        var seca = clamp((st.seco - 0.35) * 1.6, 0, 1) * (1 - clamp(molhado * 2, 0, 1));
        if (seca > 0.05 && zz > 3) {
          g.strokeStyle = rgba("#6E4B2C", 0.55 * seca); g.lineWidth = 0.18;
          for (var c = 0; c < b.length - 2; c += 3) { var p = b[c], h1 = hash(j, c); g.beginPath(); g.moveTo(p[0], p[1] - 1.4); g.lineTo(p[0] + 0.8 + h1, p[1] - 0.2); g.lineTo(p[0] + 0.2, p[1] + 1.3); g.stroke(); }
        }
        if (zz > 2.6) {
          linha(b.map(function (p) { return [p[0], p[1] + 0.7]; })); g.strokeStyle = rgba("#2B2B2B", 0.55); g.lineWidth = 0.22; g.stroke();
          g.beginPath(); g.moveTo(b[0][0] - 2, b[0][1] + 0.7); g.lineTo(b[0][0], b[0][1] + 0.7); g.strokeStyle = "#7D8792"; g.lineWidth = 0.45; g.stroke();   // connector to the manifold
          if (molhado > 0.05) for (var e = 1; e < b.length; e += 2) {
            var ph = (tempo * 0.8 - e * 0.12 + j * 0.3) % 1; if (ph < 0) ph += 1; var rr = 0.22 + 0.5 * Math.sin(ph * Math.PI);
            var isF = fert > 0.3 && (e + j) % 5 === 0;
            g.fillStyle = isF ? rgba("#4E9B6E", 0.95) : rgba(corAguaTubo(), 0.9 * molhado); g.beginPath(); g.arc(b[e][0], b[e][1] + 0.7, rr, 0, 6.283); g.fill();
          }
        }
      });
      // orchard wet circles + laterals
      F.pomar.forEach(function (t, i) {
        if (molhado > 0.05) { g.fillStyle = rgba(P.soloMolhado, 0.35 * molhado * (0.7 + 0.3 * Math.sin(tempo * 1.4 + i))); g.beginPath(); g.ellipse(t.x, t.y + 1, 4, 3.2, 0, 0, 6.283); g.fill(); }
      });
      if (zz > 5.5) F.fileiras.forEach(function (r) { g.beginPath(); r.forEach(function (p, n) { g[n ? "lineTo" : "moveTo"](p[0], p[1] + 1.6); }); g.strokeStyle = rgba("#2B2B2B", 0.16); g.lineWidth = 0.18; g.stroke(); });
      // pipes: suction from the river, pump -> meter -> filter, reservoir in/out, well, header, manifold, submain
      var t = F.tubos, cor = corAguaTubo(), suga = fz.rioRate / 4.2;
      if (fz.alc < 0.5) { var pe = t.suc[0]; g.fillStyle = rgba(mixh(P.areia, "#FFFFFF", 0.2), 0.95 * (1 - fz.alc * 2)); g.beginPath(); g.ellipse(pe[0], pe[1] - 1, 7, 3.5, 0, 0, 6.283); g.fill(); }
      tubo(t.suc, 1.1, suga, cor); tubo(t.rec, 1.1, suga, cor);
      if (false) { var cm = F.camara, pc = (tempo * 0.6) % 1; g.strokeStyle = rgba("#38B6FF", st.frio * (1 - pc) * 0.8); g.lineWidth = 0.6;
        g.beginPath(); g.ellipse(cm.x + cm.w / 2, cm.y + cm.d / 2, cm.w * (0.6 + 0.5 * pc), cm.d * (0.8 + 0.8 * pc), 0, 0, 6.283); g.stroke(); }
      if (st.agro > 0.5 && st.qual > 0.3) {   // valve after the pump: green open, red closed
        var vx = 898, vy = F.T + 4.6, vc = fz.fecha ? "#C0392B" : "#4E9B6E";
        g.fillStyle = vc; g.beginPath(); g.moveTo(vx - 2, vy - 1.4); g.lineTo(vx + 2, vy + 1.4); g.lineTo(vx + 2, vy - 1.4); g.lineTo(vx - 2, vy + 1.4); g.closePath(); g.fill();
        var sx = t.suc[1][0], sy = t.suc[1][1] - 2, pul = (tempo * 1.4) % 1;   // the sensor at the intake
        g.fillStyle = "#14263C"; g.beginPath(); g.arc(sx, sy, 1.2, 0, 6.283); g.fill();
        g.strokeStyle = fz.fecha ? rgba("#C0392B", 1 - pul) : rgba("#38B6FF", 0.7 * (1 - pul)); g.lineWidth = 0.5; g.beginPath(); g.arc(sx, sy, 1.6 + pul * 5, 0, 6.283); g.stroke();
      }
      if (st.agro > 0.3) {
        tubo(t.resIn, 0.9, fz.enche * 1.5, cor);
        tubo(t.resOut, 0.9, st.res > 0.1 && fz.outros > 0.05 ? 1 : 0, P.aguaE);
        tubo(t.poco, 0.8, st.poco > 0.4 && fz.outros > 0.05 ? 1 : 0, P.aguaE);
      }
      tubo(t.desce, 1, fz.rio / 4.2, cor);
      tubo(t.header, 1, ent * st.irr, fert > 0.3 ? "#4E9B6E" : cor);
      t.redes.forEach(function (r) { if (r.length > 1) tubo(r, 0.75, ent * st.irr, cor); });
      // solar cables
      if (st.agro > 0.3) { g.strokeStyle = "#1E2B3A"; g.lineWidth = 0.35; linha(F.caboBomba); g.stroke(); linha(F.caboPoco); g.stroke(); }
    }

    var mancha = null, manchaT = -1;
    function cheiaMancha() {
      var C3 = W0.cheia, maxq = 0, m = W0.main; for (var i = 0; i < m.n; i += 8) maxq = Math.max(maxq, m.q[i]);
      if (maxq < 1.14) return;
      if (!mancha) { mancha = document.createElement("canvas"); mancha.width = C3.fw; mancha.height = C3.fh; mancha.x = mancha.getContext("2d"); mancha.img = mancha.x.createImageData(C3.fw, C3.fh); }
      if (tempo - manchaT > 0.1 || manchaT < 0) {
        manchaT = tempo;
        var d = mancha.img.data, N = C3.fw * C3.fh, rs = hx("#D3EAF3"), rd = hx("#7DB8D6"), prot = st.agro > 0.5;
        for (var o = 0; o < N; o++) {
          var v = C3.v[o], k4 = o * 4; d[k4 + 3] = 0;
          if (v > 160) continue;
          var ch = W0.canais[C3.ci[o]], q = ch.q[Math.min(C3.si[o], ch.n - 1)], Lv = 92 * (q - 1.12);
          if (Lv <= 0 || v >= Lv) continue;
          var guard = prot ? sstep(0.95, 1.3, C3.faz[o]) : 1; if (guard <= 0) continue;   // with the farm's water design the farm stays dry
          var dep = Math.pow((Lv - v) / Lv, 0.8), a = 0.42 + 0.4 * clamp(dep * 2, 0, 1);
          d[k4] = lerp(rs[0], rd[0], dep); d[k4 + 1] = lerp(rs[1], rd[1], dep); d[k4 + 2] = lerp(rs[2], rd[2], dep); d[k4 + 3] = a * 255 * clamp((Lv - v) / 3, 0, 1) * guard;
        }
        mancha.x.putImageData(mancha.img, 0, 0);
      }
      g.imageSmoothingEnabled = true; g.drawImage(mancha, -M, -M, C3.fw * C3.FG, C3.fh * C3.FG);
    }
    function bacias() {
      W0.bacias.forEach(function (b, n) {
        var ch = W0.canais[b.ch], q = ch.q[Math.min(b.i, ch.n - 1)];
        var f = b.lagoa ? clamp(0.32 + (q - 1) * 0.9 - st.seco * 0.25, 0.06, 1) : sstep(b.thr, b.thr + 0.45, q);
        if (f < 0.02 || !visW(b.x, b.y, b.r * 1.6)) return;
        var R = b.r * (b.lagoa ? 0.45 + 0.75 * f : 0.35 + 0.75 * f);
        var pts = b.raio.map(function (rr, a) { var an = a / b.raio.length * 6.283; return [b.x + Math.cos(an) * R * rr, b.y + Math.sin(an) * R * rr * 0.8]; });
        if (!b.lagoa) { g.fillStyle = rgba(P.soloMolhado, 0.22 * f); g.beginPath(); g.ellipse(b.x, b.y, R * 1.35, R * 1.1, 0, 0, 6.283); g.fill(); }
        if (b.lagoa) { g.fillStyle = rgba(P.mangue, 0.35); g.beginPath(); g.ellipse(b.x, b.y, b.r * 1.15, b.r * 0.9, 0, 0, 6.283); g.fill(); }
        g.beginPath();
        for (var i = 0; i <= pts.length; i++) { var p0 = pts[i % pts.length], p1 = pts[(i + 1) % pts.length], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2; if (!i) g.moveTo(mx, my); else g.quadraticCurveTo(p0[0], p0[1], mx, my); }
        g.closePath();
        g.fillStyle = rgba(mixh(P.agua, "#A9C4CC", 0.25), b.lagoa ? 0.95 : 0.88 * clamp(f * 1.4, 0, 1)); g.fill();
        g.strokeStyle = rgba(P.aguaL, 0.9); g.lineWidth = 0.8; g.stroke();
      });
    }
    var nuvemSpr = null;
    function sprNuvem() {
      if (nuvemSpr) return nuvemSpr;
      var c = document.createElement("canvas"); c.width = c.height = 64; var x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(128,88,44,1)"); gr.addColorStop(0.55, "rgba(140,98,50,.55)"); gr.addColorStop(1, "rgba(140,98,50,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64); nuvemSpr = c; return c;
    }
    function caminhoAgua() {
      g.beginPath();
      W0.canais.forEach(function (ch) { faixa(g, ch, 0, ch.n - 1, function (i) { return largAgua(ch, i) / 2 + 0.4; }, 2, true); });
    }

    function aguas(S) {
      var m = W0.main, lw = 1 / (S * Math.max(k, 0.6));
      bacias();
      var maxq = 0; for (var i0 = 0; i0 < m.n; i0 += 8) maxq = Math.max(maxq, m.q[i0]);
      var cheiaF = clamp((maxq - 1.1) / 0.8, 0, 1), turvo = 0;
      cheiaMancha();
      var corA = mixh(P.agua, "#9DB9C2", cheiaF * 0.3), corE = mixh(P.aguaE, "#7FA0AC", cheiaF * 0.3), corL = mixh(P.aguaL, "#C9D9DC", cheiaF * 0.3);
      var chs = W0.canais;
      function banda(f, cor) {   // one band across ALL channels, then round caps at each split: no seams at the junctions
        chs.forEach(function (ch) { faixa(g, ch, 0, ch.n - 1, function (i) { return largAgua(ch, i) / 2 * f; }); g.fillStyle = cor; g.fill(); });
        chs.forEach(function (ch) { if (!ch.filhos.length) return; var e = ch.n - 1, r = largAgua(ch, e) / 2 * f; g.beginPath(); g.arc(ch.x[e], ch.y[e], r, 0, 6.283); g.fillStyle = cor; g.fill(); });
      }
      if (estilo === "faixas" || estilo === "misto") { banda(1, corL); banda(0.72, corA); banda(0.34, rgba(corE, 0.75)); }
      else { banda(1, corA); if (estilo === "brilho") banda(0.5, rgba(corE, 0.5)); }
      // pollution: a diffuse cloud that leaves the industry bank and mixes across the river downstream
      var temSujo = false; chs.forEach(function (ch) { for (var i = 0; i < ch.n; i += 6) if (ch.c[i] > 0.03) temSujo = true; });
      if (temSujo) {
        g.save(); caminhoAgua(); g.clip();
        var spr = sprNuvem(), fi = W0.fabrica.i;
        chs.forEach(function (ch) {
          for (var i = 0; i < ch.n; i += 2) {
            var cc = ch.c[i]; if (cc < 0.03) continue;
            var d = ch === m ? (i - fi) * STEP : 400, mixw = sstep(0, 170, d), half = largAgua(ch, i) / 2;
            var u = lerp(-0.8, 0, mixw) + (0.25 + 0.35 * mixw) * Math.sin(i * 0.41 + tempo * 0.7 + Math.sin(i * 0.13) * 2);
            var r = half * (0.55 + 0.9 * mixw) + 2.5 + 2 * (1 - mixw) * Math.sin(i * 0.9 + tempo * 1.3);
            var x = ch.x[i] + ch.nx[i] * u * half, y = ch.y[i] + ch.ny[i] * u * half;
            if (!visW(x, y, r + 4)) continue;
            g.globalAlpha = clamp(cc * (0.5 + 0.25 * mixw), 0, 0.9); g.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
          }
        });
        g.globalAlpha = 1; g.restore();
      }
      // current lines for the ribbon style
      if (estilo === "faixas" || estilo === "misto") chs.forEach(function (ch) {
        var half = function (i) { return largAgua(ch, i) / 2; };
        g.strokeStyle = rgba(P.linhaAgua, estilo === "faixas" ? 0.55 : 0.35); g.lineWidth = Math.max(0.25, lw * 1.1);
        var dash = 14 + 6 * (ch.id === "rio" ? 1 : 0);
        g.setLineDash([dash * 0.45, dash]); g.lineDashOffset = -tempo * (12 + 10 * clamp(m.q[0], 0.3, 2));
        [-0.42, 0, 0.42].forEach(function (u, ui) {
          if (ch.id !== "rio" && ui !== 1 && ch.wb[0] < 8) return;
          g.beginPath();
          for (var i2 = 0; i2 < ch.n; i2 += 3) { var o = half(i2) * u; g[i2 ? "lineTo" : "moveTo"](ch.x[i2] + ch.nx[i2] * o, ch.y[i2] + ch.ny[i2] * o); }
          g.stroke();
        });
        g.setLineDash([]);
      });
      // sandbars (drought)
      chs.forEach(function (ch) {
        if (!ch.bancos) { ch.bancos = []; for (var i = 14; i < ch.n - 14; i += 17) { var a = Math.atan2(ch.y[i + 4] - ch.y[i], ch.x[i + 4] - ch.x[i]), b = Math.atan2(ch.y[i + 8] - ch.y[i + 4], ch.x[i + 8] - ch.x[i + 4]), cv2 = Math.sin(b - a); ch.bancos.push({ i: i, lado: cv2 > 0 ? 1 : -1, f: hash(i, ch.n) }); } }
        ch.bancos.forEach(function (bk) {
          var q = ch.q[bk.i], al = sstep(0.8, 0.42, q); if (al < 0.02 || !visW(ch.x[bk.i], ch.y[bk.i], 30)) return;
          var wb = ch.wb[bk.i], o = wb * 0.27 * bk.lado, x = ch.x[bk.i] + ch.nx[bk.i] * o, y = ch.y[bk.i] + ch.ny[bk.i] * o, an = Math.atan2(ch.ny[bk.i], ch.nx[bk.i]) + Math.PI / 2;
          g.fillStyle = rgba(mixh(P.areia, "#FFFFFF", 0.25), al * 0.95); g.beginPath(); g.ellipse(x, y, (7 + 9 * bk.f) * (0.6 + 0.4 * al) + wb * 0.3, wb * 0.24 * (0.6 + 0.4 * al), an, 0, 6.283); g.fill();
        });
      });
      g.fillStyle = P.agua; g.beginPath(); g.ellipse(m.x[0] - 2, m.y[0], 4, 3, 0, 0, 6.283); g.fill();
    // particles
      if (PN) {
        var chs = W0.canais, Lr = estilo === "linhas" ? 10 : estilo === "misto" ? 14 : 2.2, zf = 1 / Math.sqrt(Math.max(1, cam.z));
        g.lineCap = "round";
        var buckets = estilo === "brilho" ? 1 : 2;
        for (var bk = 0; bk < buckets; bk++) {
          g.beginPath();
          for (var p = 0; p < PN; p++) {
            if (estilo !== "brilho" && (p & 1) !== bk) continue;
            var ch = chs[pch[p]], s = ps[p], ix = clamp(Math.round(s / STEP), 0, ch.n - 1);
            var x = ch.x[ix], y = ch.y[ix]; if (!visW(x, y, 20)) continue;
            var half2 = largAgua(ch, ix) / 2, len = Lr * zf * (estilo === "brilho" ? 1 : 1);
            if (estilo === "brilho") {
              var tw = Math.sin(tempo * 2.2 + pf[p]); if (tw < 0.55) continue;
              var o0 = pu[p] * half2 * 0.8; g.moveTo(x + ch.nx[ix] * o0, y + ch.ny[ix] * o0);
              var j2 = clamp(ix + 1, 0, ch.n - 1); g.lineTo(ch.x[j2] + ch.nx[j2] * o0, ch.y[j2] + ch.ny[j2] * o0);
              continue;
            }
            var segs = 3;
            for (var sg = 0; sg <= segs; sg++) {
              var s2 = Math.max(0, s - len * sg / segs), i3 = clamp(Math.round(s2 / STEP), 0, ch.n - 1), o3 = pu[p] * largAgua(ch, i3) / 2 * 0.88;
              g[sg ? "lineTo" : "moveTo"](ch.x[i3] + ch.nx[i3] * o3, ch.y[i3] + ch.ny[i3] * o3);
            }
          }
          if (estilo === "brilho") { g.strokeStyle = rgba("#FFFFFF", 0.9); g.lineWidth = Math.max(0.3, lw * 1.6); }
          else if (estilo === "linhas") { g.globalAlpha = 1 - turvo * 0.7; g.strokeStyle = bk ? rgba(P.linhaAgua, 0.7) : rgba(mixh(P.aguaL, "#FFFFFF", 0.4), 0.55); g.lineWidth = Math.max(0.2, lw * (bk ? 1.1 : 1.6)); }
          else { g.strokeStyle = rgba(P.linhaAgua, (bk ? 0.55 : 0.35) * (1 - turvo)); g.lineWidth = Math.max(0.2, lw * 1.2); }
          g.stroke(); g.globalAlpha = 1;
        }
      }

    }

    // ── upright farm things, painter-sorted: crops, orchard, sensors, well, pump, meter, tanks, farmer ──
    function upright(S) {
      var F = W0.fazenda, zz = fit * cam.z, T = F.T;
      if (!visW(F.cx, F.cy, 190)) return;
      g.save(); camTx();
      var sa = st.sua, ent = fz.dem > 0.05 ? fz.entregue / Math.max(0.5, fz.dem) : 0, rega = st.irr * ent, it = [];
      if (zz > 2.2) F.leitos.forEach(function (b, j) { for (var e = 0; e < b.length; e++) it.push({ t: 0, x: b[e][0], y: b[e][1], i: e, j: j }); });
      F.pomar.forEach(function (t, i) { it.push({ t: 1, x: t.x, y: t.y, i: i }); });
      F.sensores.forEach(function (s, i) { it.push({ t: 2, x: s.x, y: s.y, i: i }); });
      if (st.agro > 0.05) { it.push({ t: 3, x: F.poco.x, y: F.poco.y }); it.push({ t: 5, x: F.medidor.x, y: F.medidor.y }); it.push({ t: 6, x: 931, y: T + 6 }); }
      it.push({ t: 4, x: F.pump.x, y: F.pump.y });
      var sq = colheitaSeq(), fp = sq ? sq.f : posAgricultor(); it.push({ t: 7, x: fp.x, y: fp.y, f: fp });
      if (sq) { if (sq.cesto) it.push({ t: 11, x: sq.cesto[0], y: sq.cesto[1], n: sq.n }); if (sq.carro) it.push({ t: 10, x: sq.carro[0], y: sq.carro[1], dir: sq.f.dx < 0 ? -1 : 1 });
        it.push({ t: 12, x: F.camara.x + F.camara.w / 2, y: F.camara.y + F.camara.d + 0.01, sq: sq }); }
      if (st.agro > 0.3) it.push({ t: 8, x: F.estacao.x, y: F.estacao.y });

      it.sort(function (a, b) { return a.y - b.y; });
      var up = k < 1 ? 1 : 0.35;
      it.forEach(function (o) {
        if (o.t !== 7 && !visW(o.x, o.y, 9)) return;   // only what is on screen
        var p = Pj(o.x, o.y);
        if (o.t === 0) { var tp2 = F.leitoTipo[o.j], hh2 = clamp(sa - 0.12 * hash(o.j, o.i), 0, 1); if (tp2 === "mandioca") { if (o.i % 2 === 0) mandioca(p[0], p[1], hh2, o.i * 13 + o.j, up); } else if (tp2 === "feijao") feijao(p[0], p[1], hh2, o.i * 7 + o.j, up); else planta(p[0], p[1], hh2, o.i * 13 + o.j, up); }
        else if (o.t === 1) (F.pomar[o.i].kind === "acai" ? palmeira : arvoreFruta)(p[0], p[1], sa, rega, o.i, zz, up);
        else if (o.t === 2 && zz > 2) sensor(p[0], p[1], o.i, zz, up);
        else if (o.t === 3) poco(p[0], p[1], zz, up);
        else if (o.t === 4) bombaCorpo(p[0], p[1], up);
        else if (o.t === 5) medidor(p[0], p[1], up);
        else if (o.t === 6) tanques(up);
        else if (o.t === 7) agricultor(p[0], p[1], o.f, zz);
        else if (o.t === 8) estacao(p[0], p[1], up);
        else if (o.t === 10) carrinho(p[0], p[1], o.dir, up);
        else if (o.t === 11) caixa(p[0], p[1], o.n, up);
        else if (o.t === 12) portaCamara(o.sq, up);
      });
      g.restore();
      marcaBomba(S);
      plaquinhas();
    }
    // one plant: five leaves; dying leaves droop below the base, yellow then brown, then fall
    function corFolha(h) { return h > 0.5 ? mix("#D2C05A", "#4E8F45", (h - 0.5) * 2) : mix("#9C6B3B", "#D2C05A", h * 2); }
    function mandioca(x, y, h, i, up) {   // cassava: a low leafy shrub, palmate leaves in small fans
      var hh = 3.2 * (0.55 + 0.45 * h) * up, sw = Math.sin(tempo * 1.1 + i) * 0.06 * h;
      g.fillStyle = mix("#8E7A44", "#4F8A3E", h); g.beginPath(); g.ellipse(x + sw * 3, y - hh + 0.4, 2.2 * (0.7 + 0.3 * h), 1.5 * (0.7 + 0.3 * h), 0, 0, 6.283); g.fill();
      for (var l = 0; l < 4; l++) {
        var a = -Math.PI / 2 + (l - 1.5) * 0.9, cx = x + sw * 3 + Math.cos(a) * 1.3, cy = y - hh + Math.sin(a) * 0.9 + (1 - h) * 1.2;
        g.fillStyle = corFolha(clamp(h - 0.08 * l, 0, 1));
        for (var f = 0; f < 5; f++) { var b = a + (f - 2) * 0.32; g.beginPath(); g.ellipse(cx + Math.cos(b) * 0.9, cy + Math.sin(b) * 0.6, 0.85, 0.28, b, 0, 6.283); g.fill(); }
      }
    }
    function feijao(x, y, h, i, up) {   // a low rounded bush
      var r = (1 + 0.6 * h) * (0.85 + 0.3 * hash(i, 4));
      g.fillStyle = corFolha(h); g.beginPath(); g.ellipse(x, y - r * 0.7 * up, r * 1.2, r * Math.max(0.6, up * 0.9), 0, 0, 6.283); g.fill();
    }
    function palmeira(x, y, h, rega, i, zz, up) {   // açaí clump: three thin stems, drooping fronds
      g.fillStyle = P.sombra; g.beginPath(); g.ellipse(x + 2 * up, y + 0.3, 3.6, 1.3, 0, 0, 6.283); g.fill();
      for (var st2 = 0; st2 < 3; st2++) {
        var ox = (st2 - 1) * 1.1, hh = (6.5 + st2 * 1.3 + hash(i, st2) * 1.5) * up, tx = x + ox * 1.8 + Math.sin(tempo * 0.9 + i + st2) * 0.25 * h, ty = y - hh;
        g.strokeStyle = "#7E6A52"; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x + ox, y); g.lineTo(tx, ty); g.stroke();
        g.strokeStyle = corFolha(clamp(h - 0.1 * st2, 0, 1)); g.lineWidth = 0.45;
        for (var f = 0; f < 6; f++) { var a = f / 6 * 6.283 + st2, L = 2.6 * (0.6 + 0.4 * h); g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty - 0.8, tx + Math.cos(a) * L, ty + Math.sin(a) * L * 0.4 + (1.2 + (1 - h) * 1.6)); g.stroke(); }
      }
    }
    function planta(x, y, h, i, up) {
      var hh = 4.2 * (0.45 + 0.55 * h) * (0.85 + 0.3 * hash(i, 1)) * up, sw = Math.sin(tempo * 1.3 + i) * 0.06 * h;
      g.lineCap = "round"; g.lineWidth = 0.62;
      for (var l = 0; l < 5; l++) {
        var s = (l - 2) / 2, hl = clamp(h - 0.22 * Math.abs(s) - 0.1 * hash(i, l), 0, 1);
        if (hl < 0.1) { g.strokeStyle = rgba("#9C6B3B", 0.8); g.beginPath(); g.moveTo(x + s * 1.6, y + 0.6); g.lineTo(x + s * 2.6, y + 0.9); g.stroke(); continue; }
        var reach = 1.2 + 1.4 * Math.abs(s) + (1 - hl) * 1.6, tip = hh * (0.35 + 0.65 * hl) - (1 - hl) * Math.abs(s) * 2.2 * up;
        var ex = x + s * reach + sw * hh, ey = y - tip;
        g.strokeStyle = corFolha(hl); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 0.5, y - hh * (0.6 + 0.3 * hl), ex, ey); g.stroke();
      }
    }
    // fruit tree: canopy of seven clusters that thin out and discolour; fruit that fills with fertigation
    function arvoreFruta(x, y, h, rega, i, zz, up) {
      var r = 1.7, upT = 3.6 * up;
      g.fillStyle = P.sombra; g.beginPath(); g.ellipse(x + 1.8 * up, y + 0.3, 4, 1.6, 0, 0, 6.283); g.fill();
      var cai = Math.round((1 - h) * 9);
      for (var f = 0; f < cai; f++) { var a = hash(i, f) * 6.283, d = 1.5 + hash(f, i) * 3; g.fillStyle = rgba("#A8743F", 0.85); g.fillRect(x + Math.cos(a) * d - 0.3, y + Math.sin(a) * d * 0.6 - 0.15, 0.6, 0.3); }
      if (rega > 0.05 && zz > 2.2) {   // micro-sprinkler: a low umbrella of fine droplets under the canopy
        for (var dd = 0; dd < 16; dd++) {
          var an = dd / 16 * 6.283 + tempo * 1.6 + i, rr = 3.9 + 0.3 * Math.sin(tempo * 3 + dd);
          g.fillStyle = rgba(corAguaTubo(), 0.75 * rega * (0.5 + 0.5 * Math.sin(an * 3 + tempo * 4)));
          g.fillRect(x + Math.cos(an) * rr - 0.18, y + Math.sin(an) * rr * Math.max(k, 0.5) - 0.6 - 0.18, 0.36, 0.36);
        }
      }
      g.strokeStyle = "#7A5C44"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - upT + 0.8); g.stroke();
      var vis = 2 + 5 * h;
      for (var b = 0; b < 7; b++) {
        if (b >= vis) break;
        var a2 = b / 7 * 6.283 + i, ox = b === 0 ? 0 : Math.cos(a2) * 1.6, oy = b === 0 ? 0 : Math.sin(a2) * 1.2;
        var hb = clamp(h - 0.3 * hash(i, b + 3) + 0.1, 0, 1), al = clamp(vis - b, 0, 1);
        g.globalAlpha = al; g.fillStyle = corFolha(hb); g.beginPath(); g.arc(x + ox, y - upT + oy, r * (0.8 + 0.25 * hash(b, i)), 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      g.fillStyle = rgba("#FFFFFF", 0.15 * h); g.beginPath(); g.arc(x - 0.8, y - upT - 0.9, 0.9, 0, 6.283); g.fill();
      var frutos = Math.round(7 * st.fruto * h), CORES = ["#E3B23C", "#D9772B", "#9C4A2A"];
      for (var fr = 0; fr < frutos; fr++) {
        var hh2 = hash(fr, i + 2), tronco = fr % 3 !== 2;
        var px = tronco ? x + (hash(i, fr) - 0.5) * 0.9 : x + (hash(i, fr) < 0.5 ? -1 : 1) * (1 + hash(fr, i) * 0.6);
        var py = tronco ? y - 0.8 - hh2 * Math.max(0.6, upT - 1.6) : y - upT + 1.1 + hh2 * 0.4;
        var sc2 = 0.75 + 0.35 * st.fruto, an = (hash(fr * 3, i) - 0.5) * 0.5;
        g.save(); g.translate(px, py); g.rotate(an);
        g.fillStyle = CORES[Math.floor(hash(i * 7, fr) * 3)]; g.beginPath(); g.ellipse(0, 0.55 * sc2, 0.34 * sc2, 0.78 * sc2, 0, 0, 6.283); g.fill();
        g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = 0.08; g.beginPath(); g.moveTo(0, -0.15 * sc2); g.lineTo(0, 1.25 * sc2); g.moveTo(-0.17 * sc2, 0); g.lineTo(-0.17 * sc2, 1.1 * sc2); g.stroke();
        g.strokeStyle = "#5E4630"; g.lineWidth = 0.1; g.beginPath(); g.moveTo(0, -0.25 * sc2); g.lineTo(0, -0.05 * sc2); g.stroke();
        g.restore();
      }
    }
    function sensor(x, y, i, zz, up) {
      var pul = (tempo * 0.5 + i * 0.33) % 1, ativo = st.agro > 0.5 && (st.smart > 0.3 || st.irr > 0.3);
      if (ativo) { g.strokeStyle = rgba("#38B6FF", (1 - pul) * 0.75); g.lineWidth = 0.35; g.beginPath(); g.ellipse(x, y, 1.5 + pul * 5, (1.5 + pul * 5) * Math.max(k, 0.5), 0, 0, 6.283); g.stroke(); }
      g.strokeStyle = "#5D6B78"; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 3.6 * up - 0.4); g.stroke();
      g.fillStyle = "#FF914D"; g.fillRect(x - 0.8, y - 4.4 * up - 0.6, 1.6, 1.3);
    }
    function poco(x, y, zz, up) {
      g.globalAlpha = st.agro;
      if (zz > 4 && up > 0.5) {   // cutaway: casing down to the submersible pump
        g.setLineDash([0.8, 0.8]); g.strokeStyle = rgba("#5D6B78", 0.55); g.lineWidth = 0.45; g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x, y + 13); g.stroke(); g.setLineDash([]);
        g.fillStyle = rgba("#3E6E96", 0.7); g.fillRect(x - 0.7, y + 12, 1.4, 3); g.fillStyle = rgba("#38B6FF", 0.25); g.beginPath(); g.ellipse(x, y + 16, 3.4, 1.2, 0, 0, 6.283); g.fill();
      }
      g.fillStyle = "#B9BDC2"; g.beginPath(); g.ellipse(x, y, 2.6, 1.3, 0, 0, 6.283); g.fill();
      g.fillStyle = "#8E959C"; g.fillRect(x - 1, y - 2.6 * up, 2, 2.6 * up); g.fillStyle = "#D6DADE"; g.beginPath(); g.ellipse(x, y - 2.6 * up, 1, 0.5, 0, 0, 6.283); g.fill();
      g.fillStyle = "#1E2B3A"; g.fillRect(x + 1.6, y - 2.8 * up, 1.4, 1.8);
      g.globalAlpha = 1;
    }
    function estacao(x, y, up) {   // weather station: mast, anemometer cups, rain gauge, small panel
      g.globalAlpha = st.agro;
      var h = 8 * up + 1;
      if (st.previsao > 0.2) { var ph = (tempo * 0.8) % 1; g.strokeStyle = rgba("#FF914D", (1 - ph) * st.previsao); g.lineWidth = 0.5; g.beginPath(); g.arc(x, y - h, 2 + ph * 7, 0, 6.283); g.stroke(); }
      g.strokeStyle = "#7D8792"; g.lineWidth = 0.45; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke();
      var a = tempo * (2.5 + 4 * st.nuvem);
      for (var c = 0; c < 3; c++) { var an = a + c * 2.094; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + Math.cos(an) * 1.6, y - h + Math.sin(an) * 0.6); g.stroke(); g.fillStyle = "#14263C"; g.beginPath(); g.arc(x + Math.cos(an) * 1.6, y - h + Math.sin(an) * 0.6, 0.35, 0, 6.283); g.fill(); }
      g.fillStyle = "#FFFFFF"; g.fillRect(x - 1.2, y - h * 0.55 - 1, 2.4, 2); g.strokeStyle = "#7D8792"; g.lineWidth = 0.25; g.strokeRect(x - 1.2, y - h * 0.55 - 1, 2.4, 2);
      g.fillStyle = "#2E5C86"; g.fillRect(x + 0.6, y - h * 0.3 - 0.8, 2.2, 1.1);
      g.fillStyle = "#C9CDD2"; g.fillRect(x - 2.6, y - 2.2 * up, 1, 2.2 * up);
      g.globalAlpha = 1;
    }
    function bombaCorpo(x, y, up) {   // a recognizable pump: motor + body on a pad
      g.fillStyle = "#C9C2B4"; g.fillRect(x - 4, y - 0.6, 8, 2.4);
      g.fillStyle = "#3E6E96"; g.fillRect(x - 3.4, y - 2.4 * up - 0.4, 4.2, 2.4 * up + 0.4);
      g.fillStyle = "#2E5A7E"; g.beginPath(); g.ellipse(x + 0.8, y - 1.2 * up, 0.6, 1.3 * up + 0.3, 0, 0, 6.283); g.fill();
      g.fillStyle = "#7D8792"; g.beginPath(); g.arc(x + 2.3, y - 1.2 * up, 1.2 * Math.max(up, 0.6), 0, 6.283); g.fill();
    }
    function medidor(x, y, up) {
      var r = 1.4, rate = fz.rioRate / 6;
      g.globalAlpha = st.agro;
      g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y - 1.2 * up, r, 0, 6.283); g.fill(); g.strokeStyle = "#38B6FF"; g.lineWidth = 0.35; g.stroke();
      var an = -2.4 + clamp(rate, 0, 1) * 4.8; g.strokeStyle = "#14263C"; g.lineWidth = 0.25; g.beginPath(); g.moveTo(x, y - 1.2 * up); g.lineTo(x + Math.cos(an) * r * 0.8, y - 1.2 * up + Math.sin(an) * r * 0.8); g.stroke();
      g.globalAlpha = 1;
    }
    function tanques(up) {
      var F = W0.fazenda;
      g.globalAlpha = st.agro;
      F.tanques.forEach(function (tq, n) {
        var p = Pj(tq[0], tq[1]), h = 3 * up;
        g.fillStyle = "#E8E4DB"; g.fillRect(p[0] - 1.5, p[1] - h, 3, h); g.fillStyle = tq[2]; g.beginPath(); g.ellipse(p[0], p[1] - h, 1.5, 0.6, 0, 0, 6.283); g.fill();
        if (st.fert > 0.3) { var ph = (tempo * 1.2 + n * 0.25) % 1; g.fillStyle = rgba(tq[2], 1 - ph); g.beginPath(); g.arc(p[0], p[1] - h - 0.8 - ph * 2, 0.35, 0, 6.283); g.fill(); }
      });
      g.globalAlpha = 1;
    }
    // readouts in screen space: the meter (m³ from the river), warnings at the intake, sensors
    // tilt-shift: the two soft bands are rebuilt every third frame from a 1/7 copy of the frame and reused in between
    var tsMini = null, tsB = [null, null], tsN = 0;
    function desfoca() {
      var tf = typeof cfg.ui.tilt === "number" ? cfg.ui.tilt : 1, dv = 3 + 4 * tf;
      var fw = Math.max(2, Math.round(cv.width / dv)), fh = Math.max(2, Math.round(cv.height / dv)), bh = Math.round(cv.height * (0.12 + 0.15 * tf));
      var novo = !tsMini || tsMini.width !== fw || tsMini.height !== fh || !tsB[0] || tsB[0].width !== cv.width || tsB[0].height !== bh;
      if (novo) { tsMini = document.createElement("canvas"); tsMini.width = fw; tsMini.height = fh;
        tsB = [0, 1].map(function () { var c = document.createElement("canvas"); c.width = cv.width; c.height = bh; return c; }); tsN = 0; }
      if (tsN++ % 3 === 0 || !rodando) {
        var m = tsMini.getContext("2d"); m.imageSmoothingEnabled = true; m.imageSmoothingQuality = "low"; m.drawImage(cv, 0, 0, fw, fh);
        [[0, 1], [cv.height - bh, -1]].forEach(function (bd, n) {
          var b = tsB[n].getContext("2d");
          b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, cv.width, bh); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = "medium";
          b.drawImage(tsMini, 0, bd[0] / cv.height * fh, fw, bh / cv.height * fh, 0, 0, cv.width, bh);
          var gr = b.createLinearGradient(0, 0, 0, bh); if (bd[1] > 0) { gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); } else { gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); }
          b.globalCompositeOperation = "destination-in"; b.fillStyle = gr; b.fillRect(0, 0, cv.width, bh);
        });
      }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tsB[0], 0, 0); g.drawImage(tsB[1], 0, cv.height - bh); g.restore();
    }
    function avisosRio() {
      if (st.desvio < 0.5 || cam.z > 3 || !nivelRot) return;
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = sstep(0.5, 0.9, st.desvio);
      var a = toScreen(W0.intake.x, W0.intake.y), m = W0.main, ib = idxAt(m, 0.56), b = toScreen(m.x[ib], m.y[ib]);
      pilula(a[0] + 10, a[1] + 16, [tr("A fazenda grande tira água demais")], "alerta");
      pilula(b[0] - 40, b[1] + 18, [tr("Rio abaixo: quase sem água")], "alerta");
      g.globalAlpha = 1; g.restore();
    }
    function pilula(x, y, linhas, tipo) {
      var pequeno = W < 520, fs = pequeno ? 11 : 12;
      g.font = "600 " + fs + "px " + (fonteOk ? "Poppins, " : "") + "system-ui, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle";
      var w = 0; linhas.forEach(function (l) { w = Math.max(w, g.measureText(l).width); }); w += 18;
      var lh = fs + 5, h = linhas.length * lh + 10;
      x = clamp(x, 6, W - w - 6); y = clamp(y, 6, H - h - 6);
      rotulosOcup.push([x, y, w, h]);
      g.fillStyle = tipo === "alerta" ? "#B3361E" : tipo === "sujo" ? "#7E5A2E" : "rgba(255,255,255,.95)";
      g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, 9); else g.rect(x, y, w, h); g.fill();
      if (!tipo) { g.strokeStyle = "rgba(20,38,60,.15)"; g.lineWidth = 1; g.stroke(); }
      linhas.forEach(function (l, i) { g.fillStyle = tipo ? "#FFFFFF" : i === linhas.length - 1 && linhas.length > 1 ? "#55677D" : "#14263C"; g.fillText(l, x + 9, y + 5 + lh * (i + 0.5)); });
    }
    function fmt(v) { var t = v.toFixed(1); return TXT._dec === "." ? t : t.replace(".", ","); }
    function plaquinhas() {
      var F = W0.fazenda, zz = cam.z; if (zz < 3 || !visW(F.cx, F.cy, 120) || !nivelRot) return;
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var a = sstep(3, 3.6, zz);
      g.globalAlpha = a;
      var pm = toScreen(F.medidor.x, F.medidor.y);
      if (fz.dem > 0.2 && fz.alc < 0.45) { var pi = toScreen(F.tubos.suc[0][0], F.tubos.suc[0][1]); pilula(pi[0] + 14, pi[1] + 14, [tr("A bomba não alcança a água")], "alerta"); }
      else if (fz.fecha) { var pk = toScreen(F.tubos.suc[0][0], F.tubos.suc[0][1]); pilula(pk[0] + 14, pk[1] + 14, [tr("O sensor na captação detecta a água ruim"), tr("e a irrigação para")], "alerta"); }
      else if (fz.c > 0.15) { var pj = toScreen(F.tubos.suc[0][0], F.tubos.suc[0][1]); pilula(pj[0] + 14, pj[1] + 14, [tr("Água suja na captação")], "sujo"); }
      if (st.agro > 0.5 && st.previsao > 0.5) { var pe2 = toScreen(F.estacao.x, F.estacao.y); pilula(pe2[0] + 14, pe2[1] - 50, [tr("Previsão: chuva chegando"), tr("a irrigação para antes")], null); }
      if (st.agro > 0.5 && (fz.rioRate > 0.05 || fz.outros > 0.05 || mostraId("medidor") && cfg.seletivo) && mostraId("medidor")) {
        var L = [tr("Do rio:") + " " + fmt(fz.rioRate) + " m³/h"];
        if (fz.outros > 0.05) L.push(tr("Represa e poço:") + " " + fmt(fz.outros) + " m³/h");
        if (fz.enche > 0.05) L.push(tr(st.chuva > 0.3 ? "o excesso da cheia vai para a represa" : "enchendo a represa"));
        L.push(tr("Hoje:") + " " + fmt(hoje) + " m³ " + tr("(simulação)"));
        pilula(pm[0] + 16, pm[1] + 10, L, null);
      }
      if (zz > 6 && st.agro > 0.5 && (cfg.seletivo ? mostraId("sensores") : true)) F.sensores.forEach(function (s) {
        var p = toScreen(s.x, s.y); var umido = st.sua > 0.6 && (fz.entregue > 0.3 || st.chuva > 0.3);
        pilula(p[0] + 8, p[1] - 30, [tr(cfg.seletivo ? (umido ? "sensor de solo: úmido" : "sensor de solo: seco") : (umido ? "solo úmido" : "solo seco"))], null);
      });
      g.globalAlpha = 1; g.restore();
    }
    // ── the brand mark as the pump station of "sua fazenda" (h8 beat / h9 pistons) ──
    var PETALA = typeof Path2D !== "undefined" ? new Path2D("M0,-1C0.175,-1 0.36,-0.84 0.36,-0.64C0.36,-0.44 0.095,-0.12 0,0C-0.095,-0.12 -0.36,-0.44 -0.36,-0.64C-0.36,-0.84 -0.175,-1 0,-1Z") : null;
    function periodoBomba() { return marcaModo === "pistao" ? 1.8 : 1.6; }
    function golpes() { var T = periodoBomba(), n = Math.floor(tempo / T), f = (tempo / T) - n, e = 1 - Math.pow(1 - clamp(f / 0.45, 0, 1), 3); return n + e; }
    function marcaBomba(S) {
      if (!marcaModo || !PETALA || st.agro < 0.05) return;
      var F = W0.fazenda, T = periodoBomba(), f = REDUZ ? 0.6 : (tempo % T) / T, ativa = fz.rioRate > 0.05 && !REDUZ;
      var sc = fit * cam.z, base = toScreen(F.pump.x, F.pump.y), r = Math.max(5.2 * sc, 13), upp = k < 1 ? r * 1.25 + 6 : r * 1.4;
      var cx = base[0], cy = base[1] - upp;
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = st.agro;
      if (ativa) {
        var b = toScreen(F.tubos.suc[0][0], F.tubos.suc[0][1]), rf = (tempo / T) % 1;
        for (var w = 0; w < 2; w++) {
          var ph = (rf + w * 0.5) % 1, rr = r * (0.9 + 1.4 * ph);
          g.strokeStyle = rgba("#38B6FF", 0.55 * (1 - ph)); g.lineWidth = 1.6;
          g.beginPath(); g.ellipse(cx, cy, rr * 1.15, rr * 1.15, 0, 0, 6.283); g.stroke();
          g.beginPath(); g.ellipse(b[0], b[1], rr * 0.7, rr * 0.7 * Math.max(k, 0.55), 0, 0, 6.283); g.stroke();
        }
      }
      g.strokeStyle = "#7D8A96"; g.lineWidth = Math.max(1.5, r * 0.12); g.beginPath(); g.moveTo(cx, base[1] - 2); g.lineTo(cx, cy + r * 0.9); g.stroke();
      g.fillStyle = "rgba(20,38,60,.16)"; g.beginPath(); g.arc(cx + 1.5, cy + 2.5, r * 1.28, 0, 6.283); g.fill();
      g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(cx, cy, r * 1.28, 0, 6.283); g.fill();
      var esc = 1, pushO = 0, pushA = 0;
      if (marcaModo === "pulso" && ativa) { esc = f < 0.12 ? lerp(1, 0.94, f / 0.12) : f < 0.28 ? lerp(0.94, 1.045, (f - 0.12) / 0.16) : f < 0.55 ? lerp(1.045, 1, (f - 0.28) / 0.27) : 1; }
      if (marcaModo === "pistao" && ativa) { pushO = f < 0.5 ? Math.sin(f / 0.5 * Math.PI) : 0; pushA = f >= 0.5 ? Math.sin((f - 0.5) / 0.5 * Math.PI) : 0; }
      var u = r / 500 * 0.86 * esc;
      [[-45, 581, "#FF914D", pushO], [135, 581, "#FF914D", pushO], [45, 413, "#38B6FF", pushA], [-135, 413, "#38B6FF", pushA]].forEach(function (pt) {
        g.save(); g.translate(cx, cy); g.rotate(pt[0] * Math.PI / 180); g.translate(0, (-18 - 52 * pt[3]) * u); g.scale(pt[1] * u, pt[1] * u);
        g.fillStyle = pt[2]; g.fill(PETALA); g.restore();
      });
      if (cam.z > 3.4 && nivelRot && mostraId("bomba")) {   // its name sits beside it, not on the control shed
        g.font = "600 " + (W < 520 ? 11 : 12.5) + "px " + (fonteOk ? "Poppins, " : "") + "system-ui, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle";
        var tw = g.measureText(tr("bomba solar")).width + 16, lx = cx - r * 1.28 - tw - 6, ly = cy;
        for (var oi = 0; oi < rotulosOcup.length; oi++) { var o = rotulosOcup[oi]; if (lx < o[0] + o[2] && lx + tw > o[0] && ly - 12 < o[1] + o[3] && ly + 12 > o[1]) { lx = cx + r * 1.28 + 6; break; } } rotulosOcup.push([lx, ly - 12, tw, 24], [cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6]);
        g.globalAlpha = st.agro * sstep(3.4, 4, cam.z); g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); if (g.roundRect) g.roundRect(lx, ly - 12, tw, 24, 12); else g.rect(lx, ly - 12, tw, 24); g.fill();
        g.fillStyle = "#14263C"; g.fillText(tr("bomba solar"), lx + 8, ly + 0.5);
      }
      g.restore();
    }
    // the farmer walks the beds, stops at a sensor, walks on
    var arvColhe = null, frioT0 = 0;
    function colheitaSeq() {
      if (st.frio < 0.5 || st.agro < 0.5) return null;
      var F = W0.fazenda, cm = F.camara;
      if (!arvColhe) { var best = null, bd = 1e9; F.pomar.forEach(function (t) { if (t.kind !== "cacau") return; var d = Math.hypot(t.x - (cm.x - 6), t.y - (cm.y + 12)); if (d < bd) { bd = d; best = t; } }); arvColhe = best || F.pomar[0]; }
      if (frioT0 < 0) frioT0 = tempo;
      var T0 = arvColhe, P = 18, tc = Math.max(0, tempo - frioT0 - 1.5), tf = tc % P, ciclo = Math.floor(tc / P);
      var ponto = [T0.x - 2.6, T0.y + 1.2], porta = [cm.x + cm.w * 0.77, cm.y + cm.d + 3.2];
      var em = function (a, b, u) { u = easeS(clamp(u, 0, 1)); var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 6; return [lerp(lerp(a[0], mx, u), lerp(mx, b[0], u), u), lerp(lerp(a[1], my, u), lerp(my, b[1], u), u)]; };
      var r = { abre: 0, entra: 0, frost: 0, pilha: Math.min(12, 3 + ciclo * 2) };
      if (tf < 5) { r.f = { x: ponto[0], y: ponto[1], dx: 1, dy: 0, parado: true, pose: "colhe" }; r.cesto = [ponto[0] + 2.2, ponto[1] + 0.6]; r.n = Math.floor(tf / 5 * 7); }
      else if (tf < 11) { var q = em(ponto, porta, (tf - 5) / 6), q2 = em(ponto, porta, (tf - 4.9) / 6); r.f = { x: q[0], y: q[1], dx: q2[0] - q[0] || 1, dy: q2[1] - q[1], parado: false, pose: "empurra" }; var dd = Math.hypot(r.f.dx, r.f.dy) || 1; r.carro = [q[0] + r.f.dx / dd * 3.4, q[1] + r.f.dy / dd * 3.4]; }
      else if (tf < 13.5) { r.f = { x: cm.x + cm.w + 2.2, y: porta[1] - 1.5, dx: -1, dy: 0, parado: true, pose: "" }; r.carro = [porta[0] - 0.2, porta[1] - sstep(11.6, 13, tf) * 2.4]; r.abre = sstep(11, 11.7, tf); r.entra = sstep(11.8, 13, tf); }
      else { var q3 = em([cm.x + cm.w + 2.2, porta[1] - 1.5], ponto, sstep(14.6, 18, tf)); r.f = { x: q3[0], y: q3[1], dx: -1, dy: 0, parado: tf < 14.6, pose: "" }; r.abre = 1 - sstep(13.5, 14.3, tf); r.frost = sstep(13.6, 14, tf) * (1 - sstep(15.5, 17, tf)); r.pilha += 2; }
      if (tf >= 11 && tf < 13.5 && r.entra > 0.99) r.pilha += 2;
      return r;
    }
    function caixa(x, y, n, up) {   // harvest crate filling with pods
      g.fillStyle = "#A87A4C"; g.fillRect(x - 1.4, y - 1.4 * up - 0.3, 2.8, 1.4 * up + 0.3);
      g.strokeStyle = "rgba(60,35,15,.5)"; g.lineWidth = 0.1; g.strokeRect(x - 1.4, y - 1.4 * up - 0.3, 2.8, 1.4 * up + 0.3);
      for (var i = 0; i < n; i++) { g.fillStyle = ["#E3B23C", "#D9772B", "#9C4A2A"][i % 3]; g.beginPath(); g.ellipse(x - 1 + (i % 4) * 0.65, y - 1.4 * up - 0.25 - Math.floor(i / 4) * 0.35, 0.3, 0.2, 0.3, 0, 6.283); g.fill(); }
    }
    function carrinho(x, y, dir, up) {   // a hand cart with two full crates
      g.fillStyle = P.sombra; g.beginPath(); g.ellipse(x + 1.2, y + 0.3, 2.8, 0.6, 0, 0, 6.283); g.fill();
      g.strokeStyle = "#5D6B78"; g.lineWidth = 0.3; g.beginPath(); g.moveTo(x - 2.2 * dir, y - 1.2 * up); g.lineTo(x - 3.4 * dir, y - 2.6 * up); g.stroke();
      g.fillStyle = "#7D8792"; g.fillRect(x - 2.2, y - 1.2 * up - 0.2, 4.4, 0.5);
      g.fillStyle = "#2E3E52"; g.beginPath(); g.arc(x - 1.4, y - 0.4, 0.55, 0, 6.283); g.fill(); g.beginPath(); g.arc(x + 1.4, y - 0.4, 0.55, 0, 6.283); g.fill();
      caixa(x - 1, y - 1.3 * up, 6, up); caixa(x + 1.1, y - 1.3 * up, 6, up);
    }
    function portaCamara(sq, up) {   // the container door: opens, crates stack inside, frost on closing
      var cm = W0.fazenda.camara, hh = (k < 1 ? cm.h * 0.9 : cm.h * 0.4) * Math.max(up, 0.4);
      var a = Pj(cm.x + cm.w * 0.6, cm.y + cm.d), b = Pj(cm.x + cm.w * 0.94, cm.y + cm.d), w = b[0] - a[0];
      if (sq.abre > 0.02) {
        g.fillStyle = "#1E2B3A"; g.fillRect(a[0], a[1] - hh, w * sq.abre, hh);
        var n = Math.min(sq.pilha, 12);
        for (var i = 0; i < n; i++) { var cx = a[0] + 0.5 + (i % 4) * (w - 1) / 4, cy = a[1] - 0.2 - Math.floor(i / 4) * hh / 3.6; if (cx > a[0] + w * sq.abre - 0.4) continue;
          g.fillStyle = "#A87A4C"; g.fillRect(cx, cy - hh / 4, (w - 1) / 4 - 0.2, hh / 4 - 0.2); g.fillStyle = "#D9772B"; g.fillRect(cx + 0.1, cy - hh / 4, (w - 1) / 4 - 0.4, 0.25); }
        g.fillStyle = "rgba(200,232,255,.25)"; g.fillRect(a[0], a[1] - hh, w * sq.abre, hh);
        g.fillStyle = "#E8E4DB"; g.fillRect(a[0] + w * sq.abre - 0.1, a[1] - hh, Math.max(0.3, w * (1 - sq.abre) * 0.25 + 0.3), hh);   // the door leaf, folded aside
      }
      if (sq.frost > 0.02) for (var f = 0; f < 7; f++) {
        var ph = (tempo * 0.7 + f / 7) % 1, fx = a[0] + w * (0.1 + 0.8 * hash(f, 3)) + Math.sin(tempo * 2 + f) * 0.4, fy = a[1] - hh * (0.2 + 0.8 * hash(f, 9)) - ph * 4;
        g.fillStyle = rgba("#FFFFFF", 0.7 * sq.frost * (1 - ph)); g.beginPath(); g.arc(fx, fy, 0.5 + ph * 0.9, 0, 6.283); g.fill();
      }
    }
    function posAgricultor() {
      var C = W0.fazenda.caminho, segs = [], tot = 0;
      for (var i = 0; i < C.length; i++) { var a = C[i], b = C[(i + 1) % C.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); tot += l; }
      var vel = 2.2, ciclo = tot / vel + 8, t = (tempo % ciclo), parado = false;
      if (t > tot / vel * 0.35 && t < tot / vel * 0.35 + 4) { t = tot / vel * 0.35; parado = true; }
      else if (t >= tot / vel * 0.35 + 4) t -= 4;
      if (t > tot / vel * 0.8 && t < tot / vel * 0.8 + 4) { t = tot / vel * 0.8; parado = true; }
      else if (t >= tot / vel * 0.8 + 4) t -= 4;
      var d = clamp(t * vel, 0, tot);
      for (var j = 0; j < segs.length; j++) { if (d <= segs[j][2]) { var s = segs[j], u = d / s[2]; return { x: lerp(s[0][0], s[1][0], u), y: lerp(s[0][1], s[1][1], u), dx: s[1][0] - s[0][0], dy: s[1][1] - s[0][1], parado: parado }; } d -= segs[j][2]; }
      return { x: C[0][0], y: C[0][1], dx: 1, dy: 0, parado: true };
    }
    function agricultor(x, y, f, zz) {
      if (zz < 1.6) return;
      var passoA = f.parado ? 0 : Math.sin(tempo * 7), dir = f.dx < 0 ? -1 : 1;
      if (k >= 1) {   // seen from above: hat brim, crown, shoulders
        g.fillStyle = P.sombra; g.beginPath(); g.ellipse(x + 0.9, y + 0.9, 1.9, 1.5, 0, 0, 6.283); g.fill();
        var an = Math.atan2(f.dy, f.dx);
        g.save(); g.translate(x, y); g.rotate(an); g.scale(1.3, 1.3);
        g.fillStyle = "#2F5E8C"; g.beginPath(); g.ellipse(0, 0, 0.9, 1.6, 0, 0, 6.283); g.fill();
        g.fillStyle = "#E3C27A"; g.beginPath(); g.arc(0, 0, 1.25, 0, 6.283); g.fill();
        g.fillStyle = "#C9A35A"; g.beginPath(); g.arc(0, 0, 0.62, 0, 6.283); g.fill();
        g.restore(); return;
      }
      // standing figure, about 1:7 proportions, no face: trousers, shirt, arms, straw hat
      var h = 9, legL = h * 0.46, torso = h * 0.32, cab = h * 0.11;
      g.fillStyle = P.sombra; g.beginPath(); g.ellipse(x + 1.8, y + 0.2, 2.2, 0.6, 0, 0, 6.283); g.fill();
      g.lineCap = "round";
      g.strokeStyle = "#2E3E52"; g.lineWidth = 0.95;
      g.beginPath(); g.moveTo(x, y - legL); g.lineTo(x + passoA * 0.9 * dir, y); g.moveTo(x, y - legL); g.lineTo(x - passoA * 0.9 * dir, y); g.stroke();
      g.strokeStyle = "#3C78B4"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - legL); g.lineTo(x, y - legL - torso); g.stroke();
      g.strokeStyle = "#8B5A3C"; g.lineWidth = 0.55;
      if (f.pose === "colhe") { var rr2 = Math.sin(tempo * 2.2); g.beginPath(); g.moveTo(x, y - legL - torso * 0.85); g.lineTo(x + 1.4 * dir, y - legL - torso * (1.2 + 0.25 * rr2)); g.lineTo(x + 2.1 * dir, y - legL - torso * (1.05 + 0.3 * rr2)); g.stroke();
        g.beginPath(); g.moveTo(x, y - legL - torso * 0.85); g.lineTo(x + 1.2 * dir, y - legL - torso * 0.3); g.stroke();
        g.fillStyle = "#D9772B"; g.beginPath(); g.ellipse(x + 2.2 * dir, y - legL - torso * (1.0 + 0.3 * rr2), 0.32, 0.6, 0, 0, 6.283); g.fill(); }
      else if (f.pose === "empurra") { g.beginPath(); g.moveTo(x, y - legL - torso * 0.85); g.lineTo(x + 1.6 * dir, y - legL - torso * 0.35); g.lineTo(x + 2.4 * dir, y - legL - torso * 0.2); g.stroke(); }
      else if (f.parado) { g.beginPath(); g.moveTo(x, y - legL - torso * 0.85); g.lineTo(x + 1.3 * dir, y - legL - torso * 0.35); g.lineTo(x + 2 * dir, y - legL - torso * 0.5); g.stroke(); g.fillStyle = "#1E2B3A"; g.fillRect(x + 1.7 * dir - 0.5, y - legL - torso * 0.62, 1, 0.75); }
      else { g.beginPath(); g.moveTo(x, y - legL - torso * 0.85); g.lineTo(x - passoA * 0.8 * dir, y - legL - torso * 0.1); g.moveTo(x, y - legL - torso * 0.85); g.lineTo(x + passoA * 0.8 * dir, y - legL - torso * 0.1); g.stroke(); }
      var hy = y - legL - torso - cab * 0.9;
      g.fillStyle = "#8B5A3C"; g.beginPath(); g.arc(x, hy, cab, 0, 6.283); g.fill();
      g.fillStyle = "#E3C27A"; g.beginPath(); g.ellipse(x, hy - cab * 0.55, cab * 2.1, cab * 0.55, 0, 0, 6.283); g.fill();
      g.beginPath(); g.ellipse(x, hy - cab * 1.05, cab * 0.95, cab * 0.7, 0, Math.PI, 0); g.fill();
    }

    // boats on the water, trucks on the roads (optional "vida")
    function vidaMov(S) {
      g.save(); camTx();
      var chs = W0.canais;
      for (var b = 0; b < 7; b++) {
        var ch = chs[b < 3 ? 0 : 2 + (b % 4)], s = (tempo * (5 + b) + b * 211) % ch.len, ix = clamp(Math.round(s / STEP), 0, ch.n - 1);
        if (ch === chs[0] && s < ch.len * 0.5) s += ch.len * 0.45, ix = clamp(Math.round(s / STEP), 0, ch.n - 1);
        var o = (b % 2 ? 0.3 : -0.3) * largAgua(ch, ix) / 2, wx = ch.x[ix] + ch.nx[ix] * o, wy = ch.y[ix] + ch.ny[ix] * o;
        if (!visW(wx, wy, 10)) continue;
        var p = Pj(wx, wy), j = clamp(ix + 2, 0, ch.n - 1), q2 = Pj(ch.x[j] + ch.nx[j] * o, ch.y[j] + ch.ny[j] * o), an = Math.atan2(q2[1] - p[1], q2[0] - p[0]);
        g.save(); g.translate(p[0], p[1] - (k < 1 ? 0.6 : 0)); g.rotate(an);
        g.strokeStyle = rgba("#FFFFFF", 0.6); g.lineWidth = 0.4; g.beginPath(); g.moveTo(-2.6, -0.6); g.lineTo(-6, -1.4); g.moveTo(-2.6, 0.6); g.lineTo(-6, 1.4); g.stroke();
        g.fillStyle = "#F4EFE6"; g.beginPath(); g.moveTo(2.4, 0); g.lineTo(0.6, -0.9); g.lineTo(-2.4, -0.9); g.lineTo(-2.4, 0.9); g.lineTo(0.6, 0.9); g.closePath(); g.fill();
        g.fillStyle = b % 2 ? "#C8714E" : "#2F5E8C"; g.fillRect(-1.6, -0.5, 1.6, 1);
        g.restore();
      }
      W0.estradas.forEach(function (r, ri) {
        for (var c = 0; c < (r.t === "asfalto" ? 4 : 1); c++) {
          var n = r.p.length, u = ((tempo * (r.t === "asfalto" ? 0.018 : 0.01) + c * 0.27 + ri * 0.13) % 1), i = Math.floor(u * (n - 2)), a = r.p[i], b2 = r.p[i + 1];
          if (!visW(a[0], a[1], 8)) continue;
          var pa = Pj(a[0], a[1]), pb = Pj(b2[0], b2[1]), an = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
          g.save(); g.translate(pa[0], pa[1] - (k < 1 ? 1 : 0)); g.rotate(an); g.fillStyle = c % 2 ? "#F4EFE6" : P.cor; g.fillRect(-1.8, -0.8, 3.6, 1.6); g.restore();
        }
      });
      g.restore();
    }

    // sky: cloud shadows, rain, heat
    var gotas = [];
    function ceu(S) {
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (st.nuvem > 0.02) {
        var Sz = fit * cam.z;
        for (var c = 0; c < 5; c++) {
          var wx = ((tempo * 6 + c * 420) % (WW + 600)) - 300, wy = 120 + c * 190, p = toScreen(wx, wy), r = (110 + c * 20) * Sz;
          if (p[0] < -r || p[0] > W + r || p[1] < -r || p[1] > H + r) continue;
          var gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); gr.addColorStop(0, rgba("#3A4A5A", 0.13 * st.nuvem)); gr.addColorStop(1, rgba("#3A4A5A", 0));
          g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
        }
      }
      if (st.chuva > 0.02) {
        while (gotas.length < 220 * st.chuva) gotas.push({ x: Math.random() * W * 1.3, y: Math.random() * H, v: 520 + Math.random() * 300 });
        g.strokeStyle = rgba("#6F8496", 0.34 * st.chuva); g.lineWidth = 1; g.beginPath();
        for (var i = 0; i < gotas.length; i++) { var d = gotas[i]; d.y += d.v * dtUlt; d.x -= d.v * dtUlt * 0.22; if (d.y > H) { d.y = -12; d.x = Math.random() * W * 1.3; } g.moveTo(d.x, d.y); g.lineTo(d.x + 3, d.y - 13); }
        g.stroke();
      } else gotas.length = 0;
      if (st.seco > 0.05) { var sg = g.createRadialGradient(W * 0.88, -H * 0.1, 0, W * 0.88, -H * 0.1, Math.max(W, H)); sg.addColorStop(0, rgba("#FFD27A", 0.28 * st.seco)); sg.addColorStop(1, rgba("#FFD27A", 0)); g.fillStyle = sg; g.fillRect(0, 0, W, H); }
      g.restore();
    }

    // dependency arcs: who shares the same water (optional "ligacoes")
    function desenhaLigacoes(S) {
      var al = sstep(1.75, 1.15, cam.z); if (al < 0.02) return;
      var m = W0.main, nos = [[0.02, 0], [0.135, 0], [0.3, 0], [0.405, 0], [0.47, 0], [W0.fazenda.bomba.i / (m.n - 1), 1], [0.88, 0], [1, 0]];
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = al;
      var pts = nos.map(function (n) { var i = idxAt(m, n[0]); return toScreen(m.x[i], m.y[i]); });
      if (ligacoes === "pulso") {
        g.restore(); g.save(); camTx(); groundTx(g); g.globalAlpha = al;
        var P0 = (tempo * 150) % (m.len + 520), L = 70;
        var trecho = function (ch, off) {
          for (var i = 0; i < ch.n - 1; i += 2) { var sg = off + i * STEP, d = Math.abs(sg - P0); if (d > L) continue;
            var j = Math.min(ch.n - 1, i + 2), pr2 = cfg.agrotechjes ? progresso() : 0; g.strokeStyle = pr2 > 0.05 ? rgba(mixh("#FFFFFF", "#38B6FF", pr2 * 0.6), (0.6 + 0.35 * pr2) * (1 - d / L)) : rgba("#FFFFFF", 0.75 * (1 - d / L)); g.lineWidth = largAgua(ch, i) * (1.05 + 0.5 * pr2); g.lineCap = "round";
            g.beginPath(); g.moveTo(ch.x[i], ch.y[i]); g.lineTo(ch.x[j], ch.y[j]); g.stroke(); }
          ch.filhos.forEach(function (f) { trecho(f, off + ch.len); });
        };
        trecho(m, 0);
        g.restore(); g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = al;
        nos.forEach(function (n, k3) { var sN = idxAt(m, n[0]) * STEP, d = P0 - sN, p = pts[k3];
          if (d > 0 && d < 160) { var ph = d / 160; g.strokeStyle = n[1] ? rgba("#FF914D", 1 - ph) : rgba("#14263C", 0.7 * (1 - ph)); g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 6 + 26 * ph, 0, 6.283); g.stroke(); }
          g.fillStyle = n[1] ? "#FF914D" : "#14263C"; g.beginPath(); g.arc(p[0], p[1], n[1] ? 5 : 3.5, 0, 6.283); g.fill(); g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.5; g.stroke(); });
        g.restore(); return;
      }
      g.setLineDash([4, 5]); g.lineDashOffset = -tempo * 10; g.strokeStyle = rgba("#14263C", 0.7); g.lineWidth = 2;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.min(70, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.35);
        g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mx, my, b[0], b[1]); g.stroke();
      }
      g.setLineDash([]);
      pts.forEach(function (p, i) { var eu = nos[i][1]; g.fillStyle = eu ? "#FF914D" : "#14263C"; g.beginPath(); g.arc(p[0], p[1], eu ? 5 : 3.5, 0, 6.283); g.fill(); g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.5; g.stroke(); });
      g.restore();
    }

    // labels in screen space; level 0 none, 1 main places, 2 more, 9 farm parts when close
    var fonteOk = false;
    function mostraId(id) { if (!cfg.seletivo) return true; var m = passos[passo] && passos[passo].mostra; return !!m && (m.indexOf(id) >= 0 || m.indexOf("*") >= 0); }
    function rotulos(S) {
      if (!nivelRot) return;
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var zz = cam.z, pequeno = W < 520;
      g.font = (pequeno ? "600 11px " : "600 12.5px ") + (fonteOk ? "Poppins, " : "") + "system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      var ocup = rotulosOcup.slice();
      var colide = function (x0, y0, w0, h0) { for (var i = 0; i < ocup.length; i++) { var o = ocup[i]; if (x0 < o[0] + o[2] + 3 && x0 + w0 + 3 > o[0] && y0 < o[1] + o[3] + 2 && y0 + h0 + 2 > o[1]) return true; } return false; };
      W0.rotulos.forEach(function (r) {
        var mostra;
        if (r.n === 9) mostra = zz > 3.4 && nivelRot >= 1 && mostraId(r.id);
        else if (r.n === 10) mostra = zz > 6.5 && nivelRot >= 1 && mostraId(r.id);
        else if (r.cenas) mostra = r.cenas.indexOf(cenaId) >= 0 && nivelRot >= 1;
        else mostra = r.n <= nivelRot && zz < (r.eu ? 99 : 3.2) && !(pequeno && r.n > 1);
        if (!mostra) return;
        if ((r.n === 9 || r.n === 10) && ["poco", "represa", "fert"].indexOf(r.id) >= 0 && st.agro < 0.5) return;
        var al = r.n === 10 ? sstep(6.5, 7.2, zz) : r.n === 9 ? sstep(3.4, 4, zz) : r.eu ? 1 : sstep(3.2, 2.6, zz);
        var p = toScreen(r.x, r.y); if (r.eu && zz > 3.4) p = toScreen(W0.fazenda.cx, W0.fazenda.y1 + 4);
        var w = g.measureText(tr(r.t)).width + 16, h = pequeno ? 22 : 24;
        if (p[0] < -w / 2 || p[0] > W + w / 2 || p[1] < 0 || p[1] > H) return;
        p[0] = clamp(p[0], w / 2 + 6, W - w / 2 - 6); p[1] = clamp(p[1], h / 2 + 6, H - h / 2 - 6);
        if (r.eu && temUI && p[1] > H - 110 && p[0] < Math.min(W, 1060)) p[1] = H - 110;
        if (!r.eu && colide(p[0] - w / 2, p[1] - h / 2, w, h)) {
          var alt = [[0, -h - 4], [0, h + 4], [w / 2 + 24, 0], [-w / 2 - 24, 0], [0, -2 * h - 6], [0, 2 * h + 6]], ok2 = false;
          for (var ai = 0; ai < alt.length && !ok2; ai++) { var nx2 = clamp(p[0] + alt[ai][0], w / 2 + 6, W - w / 2 - 6), ny2 = clamp(p[1] + alt[ai][1], h / 2 + 6, H - h / 2 - 6);
            if (!colide(nx2 - w / 2, ny2 - h / 2, w, h)) { p[0] = nx2; p[1] = ny2; ok2 = true; } }
          if (!ok2) return;
        }
        ocup.push([p[0] - w / 2, p[1] - h / 2, w, h]);
        g.globalAlpha = al;
        g.fillStyle = r.eu ? "#FF914D" : r.cenas ? "#7E6238" : "rgba(255,255,255,.9)";
        g.beginPath(); if (g.roundRect) g.roundRect(p[0] - w / 2, p[1] - h / 2, w, h, h / 2); else g.rect(p[0] - w / 2, p[1] - h / 2, w, h); g.fill();
        if (!r.eu && !r.cenas) { g.strokeStyle = "rgba(20,38,60,.12)"; g.lineWidth = 1; g.stroke(); }
        g.fillStyle = r.cenas ? "#FFFFFF" : "#14263C"; g.fillText(tr(r.t), p[0], p[1] + 0.5);
      });
      g.globalAlpha = 1; g.restore();
    }

    // ── director, camera, UI ──────────────────────────────────────────────
    var cap = root.querySelector(".wc__cap"), btns = [].slice.call(root.querySelectorAll("[data-cena]")), btnPausa = root.querySelector(".wc__pausa");
    var gbtns = [].slice.call(root.querySelectorAll("[data-grupo]")), pbtns = [].slice.call(root.querySelectorAll("[data-passe]"));
    var nexoEl = root.querySelector(".wc__nexo"), nfEl = root.querySelector(".wc__nf");
    function nexoFinal() { if (!nfEl) return; var nf = passos[passo].nexoFinal; nfEl.classList.toggle("on", REDUZ ? !!nf : nf === true ? tPasso > 0.3 : typeof nf === "number" ? tPasso < nf : false); }
    var hud = root.querySelector(".wc__hud"), pins = [].slice.call(root.querySelectorAll("[data-pino]"));
    function setCena(id, manual) {
      if (!CENAS[id]) return;
      if (id === "frioCom" && cenaId !== "frioCom") frioT0 = -1;
      cenaId = id; alvo = CENAS[id].s;
      if (cap) { cap.querySelector("b").textContent = CENAS[id].nome; cap.querySelector("span").textContent = CENAS[id].txt; cap.setAttribute("aria-live", manual ? "polite" : "off");
        var tg = cap.querySelector(".wc__tag"); if (tg) { var t = CENAS[id].tag; tg.textContent = t === "sem" ? tr("Sem Agrotech da Holanda") : t === "com" ? tr("Com Agrotech da Holanda") : ""; tg.className = "wc__tag" + (t ? " wc__tag--" + t : ""); } }
      btns.forEach(function (b) { var bc = b.getAttribute("data-cena"); b.setAttribute("aria-pressed", bc === id || (CENAS[id].grupo && CENAS[bc] && CENAS[bc].grupo === CENAS[id].grupo) ? "true" : "false"); });
      gbtns.forEach(function (b) { b.setAttribute("aria-pressed", CENAS[id].grupo === b.getAttribute("data-grupo") ? "true" : "false"); });
      root.setAttribute("data-cena-atual", id);
    }
    function vaiPasso(n, manual, instant) {
      passo = (n + passos.length) % passos.length; tPasso = 0;
      var p = passos[passo];
      if (p.cena) setCena(p.cena, manual);
      pbtns.forEach(function (b) { b.setAttribute("aria-pressed", (p.passe || "") === b.getAttribute("data-passe") ? "true" : "false"); });
      var alvoC = ptCam(p.cam);
      if (alvoC) {
        if (instant || !p.fly) { cam.x = alvoC.x; cam.y = alvoC.y; cam.z = alvoC.z; voo = null; }
        else voo = { a: { x: cam.x, y: cam.y, z: cam.z }, b: alvoC, d: p.fly, t: 0 };
      }
    }
    function voa(dt) {
      if (!voo) return;
      voo.t += dt; var u = clamp(voo.t / voo.d, 0, 1), e = easeS(u), a = voo.b, s = voo.a;
      var z0 = s.z, z1 = a.z, dist = Math.hypot(a.x - s.x, a.y - s.y);
      var bump = clamp(dist * Math.min(z0, z1) / (WW * 0.5), 0, 1) * 0.5;
      var z = Math.exp(lerp(Math.log(z0), Math.log(z1), e)) / (1 + bump * Math.sin(Math.PI * e));
      cam.z = Math.max(0.85, z);
      // keep the destination (zoom in) or the origin (zoom out) steady on screen, so it never slides away
      var f;
      if (z1 >= z0) { f = 1 - (1 - e) * Math.min(1, z0 / cam.z); }
      else f = Math.min(1, e * z1 / cam.z);
      cam.x = lerp(s.x, a.x, f); cam.y = lerp(s.y, a.y, f);
      if (u >= 1) { cam.x = a.x; cam.y = a.y; cam.z = a.z; voo = null; }
    }
    var pausaAte = 0, iniciou = !cfg.inicioVisivel || REDUZ || !!Q.get("t");
    function dirige(dt) {
      if (!iniciou) return;
      tPasso += dt;
      var p = passos[passo], dur = (p.fly || 0) + (p.hold || 0);
      if (auto && tPasso >= dur && passos.length > 1) vaiPasso(passo + (p.prox || 1), false);
    }
    var dtUlt = 1 / 60;
    var nInst = 0, tInst = [];
    function alvoEf() {
      if (!cfg.agrotechjes) return alvo;
      var N = W0.instalaveis.length, s2 = N ? nInst / N : 0, a = {}; for (var k5 in alvo) a[k5] = alvo[k5];
      a.seco = alvo.seco * (1 - s2); a.viz = lerp(alvo.viz, 0.95, s2); a.desvio = alvo.desvio * (1 - s2); a.agua = lerp(alvo.agua, 1, s2); a.pivo = lerp(alvo.pivo, 0.35, s2);
      return a;
    }
    function instalaPasso() {
      if (!cfg.agrotechjes) return;
      var p = passos[passo], N = W0.instalaveis.length;
      if (p.instala) { var n = Math.min(N, Math.floor(tPasso / (cfg.instalaDt || 1.5)) + 1); while (nInst < n) { tInst[nInst] = tempo; nInst++; } }
      else if (p.reinicia) nInst = 0;
    }
    function progresso() { var N = W0.instalaveis.length; if (!N || !nInst) return 0; var last = clamp((tempo - tInst[nInst - 1]) / 1.5, 0, 1); return clamp((nInst - 1 + last) / N, 0, 1); }
    function cenario(pr) {
      if (pr < 0.02) return;
      g.save(); camTx();
      W0.predios.forEach(function (b, i) {   // solar on roofs, more each time
        if (!(b.z === "vila" || b.z === "cidade" || b.z === "pesca") || i % 3) return;
        if (pr < (i % 17) / 17 + 0.04 || !visW(b.x, b.y, 20)) return;
        var c = Pj(b.x + b.w * 0.25, b.y + b.d * 0.25), hh = k < 1 ? b.h * 0.9 : 0;
        g.fillStyle = "#2E5C86"; g.fillRect(c[0], c[1] - hh, b.w * 0.5, Math.max(0.8, b.d * 0.45 * k)); g.strokeStyle = rgba("#DCEBF7", 0.7); g.lineWidth = 0.2; g.strokeRect(c[0], c[1] - hh, b.w * 0.5, Math.max(0.8, b.d * 0.45 * k));
      });
      var r = W0.estradas[0], n = r.p.length, nt = Math.floor(pr * 6);   // cold chain: refrigerated trucks to the city
      for (var t = 0; t < nt; t++) {
        var u = 0.45 + ((tempo * 0.02 + t / 6) % 1) * 0.55, i = Math.min(n - 2, Math.floor(u * (n - 2))), a = r.p[i], b2 = r.p[i + 1];
        if (!visW(a[0], a[1], 8)) continue;
        var pa = Pj(a[0], a[1]), pb = Pj(b2[0], b2[1]), an = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
        g.save(); g.translate(pa[0], pa[1] - (k < 1 ? 1.2 : 0)); g.rotate(an); g.fillStyle = "#FFFFFF"; g.fillRect(-2.6, -1.1, 4.2, 2.2); g.fillStyle = "#FF914D"; g.fillRect(-2.6, -0.3, 4.2, 0.6); g.fillStyle = "#14263C"; g.fillRect(1.6, -1, 1.2, 2); g.restore();
      }
      g.restore();
    }
    function nexoAtualiza(pr) {
      if (!nexoEl) return;
      var on = (ligacoes === "pulso") ? 0.06 * Math.max(0, Math.sin(tempo * 2.4)) : 0;
      [["agua", clamp(pr * 1.08 + on, 0, 1)], ["energia", clamp(pr * 1.0, 0, 1)], ["comida", clamp(pr * 0.94, 0, 1)]].forEach(function (b) {
        var e = nexoEl.querySelector('[data-nexo="' + b[0] + '"]'); if (e) e.style.setProperty("--v", (0.12 + 0.88 * b[1]).toFixed(3)); });
      nexoEl.classList.toggle("wc__nexo--cheio", pr > 0.98);
    }
    function instalacoes() {
      var pr = progresso(); cenario(pr); nexoAtualiza(pr);
      g.save(); camTx(); groundTx(g);
      for (var i = 0; i < nInst; i++) {
        var pc = W0.instalaveis[i], age = tempo - tInst[i], a = clamp(age / 1.2, 0, 1);
        var cxp = pc.mx, cyp = pc.my, sc2 = function (f) { return pc.p.map(function (q2) { return [cxp + (q2[0] - cxp) * f, cyp + (q2[1] - cyp) * f]; }); };
        var traca = function (pts) { g.beginPath(); pts.forEach(function (q2, n2) { g[n2 ? "lineTo" : "moveTo"](q2[0], q2[1]); }); g.closePath(); };
        traca(sc2(0.92)); g.fillStyle = rgba("#6FB84E", 0.55 * a); g.fill(); g.strokeStyle = rgba("#FFFFFF", 0.85 * a); g.lineWidth = 1; g.stroke();
        g.strokeStyle = rgba("#38B6FF", 0.75 * a); g.lineWidth = 0.6; g.setLineDash([1.2, 1.6]); g.lineDashOffset = -tempo * 4;
        [0.7, 0.48, 0.26].forEach(function (f) { traca(sc2(f)); g.stroke(); });
        g.setLineDash([]);
      }
      g.restore();
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (var j2 = 0; j2 < nInst; j2++) {
        var pc2 = W0.instalaveis[j2], age2 = tempo - tInst[j2], sp = toScreen(pc2.mx, pc2.my), pop = age2 < 0.6 ? 1 + 0.25 * Math.sin(age2 / 0.6 * Math.PI) : 1;
        var r = Math.max(8.5, 3.2 * fit * cam.z) * clamp(age2 / 0.35, 0, 1) * pop;
        if (age2 < 1.6) { var ph = age2 / 1.6; g.strokeStyle = rgba("#38B6FF", 0.8 * (1 - ph)); g.lineWidth = 2; g.beginPath(); g.arc(sp[0], sp[1], r * (1.3 + 3 * ph), 0, 6.283); g.stroke(); }
        if (r > 0.5) marcaMini(sp[0], sp[1], r, (tempo + j2 * 0.37) % 1.8 / 1.8);
      }
      g.restore();
    }
    function marcaMini(cx, cy, r, f) {
      g.fillStyle = "rgba(20,38,60,.16)"; g.beginPath(); g.arc(cx + 1, cy + 1.5, r * 1.3, 0, 6.283); g.fill();
      g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(cx, cy, r * 1.3, 0, 6.283); g.fill();
      if (!PETALA) return;
      var pushO = REDUZ ? 0 : f < 0.5 ? Math.sin(f / 0.5 * Math.PI) : 0, pushA = REDUZ ? 0 : f >= 0.5 ? Math.sin((f - 0.5) / 0.5 * Math.PI) : 0, u = r / 500 * 0.86;
      [[-45, 581, "#FF914D", pushO], [135, 581, "#FF914D", pushO], [45, 413, "#38B6FF", pushA], [-135, 413, "#38B6FF", pushA]].forEach(function (pt) {
        g.save(); g.translate(cx, cy); g.rotate(pt[0] * Math.PI / 180); g.translate(0, (-18 - 52 * pt[3]) * u); g.scale(pt[1] * u, pt[1] * u); g.fillStyle = pt[2]; g.fill(PETALA); g.restore();
      });
    }
    function estado(dt) {
      var kk = 1 - Math.pow(0.18, dt), alvo0 = alvo; alvo = alvoEf();
      for (var key in alvo) { var lento = key === "sua" || key === "viz" ? 0.55 : key === "res" ? 0.13 : key === "fruto" ? 0.3 : key === "agua" ? 0.7 : 1; st[key] = lerp(st[key], alvo[key], kk * lento); }
      alvo = alvo0; agua(dt); moveParticulas(dt);
    }
    function passo1(dt) { dtUlt = dt; tempo += dt; dirige(dt); instalaPasso(); nexoFinal(); voa(dt); estado(dt); fazendaEstado(dt); }
    function quadro() {
      var dz = drift ? Math.sin(tempo * 0.07) : 0;
      var sx = cam.x, sy = cam.y; if (drift) { cam.x += drift * dz; cam.y += drift * 0.3 * Math.cos(tempo * 0.05); }
      desenha(); hudAtualiza(); pinos();
      cam.x = sx; cam.y = sy;
    }
    function hudAtualiza() {
      if (!hud) return;
      var q = aguaNaFazenda();
      var a = clamp(q.q / 1.2, 0, 1), ql = clamp(1 - q.c * 1.2, 0, 1), s = st.sua;
      hud.querySelector('[data-barra="agua"]').style.setProperty("--v", a.toFixed(3));
      hud.querySelector('[data-barra="qual"]').style.setProperty("--v", ql.toFixed(3));
      hud.querySelector('[data-barra="sua"]').style.setProperty("--v", s.toFixed(3));
      hud.classList.toggle("wc__hud--cheia", q.q > 1.35);
    }
    function pinos() {
      pins.forEach(function (b) {
        var l = W0.lugares[b.getAttribute("data-pino")]; if (!l) return;
        var p = toScreen(l.x, l.y), on = cam.z < 1.6;
        b.style.transform = "translate(" + Math.round(p[0]) + "px," + Math.round(p[1]) + "px)";
        b.classList.toggle("wc__pino--off", !on);
      });
    }
    function loop(now) {
      if (!rodando) return;
      var dt = Math.min(0.05, (now - (t0 || now)) / 1000); t0 = now;
      passo1(dt); quadro();
      if (fila.length && !trabalhando) { trabalhando = true; setTimeout(function () { trabalhaFila(); trabalhando = false; }, 30); }
      raf = requestAnimationFrame(loop);
    }
    var trabalhando = false;
    function liga() { if (rodando || REDUZ || congelado) return; rodando = true; t0 = 0; raf = requestAnimationFrame(loop); }
    function desliga() { rodando = false; cancelAnimationFrame(raf); }
    var congelado = false;
    function atualizaPausa() { if (btnPausa) { btnPausa.setAttribute("aria-pressed", congelado ? "true" : "false"); btnPausa.textContent = congelado ? tr("Continuar") : tr("Pausar"); } }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-cena"), n = -1;
        for (var i = 0; i < passos.length; i++) if (passos[i].cena === id && (passos[i].botao !== false)) { n = i; break; }
        if (n < 0) { setCena(id, true); return; }
        vaiPasso(n, true, REDUZ);
        if (REDUZ || congelado) { for (var key in alvo) st[key] = alvo[key]; preaquece(2.5); quadro(); }
      });
    });
    function salta(n) { if (n < 0) return; vaiPasso(n, true, REDUZ); if (REDUZ || congelado) { for (var key in alvo) st[key] = alvo[key]; preaquece(2.5); quadro(); } }
    gbtns.forEach(function (b) { b.addEventListener("click", function () {
      var gr = b.getAttribute("data-grupo"), pa = passos[passo].passe || "sem", n = -1, i;
      for (i = 0; i < passos.length && n < 0; i++) if (passos[i].passe === pa && passos[i].cena && CENAS[passos[i].cena].grupo === gr && passos[i].botao !== false) n = i;
      for (i = 0; i < passos.length && n < 0; i++) if (passos[i].cena && CENAS[passos[i].cena].grupo === gr && passos[i].botao !== false) n = i;
      salta(n); }); });
    pbtns.forEach(function (b) { b.addEventListener("click", function () { var pa = b.getAttribute("data-passe"), n = -1; for (var i = 0; i < passos.length && n < 0; i++) if (passos[i].passe === pa) n = i; salta(n); }); });
    pins.forEach(function (b) { b.addEventListener("click", function () { var c = b.getAttribute("data-vai"); var bt = root.querySelector('[data-grupo="' + c + '"]') || root.querySelector('[data-cena="' + c + '"]'); if (bt) bt.click(); }); });
    if (btnPausa) btnPausa.addEventListener("click", function () { congelado = !congelado; atualizaPausa(); if (congelado) desliga(); else if (visivel) liga(); });
    function preaquece(seg) { for (var t = 0; t < seg; t += 1 / 30) { tempo += 1 / 30; agua(1 / 30); moveParticulas(1 / 30); } }

    // start
    tamanho(); particulas();
    var ini = Q.get("passo"); vaiPasso(ini ? +ini : 0, false, true);
    for (var kk in alvo) st[kk] = alvo[kk];
    preaquece(6);
    var ff = +Q.get("t") || 0; if (cfg.t0) ff += cfg.t0;
    for (var tt = 0; tt < ff; tt += 1 / 30) passo1(1 / 30);
    if (REDUZ) {   // a clean still: the configured still step, water settled
      var sp = cfg.parado != null ? cfg.parado : 0; vaiPasso(sp, false, true); for (var k2 in alvo) st[k2] = alvo[k2]; preaquece(8);
      root.classList.add("wc--parado"); nexoFinal(); if (cfg.agrotechjes) { nInst = W0.instalaveis.length; for (var ri = 0; ri < nInst; ri++) tInst[ri] = tempo - 99; }
    }
    fila = [];
    quadro();
    // detail caches up front for the first close-up so the opening shot is sharp
    while (fila.length) trabalhaFila();
    quadro();
    if (Q.get("parado")) { congelado = true; atualizaPausa(); }
    if (document.fonts && document.fonts.load) document.fonts.load("600 12px Poppins").then(function () { fonteOk = true; if (!rodando) quadro(); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { var r = root.getBoundingClientRect(); if (Math.abs(r.width - W) > 2 || Math.abs(r.height - H) > 2) { tamanho(); particulas(); quadro(); while (fila.length) trabalhaFila(); quadro(); } }).observe(root);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
      var e = es[0]; visivel = e.isIntersecting;
      if (!iniciou && e.intersectionRatio >= 0.3) { iniciou = true; vaiPasso(0, false, true); }
      if (visivel && !document.hidden && (iniciou || e.intersectionRatio < 0.3)) liga(); else desliga();
    }, { threshold: [0, 0.04, 0.3] }).observe(root);
    else { visivel = true; liga(); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) desliga(); else if (visivel) liga(); });
    root.__wc = { vai: vaiPasso, cena: setCena, cam: cam, quadro: quadro, st: st, mundo: W0, fz: fz };
  }

  // ── markup helper: builds the overlay UI for a stage element ─────────────
  function montaUI(el, cfg) {
    var ui = cfg.ui || {};
    var h = "";

    if (ui.nexoFinal) h += '<div class="wc__nf" aria-hidden="true"><div class="wc__nf-card">' + ui.nexoFinal + '</div></div>';
    if (ui.nexo) h += '<div class="wc__nexo" aria-hidden="true"><i class="wc__nexo-l"></i><span data-nexo="agua"><b></b><em>água</em></span><span data-nexo="energia"><b></b><em>energia</em></span><span data-nexo="comida"><b></b><em>comida</em></span></div>';
    if (ui.hud) h += '<div class="wc__hud" aria-hidden="true"><div><span>Água no rio</span><i data-barra="agua"></i></div><div><span>Qualidade</span><i data-barra="qual"></i></div><div><span>Sua lavoura</span><i data-barra="sua"></i></div></div>';
    if (ui.pinos) ui.pinos.forEach(function (p) { var nm = p[2] || (CENAS[p[1]] && CENAS[p[1]].nome); h += '<button type="button" class="wc__pino" data-pino="' + p[0] + '" data-vai="' + p[1] + '" aria-label="' + tr("Ver") + ' ' + nm + '"><span>' + nm + "</span></button>"; });
    if (ui.pausa && !ui.nota && !ui.botoes && !ui.grupos) h += '<div class="wc__ui"><div class="wc__ctl"><button type="button" class="wc__pausa" aria-pressed="false">' + tr("Pausar") + '</button></div></div>';
    else if (ui.nota) h += '<div class="wc__ui"><p class="wc__nota">' + ui.nota + '</p>' + (ui.pausa ? '<div class="wc__ctl"><button type="button" class="wc__pausa" aria-pressed="false">' + tr("Pausar") + '</button></div>' : '') + '</div>';
    else if (ui.grupos) {
      h += '<div class="wc__ui"><p class="wc__cap" aria-live="off"><i class="wc__tag"></i><b></b> <span></span></p><div class="wc__ctl wc__ctl--passes">';
      h += '<div class="wc__passes" role="group" aria-label="' + tr("Situação") + '"><button type="button" data-passe="sem" aria-pressed="false">' + tr("Sem Agrotech da Holanda") + '</button><button type="button" data-passe="com" aria-pressed="false">' + tr("Com Agrotech da Holanda") + '</button></div>';
      h += '<div class="wc__btns" role="group" aria-label="' + tr("Situações do rio") + '">';
      (ui.grupos).forEach(function (gp) { h += '<button type="button" data-grupo="' + gp[0] + '" aria-pressed="false">' + gp[1] + "</button>"; });
      h += '</div><button type="button" class="wc__pausa" aria-pressed="false">' + tr("Pausar") + '</button></div></div>';
    }
    else if (ui.legenda !== false && (ui.botoes || ui.legenda)) {
      h += '<div class="wc__ui"><p class="wc__cap" aria-live="off">' + (ui.tags ? '<i class="wc__tag"></i>' : '') + '<b></b> <span></span></p>';
      if (ui.botoes) {
        h += '<div class="wc__ctl"><div class="wc__btns" role="group" aria-label="' + tr("Situações do rio") + '">';
        (ui.botoes === true ? ORDEM : ui.botoes).forEach(function (id) { h += '<button type="button" data-cena="' + id + '" aria-pressed="false">' + CENAS[id].nome + "</button>"; });
        h += '</div><button type="button" class="wc__pausa" aria-pressed="false">' + tr("Pausar") + '</button></div>';
      }
      h += "</div>";
    }
    el.insertAdjacentHTML("beforeend", h);
    if (ui.capTopo) el.classList.add("wc--captopo");
    el.setAttribute("role", "group");
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", tr("Animação: a comunidade da água, da nascente ao delta"));
  }
  function json(id) { var e = document.getElementById(id); if (!e) return null; try { return JSON.parse(e.textContent); } catch (err) { return null; } }
  function init() {
    TXT = json("wc-txt") || {};
    for (var id in CENAS) { CENAS[id].nome = tr(CENAS[id].nome); CENAS[id].txt = tr(CENAS[id].txt); }
    [].forEach.call(document.querySelectorAll("[data-wc]"), function (el) {
      var cfg = json("wc-cfg-" + el.getAttribute("data-wc")) || {};
      montaUI(el, cfg); Comunidade(el, cfg);
    });
  }
  window.WC = { CENAS: CENAS, ORDEM: ORDEM, PAL: PAL };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
