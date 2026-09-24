/*! agro-challenge.js · o desafio do nexo: leve o painel solar ao telhado, dentro do raio de sol.
 *  window.AgroChallenge.mount(el, {variant:'irrigacao'|'camara-fria', lang:'pt'|'en', focus:true}) -> Promise
 *  Resolve quando a pessoa encaixa o painel. el.nxChallenge = {solved, reset(), onSolve(fn), focus()}.
 *  Quem chama: antibot.js, só quando as camadas invisíveis apontam risco.
 *  Sem dependências. ES5 de propósito (celulares antigos).
 *  O ESTILO MORA EM style.css (bloco "desafio do nexo", tudo com prefixo .nx__). No design lab o mesmo motor
 *  injetava esse CSS num <style id="nx-css">; no site ele vem da folha, uma cópia só, e o motor não injeta nada.
 *  Origem: design-lab/labs/agrotech-site-2026-09/candidates/n8-fable-conteiner.html (motor aprovado 24-09-2026). */
(function () {
  'use strict';

  // ── textos (PT e EN). {roof} vira o nome do telhado da variante; {n}, {dir}, {t} são números e direções.
  var I18N = {
    pt: {
      title: 'Verificação rápida',
      hint: { irrigacao: 'Coloque o painel no telhado, dentro do raio de sol.', 'camara-fria': 'Coloque o painel no teto do contêiner, dentro do raio de sol.' },
      roof: { irrigacao: 'telhado', 'camara-fria': 'teto do contêiner' },
      keys: 'Use as setas para a esquerda e para a direita para levar o painel até o {roof}. PageUp e PageDown movem três passos; Home e End vão às pontas. Enter ou espaço encaixa o painel; Esc devolve ao chão.',
      kbd: 'No teclado: <kbd>←</kbd> <kbd>→</kbd> levam o painel, <kbd>Enter</kbd> encaixa.',
      scene: { irrigacao: 'Cena: o sol ilumina o telhado vazio de um galpão aberto; embaixo, a bomba do poço; à direita, o canteiro com a linha de gotejo.', 'camara-fria': 'Cena: o sol ilumina o teto vazio de um contêiner frigorífico aberto em corte; dentro, caixas de frutas e verduras; ao lado, o quadro com o termômetro marcando 32 °C.' },
      slider: 'Posição do painel solar',
      idle: { irrigacao: 'Energia, água e alimento: comece pelo sol.', 'camara-fria': 'Energia, frio e alimento: comece pelo sol.' },
      near: 'No lugar. Solte o painel.',
      miss: 'Ainda fora do {roof}. Tente de novo.',
      done: { irrigacao: 'No telhado: a bomba liga, a água chega, a lavoura cresce. Verificado.', 'camara-fria': 'No teto: a câmara esfria até +4 °C e a colheita se conserva. Verificado.' },
      vDone: 'Painel encaixado no {roof}. Verificado.',
      vOver: 'Painel sobre o {roof}. Pressione Enter para encaixar.',
      vAligned: 'Painel alinhado com o {roof}, ainda no chão.',
      vSteps: 'Painel a {n} {step} do {roof}; mova para a {dir}.',
      step: ['passo', 'passos'], right: 'direita', left: 'esquerda',
      temp: '{t} °C'
    },
    en: {
      title: 'Quick check',
      hint: { irrigacao: 'Put the panel on the roof, inside the sunbeam.', 'camara-fria': 'Put the panel on the container roof, inside the sunbeam.' },
      roof: { irrigacao: 'roof', 'camara-fria': 'container roof' },
      keys: 'Use the left and right arrow keys to carry the panel to the {roof}. PageUp and PageDown move three steps; Home and End go to the ends. Enter or space sets the panel down; Esc returns it to the ground.',
      kbd: 'Keyboard: <kbd>←</kbd> <kbd>→</kbd> carry the panel, <kbd>Enter</kbd> sets it down.',
      scene: { irrigacao: 'Scene: the sun lights the empty roof of an open shed; below it, the well pump; on the right, the bed with the drip line.', 'camara-fria': 'Scene: the sun lights the empty roof of a cold-room container shown in cutaway; inside, crates of fruit and vegetables; beside it, the control box with the thermometer reading 32 °C.' },
      slider: 'Solar panel position',
      idle: { irrigacao: 'Energy, water and food: start with the sun.', 'camara-fria': 'Energy, cold and food: start with the sun.' },
      near: 'In place. Let go of the panel.',
      miss: 'Still off the {roof}. Try again.',
      done: { irrigacao: 'On the roof: the pump starts, the water arrives, the crop grows. Verified.', 'camara-fria': 'On the roof: the cold room cools to +4 °C and the harvest keeps. Verified.' },
      vDone: 'Panel set on the {roof}. Verified.',
      vOver: 'Panel above the {roof}. Press Enter to set it down.',
      vAligned: 'Panel aligned with the {roof}, still on the ground.',
      vSteps: 'Panel {n} {step} from the {roof}; move {dir}.',
      step: ['step', 'steps'], right: 'right', left: 'left',
      temp: '{t} °C'
    }
  };


  // ── geometria. Um vetor de profundidade só, para tudo: (26,-22) por 34 de fundo = matriz M.
  var M = 'matrix(1,0,.7634,-.6459,0,0)';
  var LAYOUT = {                    // wide: como o n7. compact: quadro de 320, objetos ~25% maiores na mesma largura de tela
    wide:    { W: 400, H: 214, sun: [46, 42], start: [18, 169], pallet: 14, xmax: 290, k: 1 },
    compact: { W: 320, H: 214, sun: [36, 40], start: [10, 169], pallet: 6,  xmax: 210, k: 1.2 }
  };
  var TX = 14, TY = 26, STEP = 12, GY = 176;

  function hand() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 8V4a2 2 0 0 0-4 0v4"/><path d="M14 8V3a2 2 0 0 0-4 0v9"/><path d="M10 12V5a2 2 0 0 0-4 0v9"/><path d="M6 14a6 6 0 0 0 12 0v-2a2 2 0 0 0-4 0"/></svg>';
  }
  function check() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m16 9-5.5 5.5L8 12"/></svg>';
  }
  function plant(x, k, cls, mirror, h) {
    var s = mirror ? ' scale(' + (-k) + ' ' + k + ')' : ' scale(' + k + ')';
    return '<g transform="translate(' + x + ' ' + GY + ')' + s + '"><g class="nx__plant' + cls + '">' +
      '<path class="nx__stem" d="M0 0V' + (-h) + '"/>' +
      '<path class="nx__leaf" d="M0-9C-5-9-11-13-12-20C-6-20-1-16 0-9Z"/><path class="nx__leaf" d="M0-14C6-14 12-18 13-25C7-25 1-20 0-14Z"/>' +
      '<path class="nx__leaf" d="M0 ' + (-h) + 'C-4 ' + (-h - 2) + '-4 ' + (-h - 8) + ' 0 ' + (-h - 11) + 'C4 ' + (-h - 8) + ' 4 ' + (-h - 2) + ' 0 ' + (-h) + 'Z"/></g></g>';
  }
  function drop(x, cls, k) {
    return '<g transform="translate(' + x + ' 170) scale(' + k + ')"><path class="nx__drop' + cls + '" d="M0-3C-1.7-.8-2.5 .5-2.5 1.5a2.5 2.5 0 0 0 5 0C2.5 .5 1.7-.8 0-3Z"/></g>';
  }
  function crate(x, y, fruit) {
    var s = '<g transform="translate(' + x + ' ' + y + ')"><rect class="nx__crate" x="0" y="0" width="12" height="7.5" rx=".8"/><path class="nx__slat" d="M1.6 2.6h8.8M1.6 5h8.8"/>';
    if (fruit) s += '<circle class="nx__f nx__f--' + fruit[0] + '" cx="2.8" cy="-.9" r="1.8"/><circle class="nx__f nx__f--' + fruit[1] + '" cx="6" cy="-1.2" r="1.8"/><circle class="nx__f nx__f--' + fruit[2] + '" cx="9.2" cy="-.9" r="1.8"/>';
    return s + '</g>';
  }

  var VARIANTS = {
    irrigacao: {
      rox: -42, roy: 106, ymin: 60, hov: 88,
      roof: [[-42, 106], [42, 106], [68, 84], [-16, 84]],
      place: { wide: { sx0: 186, sxr: 70, c: 348 }, compact: { sx0: 144, sxr: 42, c: 272 } },
      // canteiro fixo à direita: 3 emissores, gotas, faixa úmida, 3 plantas (energia à esquerda, alimento à direita, água no meio)
      fixed: function (L, P) {
        var c = P.c, k = L.k, e = c + 7;
        return '<rect class="nx__wet" x="' + (c - 9) + '" y="177.5" width="54" height="4" rx="2"/>' +
          '<circle class="nx__emit" cx="' + e + '" cy="168.3" r="1.8"/><circle class="nx__emit" cx="' + (e + 18) + '" cy="168.3" r="1.8"/><circle class="nx__emit" cx="' + (e + 36) + '" cy="168.3" r="1.8"/>' +
          drop(e, '', k) + drop(e + 18, ' nx__drop--b', k) + drop(e + 36, ' nx__drop--c', k) +
          '<path class="nx__mound" d="M' + (c - 9) + ' 176Q' + c + ' 171.5 ' + (c + 9) + ' 176M' + (c + 9) + ' 176Q' + (c + 18) + ' 171.5 ' + (c + 27) + ' 176M' + (c + 27) + ' 176Q' + (c + 36) + ' 171.5 ' + (c + 45) + ' 176"/>' +
          plant(c, k, '', false, 22) + plant(c + 18, k, ' nx__plant--b', true, 24) + plant(c + 36, k, ' nx__plant--c', false, 21);
      },
      // galpão aberto igual ao da instalação real: 4 pilares em sapatas, contraventamento, telhado de uma água, poço, bomba, quadro
      group: function () {
        return '<polygon class="nx__pad" points="-46,176 46,176 72,154 -20,154"/>' +
          '<rect class="nx__foot" x="-11" y="147" width="10" height="7" rx="1"/><rect class="nx__foot" x="53" y="147" width="10" height="7" rx="1"/>' +
          '<rect class="nx__post" x="-9" y="84" width="6" height="63"/><rect class="nx__post" x="55" y="84" width="6" height="63"/>' +
          '<polygon class="nx__roof" points="-42,106 42,106 68,84 -16,84"/><path class="nx__purlin" d="M-14 106 12 84M14 106 40 84"/>' +
          '<polygon class="nx__slot" points="-42,106 42,106 68,84 -16,84"/>' +
          '<rect class="nx__casing" x="3" y="176" width="10" height="30" rx="1"/><rect class="nx__table" x="3.75" y="192" width="8.5" height="13.5"/>' +
          '<rect class="nx__pumpb" x="4.5" y="186" width="7" height="14" rx="1.5"/><path class="nx__arrow" d="M8 190.5l2.6 4h-5.2z"/>' +
          '<path class="nx__pipe" d=""/><path class="nx__bore" d=""/><path class="nx__water" d="" pathLength="1"/>' +
          '<rect class="nx__head" x="1" y="169" width="14" height="7" rx="1.5"/>' +
          '<rect class="nx__foot" x="-37" y="168" width="10" height="8" rx="1"/><rect class="nx__foot" x="27" y="168" width="10" height="8" rx="1"/>' +
          '<rect class="nx__post" x="-35" y="106" width="6" height="62"/><rect class="nx__post" x="29" y="106" width="6" height="62"/>' +
          '<path class="nx__brace" d="M-32 128 -18 107M32 128 18 107"/>' +
          '<path class="nx__cable" d="M-29 108V132M-22 150V162H2V170"/><path class="nx__energy" d="M-29 108V132M-22 150V162H2V170" pathLength="1"/>' +
          '<rect class="nx__cab" x="-29" y="132" width="14" height="18" rx="1.5"/><circle class="nx__led" cx="-22" cy="137" r="1.8"/><path class="nx__cabline" d="M-26 142h8M-26 145.5h8"/>';
      },
      pipe: function (sx, P) { return 'M8 188V152H' + (P.c - 5 - sx) + 'V166H' + (P.c + 44 - sx); }
    },
    'camara-fria': {
      rox: -42, roy: 136, ymin: 80, hov: 118,
      roof: [[-48, 136], [48, 136], [74, 114], [-22, 114]],
      place: { wide: { sx0: 218, sxr: 78 }, compact: { sx0: 208, sxr: 34 } },
      fixed: function () { return ''; },
      // contêiner de 20 pés em corte: face lateral direita com o condensador, teto que recebe o painel, frente aberta
      // com o evaporador no teto e as caixas de colheita; quadro de comando com o termômetro ao lado
      group: function (id) {
        return '<polygon class="nx__end" points="48,136 74,114 74,154 48,176"/><path class="nx__rib" d="M56 129.2V169.2M64 122.5V162.5"/>' +
          '<g transform="translate(62 148)"><ellipse class="nx__grille" rx="6.4" ry="8"/><g transform="scale(.8 1)"><g class="nx__fan"><path class="nx__blade" d="M0 0V-6.4M0 0L5.5 3.2M0 0L-5.5 3.2"/></g></g><circle class="nx__hub" r="1.5"/></g>' +
          '<polygon class="nx__roof" points="-48,136 48,136 74,114 -22,114"/><path class="nx__purlin" d="M-16 136 10 114M16 136 42 114"/>' +
          '<polygon class="nx__slot" points="-42,136 42,136 68,114 -16,114"/>' +
          '<path class="nx__shell" fill-rule="evenodd" d="M-48 136H48V176H-48ZM-44 140H44V172H-44Z"/><rect class="nx__inside" x="-44" y="140" width="88" height="32"/>' +
          '<rect class="nx__cold" x="-44" y="140" width="88" height="32" fill="url(#' + id + '-cold)"/>' +
          '<rect class="nx__evap" x="-40" y="140" width="22" height="9" rx="1.5"/>' +
          '<g transform="translate(-34.5 144.5)"><circle class="nx__grille nx__grille--s" r="2.9"/><g class="nx__fan nx__fan--s"><path class="nx__blade nx__blade--s" d="M0 0V-2.5M0 0L2.2 1.3M0 0L-2.2 1.3"/></g></g>' +
          '<g transform="translate(-23.5 144.5)"><circle class="nx__grille nx__grille--s" r="2.9"/><g class="nx__fan nx__fan--s"><path class="nx__blade nx__blade--s" d="M0 0V-2.5M0 0L2.2 1.3M0 0L-2.2 1.3"/></g></g>' +
          crate(-13, 164.5) + crate(-13, 157, ['o', 'g', 'o']) +
          crate(1, 164.5) + crate(1, 157) + crate(1, 149.5, ['g', 'o', 'g']) +
          crate(15, 164.5) + crate(15, 157, ['o', 'o', 'g']) +
          crate(29, 164.5, ['g', 'g', 'o']) +
          '<path class="nx__cable" d="M-47 137V155H-52"/><path class="nx__energy" d="M-47 137V155H-52" pathLength="1"/>' +
          '<path class="nx__cable" d="M47 137V148H55.5"/><path class="nx__energy" d="M47 137V148H55.5" pathLength="1"/>' +
          '<rect class="nx__post" x="-71" y="164" width="4" height="12"/>' +
          '<rect class="nx__cab" x="-86" y="144" width="34" height="20" rx="2"/><circle class="nx__led" cx="-81" cy="148.5" r="1.8"/><path class="nx__cabline" d="M-77 148.5h10"/>' +
          '<rect class="nx__lcd" x="-84" y="151" width="30" height="11" rx="1.2"/><text class="nx__temp" x="-69" y="159.6" text-anchor="middle"></text>';
      },
      pipe: null
    }
  };

  var N = 0;
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function Challenge(el, o) {
    o = o || {};
    var self = this;
    this.el = el; this.vn = VARIANTS[o.variant] ? o.variant : 'irrigacao'; this.v = VARIANTS[this.vn];
    this.s = I18N[o.lang] || I18N[(document.documentElement.lang || 'pt').slice(0, 2)] || I18N.pt;
    this.id = 'nx' + (++N); this.cbs = []; this.solved = false; this.mode = null; this.timer = 0; this.tick = 0;
    this.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches);
    var s = this.s, id = this.id, roof = s.roof[this.vn];
    el.classList.add('nx'); el.setAttribute('role', 'group'); el.setAttribute('aria-labelledby', id + '-t');
    el.innerHTML = '<p class="nx__title" id="' + id + '-t">' + s.title + '</p>' +
      '<p class="nx__hint">' + hand() + s.hint[this.vn] + '</p>' +
      '<p class="nx__sr" id="' + id + '-k">' + fmt(s.keys, { roof: roof }) + '</p>' +
      '<div class="nx__stage"></div>' +
      '<p class="nx__status" role="status"></p>' +
      '<p class="nx__kbd" hidden>' + s.kbd + '</p>';
    this.stage = el.querySelector('.nx__stage'); this.status = el.querySelector('.nx__status'); this.kbd = el.querySelector('.nx__kbd');
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(function (en) { self.fit(en[0].contentRect.width); });
      this.ro.observe(el);
    } else {
      this.fit(el.clientWidth);
      window.addEventListener('resize', function () { self.fit(el.clientWidth); });
    }
    if (!this.mode) this.fit(el.clientWidth || 600);
  }

  Challenge.prototype.fit = function (w) {
    // Largura 0 = o formulário está escondido (o seletor da página inicial mostrou o outro lado).
    // Não há cena para ajustar; reconstruir agora jogaria fora um arraste pela metade.
    if (!w) return;
    var m = w < 440 ? 'compact' : 'wide';
    if (m === this.mode) return;
    this.mode = m; this.build();
  };

  Challenge.prototype.build = function () {
    var L = this.L = LAYOUT[this.mode], P = this.P = this.v.place[this.mode], v = this.v, id = this.id, s = this.s, self = this;
    this.el.classList.toggle('nx--compact', this.mode === 'compact');
    var pal = L.pallet;
    this.stage.innerHTML = '<svg class="nx__scene" viewBox="0 0 ' + L.W + ' ' + L.H + '" role="group" aria-label="' + s.scene[this.vn] + '">' +
      '<defs><linearGradient id="' + id + '-bg" gradientUnits="userSpaceOnUse" x1="' + L.sun[0] + '" y1="' + L.sun[1] + '" x2="' + (L.W * .68) + '" y2="100">' +
      '<stop offset="0" stop-color="#FF914D" stop-opacity=".38"/><stop offset="1" stop-color="#FF914D" stop-opacity=".14"/></linearGradient>' +
      '<linearGradient id="' + id + '-cold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38B6FF" stop-opacity=".34"/><stop offset="1" stop-color="#38B6FF" stop-opacity=".1"/></linearGradient>' +
      '<clipPath id="' + id + '-clip"><rect x="0" y="0" width="84" height="34"/></clipPath></defs>' +
      '<g aria-hidden="true">' +
        '<rect class="nx__soil" x="0" y="' + GY + '" width="' + L.W + '" height="' + (L.H - GY) + '"/>' +
        '<polygon class="nx__beam" fill="url(#' + id + '-bg)" points="0,0 0,0 0,0"/>' +
        '<g class="nx__sun" transform="translate(' + L.sun[0] + ' ' + L.sun[1] + ')"><circle r="12"/><path class="nx__rays" d="M0-17V-22M12-12l3.5-3.5M17 0h5M12 12l3.5 3.5M0 17v5M-12 12l-3.5 3.5M-17 0h-5M-12-12l-3.5-3.5"/></g>' +
        '<line class="nx__ground" x1="6" y1="' + GY + '" x2="' + (L.W - 6) + '" y2="' + GY + '"/>' +
        '<ellipse class="nx__shadow" rx="46" ry="3.5"/>' +
        '<g class="nx__pallet"><rect x="' + pal + '" y="169" width="92" height="3.5" rx="1"/><rect x="' + (pal + 4) + '" y="172.5" width="9" height="3.5"/><rect x="' + (pal + 41.5) + '" y="172.5" width="9" height="3.5"/><rect x="' + (pal + 79) + '" y="172.5" width="9" height="3.5"/></g>' +
        '<g class="nx__shed">' + v.group(id) + '</g>' +
        v.fixed(L, P) +
      '</g>' +
      '<g class="nx__panel" role="slider" tabindex="0" aria-label="' + s.slider + '" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="" aria-describedby="' + id + '-k">' +
        '<rect class="nx__hit" x="-12" y="-46" width="134" height="64"/>' +
        '<g class="nx__nudge"><g transform="' + M + '">' +
          '<rect class="nx__frame" x="0" y="0" width="84" height="34" rx="1"/>' +
          '<g class="nx__cell">' + cells() + '</g>' +
          '<g clip-path="url(#' + id + '-clip)"><polygon class="nx__sheen" points="0,0 26,0 8,34 0,34"/><rect class="nx__lit" x="0" y="0" width="84" height="34"/><rect class="nx__glare" x="0" y="0" width="14" height="34"/></g>' +
          '<g class="nx__focus"><rect x="-3" y="-3" width="90" height="40" rx="2"/><rect x="-3" y="-3" width="90" height="40" rx="2"/></g>' +
        '</g></g>' +
      '</g></svg>';
    function cells() {
      var r = '', x, y;
      for (y = 0; y < 3; y++) for (x = 0; x < 6; x++) r += '<rect x="' + (3 + x * 13.1).toFixed(1) + '" y="' + (3 + y * 9.6).toFixed(1) + '" width="12" height="8.5"/>';
      return r;
    }
    var q = function (c) { return self.stage.querySelector('.' + c); };
    this.scene = q('nx__scene'); this.panel = q('nx__panel'); this.nudge = q('nx__nudge'); this.shed = q('nx__shed'); this.beam = q('nx__beam');
    this.pipe = q('nx__pipe'); this.bore = q('nx__bore'); this.water = q('nx__water'); this.shadow = q('nx__shadow'); this.temp = q('nx__temp');
    this.bind();
    if (this.solved) this.restore(); else this.reset(true);
  };

  // ── estado
  Challenge.prototype.tx = function () { return this.sx + this.v.rox; };
  Challenge.prototype.inZone = function () { return Math.abs(this.px - this.tx()) <= TX && Math.abs(this.py - this.v.roy) <= TY; };
  Challenge.prototype.setMode = function (c) { this.panel.setAttribute('class', 'nx__panel' + (c ? ' nx__panel--' + c : '') + (this.kb ? ' nx__panel--kb' : '')); };
  Challenge.prototype.text = function () {
    var s = this.s, roof = s.roof[this.vn];
    if (this.solved) return fmt(s.vDone, { roof: roof });
    var d = this.tx() - this.px;
    if (Math.abs(d) <= TX) return fmt(this.lifted ? s.vOver : s.vAligned, { roof: roof });
    var n = Math.ceil((Math.abs(d) - TX) / STEP);
    return fmt(s.vSteps, { n: n, step: s.step[n === 1 ? 0 : 1], roof: roof, dir: d > 0 ? s.right : s.left });
  };
  Challenge.prototype.draw = function () {
    var L = this.L, lift = (L.start[1] - this.py) / (L.start[1] - this.v.ymin);
    this.panel.style.transform = 'translate(' + this.px + 'px,' + this.py + 'px)';
    this.shadow.setAttribute('transform', 'translate(' + (this.px + 55) + ' 178) scale(' + (1 + lift * .35).toFixed(3) + ' 1)');
    this.shadow.style.opacity = this.solved ? '0' : String((.16 - lift * .1).toFixed(3));
    this.panel.setAttribute('aria-valuenow', String(Math.round(this.px / L.xmax * 100)));
    this.panel.setAttribute('aria-valuetext', this.text());
    this.el.classList.toggle('nx--near', !this.solved && this.inZone());
  };
  Challenge.prototype.layout = function () {
    var sx = this.sx, L = this.L, r = this.v.roof, S = L.sun;
    this.shed.setAttribute('transform', 'translate(' + sx + ' 0)');
    var cx = sx + (r[0][0] + r[1][0] + r[2][0] + r[3][0]) / 4, cy = (r[0][1] + r[1][1] + r[2][1] + r[3][1]) / 4;
    var dx = cx - S[0], dy = cy - S[1], l = Math.hypot(dx, dy), nx = dy / l * 10, ny = -dx / l * 10;
    this.beam.setAttribute('points', (S[0] + nx).toFixed(1) + ',' + (S[1] + ny).toFixed(1) + ' ' + (sx + r[2][0]) + ',' + r[2][1] + ' ' + (sx + r[1][0]) + ',' + r[1][1] + ' ' + (sx + r[0][0]) + ',' + r[0][1] + ' ' + (S[0] - nx).toFixed(1) + ',' + (S[1] - ny).toFixed(1));
    if (this.v.pipe) { var d = this.v.pipe(sx, this.P); this.pipe.setAttribute('d', d); this.bore.setAttribute('d', d); this.water.setAttribute('d', d); }
  };
  Challenge.prototype.setTemp = function (t) { if (this.temp) this.temp.textContent = fmt(this.s.temp, { t: t }); };
  Challenge.prototype.announce = function () {
    if (this.solved) this.status.innerHTML = check() + this.s.done[this.vn];
    else this.status.textContent = this.s.idle[this.vn];
  };
  Challenge.prototype.note = function (t) { if (this.status.textContent !== t) this.status.textContent = t; };
  Challenge.prototype.finish = function () {
    var self = this;
    this.el.classList.add('nx--solved'); this.announce();
    if (this.temp) {
      clearInterval(this.tick);
      if (this.rm) this.setTemp(4);
      else { var t = 32; this.tick = setInterval(function () { t--; self.setTemp(t); if (t <= 4) clearInterval(self.tick); }, 55); }
    }
    this.cbs.forEach(function (f) { f(); });
  };
  Challenge.prototype.snap = function () {
    var self = this;
    this.solved = true; this.drag = null; this.px = this.tx(); this.py = this.v.roy; this.el.classList.remove('nx--near');
    this.setMode('snap'); this.panel.getBoundingClientRect(); this.draw();
    clearTimeout(this.timer);
    if (this.rm) this.finish(); else this.timer = setTimeout(function () { self.finish(); }, 420);
  };
  Challenge.prototype.back = function () {
    var self = this;
    this.px = this.L.start[0]; this.py = this.L.start[1]; this.lifted = false; this.setMode('back'); this.panel.getBoundingClientRect(); this.draw();
    clearTimeout(this.timer); this.timer = setTimeout(function () { self.setMode(''); }, 320);
  };
  Challenge.prototype.set = function (x, y, cls) {
    if (this.solved) return;
    this.px = clamp(x, 0, this.L.xmax); this.py = clamp(y, this.v.ymin, this.L.start[1]);
    this.nudge.classList.remove('nx__nudge'); this.setMode(cls || ''); this.draw();
  };
  Challenge.prototype.reset = function (keepSx) {
    clearTimeout(this.timer); clearInterval(this.tick);
    this.solved = false; this.lifted = false; this.drag = null; this.el.classList.remove('nx--solved', 'nx--near', 'nx--still');
    if (!(keepSx && this.sx >= this.P.sx0 && this.sx <= this.P.sx0 + this.P.sxr)) this.sx = this.P.sx0 + Math.floor(Math.random() * (this.P.sxr + 1));
    this.px = this.L.start[0]; this.py = this.L.start[1];
    this.setMode(''); this.layout(); this.setTemp(32); this.draw(); this.announce(); this.nudge.classList.add('nx__nudge');
  };
  // depois de mudar de quadro (girar o celular) com o desafio já resolvido: estado final de uma vez, sem replay
  Challenge.prototype.restore = function () {
    var P = this.P; this.sx = clamp(this.sx, P.sx0, P.sx0 + P.sxr);
    this.el.classList.add('nx--still'); this.px = this.tx(); this.py = this.v.roy; this.setMode('');
    this.layout(); this.draw(); this.el.classList.add('nx--solved'); this.setTemp(4); this.announce();
    this.el.getBoundingClientRect(); this.el.classList.remove('nx--still');
  };

  // ── entrada: arrastar (no painel ou em qualquer ponto da cena: movimento relativo, em 2D) e teclado (slider)
  Challenge.prototype.bind = function () {
    var self = this, scene = this.scene, panel = this.panel;
    scene.addEventListener('pointerdown', function (e) {
      if (self.solved || e.button) return;
      self.kb = false; var r = scene.getBoundingClientRect();
      self.drag = { x: e.clientX, y: e.clientY, px: self.px, py: self.py, k: self.L.W / r.width, moved: false };
      try { scene.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    scene.addEventListener('pointermove', function (e) {
      var d = self.drag; if (!d) return;
      var dx = (e.clientX - d.x) * d.k, dy = (e.clientY - d.y) * d.k;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      d.moved = true; self.lifted = true; self.set(d.px + dx, d.py + dy);
      self.note(self.inZone() ? self.s.near : self.s.idle[self.vn]);
    });
    function up() {
      var d = self.drag; if (!d) return; self.drag = null;
      if (self.solved || !d.moved) return;
      if (self.inZone()) self.snap(); else { self.back(); self.note(fmt(self.s.miss, { roof: self.s.roof[self.vn] })); }
    }
    scene.addEventListener('pointerup', up); scene.addEventListener('pointercancel', up);
    scene.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    panel.addEventListener('keydown', function (e) {
      if (self.solved) return;
      var k = e.key, d;
      if (k === 'ArrowRight' || k === 'ArrowUp') d = STEP; else if (k === 'ArrowLeft' || k === 'ArrowDown') d = -STEP;
      else if (k === 'PageUp') d = 3 * STEP; else if (k === 'PageDown') d = -3 * STEP;
      else if (k === 'Home') d = -self.px; else if (k === 'End') d = self.L.xmax - self.px;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (self.lifted && self.inZone()) self.snap(); else self.note(self.text()); return; }
      else if (k === 'Escape') { e.preventDefault(); self.back(); self.announce(); return; }
      else return;
      e.preventDefault(); self.kb = true; self.kbd.hidden = false; self.lifted = true; self.set(self.px + d, self.v.hov, 'key'); self.note(self.text());
    });
    panel.addEventListener('focus', function () { var v = true; try { v = panel.matches(':focus-visible'); } catch (_) {} self.kbd.hidden = !v; });
    panel.addEventListener('blur', function () { self.kbd.hidden = true; self.kb = false; self.setMode(''); });
  };
  Challenge.prototype.onSolve = function (f) { this.cbs.push(f); };
  Challenge.prototype.focus = function () { if (this.panel) this.panel.focus({ preventScroll: true }); };

  window.AgroChallenge = {
    mount: function (el, o) {
      o = o || {};
      return new Promise(function (resolve) {
        var c = new Challenge(el, o);
        el.nxChallenge = { get solved() { return c.solved; }, reset: function () { c.reset(); }, onSolve: function (f) { c.onSolve(f); }, focus: function () { c.focus(); } };
        c.onSolve(function () { resolve(el.nxChallenge); });
        if (o.focus !== false) c.focus();
      });
    },
    strings: I18N
  };
})();
