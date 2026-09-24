/**
 * antibot.js: proteção contra robôs nos formulários da Agrotech da Holanda.
 *
 * INVISÍVEL PRIMEIRO. Quem preenche o formulário não vê nada disso na maioria das vezes:
 *   1. honeypot: um campo fora da tela que só robôs preenchem;
 *   2. tempo: conta a partir da primeira interação com o formulário, não do carregamento;
 *   3. prova de trabalho: o navegador acha um número cujo SHA-256 começa com '0000'.
 * O desafio visual aparece SÓ quando 1-2 apontam risco: nenhuma interação real antes do envio,
 * envio rápido demais, formulário aberto há mais de 5 minutos (o servidor recusaria o carimbo)
 * ou um navegador automatizado (navigator.webdriver).
 *
 * O DESAFIO é o quebra-cabeça do nexo (assets/js/agro-challenge.js, carregado antes deste arquivo):
 * levar o painel solar ao telhado. window.AgroChallenge.mount(el, {variant, lang}) devolve uma Promise
 * que resolve quando a pessoa encaixa o painel. A cena segue o produto do formulário: data-produto, ou
 * o <select name="produto"> no momento em que o desafio aparece ('camara-fria' mostra o contêiner,
 * qualquer outro valor o galpão da irrigação, inclusive 'ambos' e o select ainda vazio). Se a pessoa troca o produto com o desafio aberto, a
 * cena troca junto.
 *
 * O servidor (agro-lead) exige antibot_captcha === true. Aqui esse campo quer dizer "a
 * verificação humana passou": pelo caminho invisível ou pelo desafio. antibot_mode diz qual dos
 * dois ('invisible' | 'challenge'), para o servidor poder distinguir quando quiser.
 *
 * Interface usada por agro-form.js: window.Antibot.protect(form) e
 * window.Antibot.validate(form) -> Promise<campos para o payload>, rejeita com texto para a pessoa.
 * Os textos vêm de window.__i18n (agro-form.js define, em PT ou EN), com inglês de reserva.
 */
(function () {
  'use strict';

  var MIN_MS = 3000;            // igual ao servidor (caminho com desafio)
  var INVISIBLE_MIN_MS = 5000;  // o caminho invisível exige mais tempo no formulário (igual ao servidor)
  var MAX_MS = 5 * 60 * 1000;   // igual ao servidor

  function t(key, fallback) {
    if (window.__i18n && typeof window.__i18n.t === 'function') {
      return window.__i18n.t(key, fallback);
    }
    return fallback;
  }

  // ── 1. Honeypot ─────────────────────────────────────────────────────────────
  // Fora da tela (style.css .antibot-hp), nunca display:none: um campo escondido desse jeito é
  // justamente o que um robô aprende a pular.
  function injectHoneypot(form) {
    if (form.querySelector('.antibot-hp')) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'antibot-hp';
    wrapper.setAttribute('aria-hidden', 'true');
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'website_url';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  }

  // ── 2. Tempo e sinais de uma pessoa ─────────────────────────────────────────
  function watch(form) {
    function mark() {
      if (!form.dataset.antibotTs) form.dataset.antibotTs = String(Date.now());
      form.dataset.antibotHuman = '1';
    }
    ['focusin', 'input', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      form.addEventListener(ev, mark, { passive: true });
    });
  }

  function risk(form) {
    if (navigator.webdriver) return true;
    if (!form.dataset.antibotHuman) return true;
    var ts = parseInt(form.dataset.antibotTs || '0', 10);
    var elapsed = Date.now() - ts;
    if (!ts || elapsed < INVISIBLE_MIN_MS) return true;
    if (elapsed > MAX_MS) {
      // Um carimbo velho o servidor recusa. Recomeça a contagem; o desafio cobre o tempo mínimo.
      form.dataset.antibotTs = String(Date.now());
      return true;
    }
    return false;
  }

  // ── 3. Prova de trabalho (SHA-256 via crypto.subtle) ────────────────────────
  function hex(buf) {
    var arr = new Uint8Array(buf), out = '';
    for (var i = 0; i < arr.length; i++) out += ('0' + arr[i].toString(16)).slice(-2);
    return out;
  }

  function sha256(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(hex);
  }

  /** Acha N tal que SHA-256(nonce + ':' + N) começa com '0000'. Cede a vez ao navegador a cada lote. */
  function solvePoW(nonce) {
    return new Promise(function (resolve, reject) {
      var counter = 0, size = 500;
      function batch() {
        var ps = [];
        for (var i = counter; i < counter + size; i++) ps.push(sha256(nonce + ':' + i));
        Promise.all(ps).then(function (hashes) {
          for (var j = 0; j < hashes.length; j++) {
            if (hashes[j].substring(0, 4) === '0000') {
              resolve({ nonce: nonce, solution: counter + j, hash: hashes[j] });
              return;
            }
          }
          counter += size;
          setTimeout(batch, 0);
        }, reject);
      }
      batch();
    });
  }

  function nonce() {
    return Date.now().toString(16) + '_' + Math.random().toString(36).substring(2, 10);
  }

  // ── 4. O desafio (agro-challenge.js) ────────────────────────────────────────
  var LANG = /^en/i.test(document.documentElement.lang || '') ? 'en' : 'pt';

  function variant(form) {
    var sel = form.querySelector('select[name="produto"]');
    var v = sel ? sel.value : form.getAttribute('data-produto');
    return v === 'camara-fria' ? 'camara-fria' : 'irrigacao';
  }

  // Monta a cena num contêiner novo, antes do botão. Trocar de cena troca o contêiner inteiro: o motor
  // observa o tamanho do elemento em que foi montado, e um elemento fora da página não recebe mais nada.
  function mount(form, focus) {
    var box = document.createElement('div');
    var old = form._agroChallengeBox;
    if (old) old.parentNode.replaceChild(box, old);
    else {
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.parentNode.insertBefore(box, btn); else form.appendChild(box);
    }
    form._agroChallengeBox = box;
    form._agroChallengeVariant = variant(form);
    window.AgroChallenge.mount(box, { variant: form._agroChallengeVariant, lang: LANG, focus: focus })
      .then(function () {
        if (form._agroChallengeBox !== box) return;   // cena já trocada
        form._agroChallengeSolved = true;
        // O aviso "falta uma verificação" deixou de valer; o status do desafio já diz "Verificado".
        var err = form.querySelector('.agro-form__err');
        if (err) err.hidden = true;
      });
    if (focus) box.scrollIntoView({ block: 'nearest' });
  }

  function challenge(form) {
    if (form._agroChallengeBox) {   // já aberto: enviar de novo sem resolver leva o foco de volta ao painel
      if (form._agroChallengeBox.nxChallenge) form._agroChallengeBox.nxChallenge.focus();
      return;
    }
    mount(form, true);
    var sel = form.querySelector('select[name="produto"]');
    if (sel) {
      sel.addEventListener('change', function () {
        if (form._agroChallengeSolved || variant(form) === form._agroChallengeVariant) return;
        mount(form, false);   // quem está no seletor continua nele
      });
    }
  }

  // ── 5. Interface pública ────────────────────────────────────────────────────
  function protect(form) {
    if (form.dataset.antibotProtected) return;
    form.dataset.antibotProtected = '1';
    injectHoneypot(form);
    watch(form);
  }

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, Math.max(0, ms)); });
  }

  function validate(form) {
    var hp = form.querySelector('input[name="website_url"]');
    if (hp && hp.value) {
      // Robô: responde "ok" em silêncio; o servidor descarta.
      return Promise.resolve({ website_url: hp.value, antibot_ts: 0, antibot_captcha: false,
        antibot_mode: 'invisible', antibot_pow_nonce: '', antibot_pow_solution: 0, antibot_pow_hash: '' });
    }

    var mode = 'invisible';
    var gate;
    if (form._agroChallengeSolved) {
      mode = 'challenge';
      gate = Promise.resolve();
    } else if (form._agroChallengeBox || risk(form)) {
      // O desafio aparece, a pessoa resolve e envia de novo.
      challenge(form);
      return Promise.reject(t('antibot.error_captcha', 'Please complete the quick check above the button.'));
    } else {
      gate = Promise.resolve();
    }

    var btn = form.querySelector('[type="submit"]');
    var prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = t('antibot.pow_btn', 'Verifying...'); }

    return gate.then(function () {
      var ts = parseInt(form.dataset.antibotTs || String(Date.now()), 10);
      return wait(MIN_MS - (Date.now() - ts)).then(function () {
        return solvePoW(nonce());
      }).then(function (pow) {
        if (btn) btn.textContent = prev;
        return {
          website_url: '',
          antibot_ts: ts,
          antibot_captcha: true,
          antibot_mode: mode,
          antibot_pow_nonce: pow.nonce,
          antibot_pow_solution: pow.solution,
          antibot_pow_hash: pow.hash
        };
      });
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
      throw typeof e === 'string' ? e : t('antibot.error_generic', 'Verification failed. Please try again.');
    });
  }

  window.Antibot = { protect: protect, validate: validate };
})();
