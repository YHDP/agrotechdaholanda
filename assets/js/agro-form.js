/**
 * agro-form.js: formulários do site (ficha técnica e pedido de proposta).
 *
 * Fala com a Edge Function `agro-lead`. O mesmo endpoint atende os dois pedidos;
 * o formulário diz qual através de data-intent, e qual produto através de
 * data-produto (ou de um <select name="produto"> dentro do formulário).
 *
 * Idioma: vem de <html lang>. Começa com "en" → inglês, qualquer outra coisa →
 * português. A função recebe o mesmo valor e responde e manda o e-mail nele.
 *
 * Por que existe como arquivo e não como script inline: a política de segurança
 * das páginas é script-src 'self', sem 'unsafe-inline'. Um handler inline seria
 * silenciosamente bloqueado pelo navegador.
 *
 * O sucesso acontece no lugar, sem trocar de página: quem pediu a ficha recebe os
 * links ali mesmo, além do e-mail. Se o envio de e-mail ainda não estiver ligado,
 * os links continuam aparecendo, porque a função os devolve na resposta.
 *
 * Na página inicial os dois formulários dividem um painel com um seletor em cima
 * (.form-toggle, dois cartões de escolha): só um aparece por vez. Ver initToggle, no fim deste arquivo.
 *
 * Pedido de proposta: os campos vêm de proposal-fields.json (o gerador do site), a mesma lista do
 * modelo de resposta da função. Os essenciais são obrigatórios; os opcionais ficam num <fieldset
 * data-mais> que só aparece depois que os essenciais estão preenchidos (initMais). Na página inicial
 * o <select name="produto"> decide quais linhas aparecem (data-produtos); linha escondida fica
 * desabilitada, nunca é obrigatória e nunca é enviada.
 *
 * Mapa da fazenda (campo de arquivo, desde a v10 da função): até 3 arquivos KML, KMZ, JPG, PNG ou
 * PDF. No envio, cada arquivo é lido com FileReader e vai em `anexos` ([{name, type, data}], data em
 * base64) no mesmo JSON, só quando há arquivo. Foto JPG/PNG acima de 2 MB é reduzida num canvas para
 * JPEG de até 2 MB; outro arquivo acima de 5 MB, ou mais de 3 arquivos, é recusado aqui com mensagem
 * própria. Sem pré-visualização: a CSP não tem blob:, e createImageBitmap lê o arquivo sem URL. A
 * função confere tudo de novo (tipo pelo conteúdo, tamanho, quantidade); esta checagem só poupa a
 * pessoa de esperar um envio que seria recusado.
 */
(function () {
  'use strict';

  var FN = 'https://uemspezaqxmkhenimwuf.supabase.co/functions/v1/agro-lead'; // supabase.co edge function
  var CONSENT_VERSION = 'agro-2026-10-03';
  var PRODUTOS = ['irrigacao', 'camara-fria'];
  // 'ambos' (as três fichas de uma vez) só existe no pedido de ficha. No pedido de proposta, o
  // "Os dois" do <select> continua indo como texto dentro de `mensagem`, como antes.
  var PRODUTOS_FICHA = PRODUTOS.concat('ambos');

  var LANG = /^en/i.test(document.documentElement.lang || '') ? 'en' : 'pt';

  // Todo texto visível do formulário, por idioma. Sem travessão.
  var UI = {
    pt: {
      sending: 'Enviando...',
      done: 'Pronto',
      linksIntro: 'Prontas. Os links valem por 14 dias, e também foram para o seu e-mail.',
      linkIntro: 'Pronta. O link vale por 14 dias, e também foi para o seu e-mail.',
      proposalOk: 'Recebemos o seu pedido. Respondemos com uma proposta para a sua área.',
      errEmail: 'Informe um e-mail válido.',
      errConsent: 'É preciso aceitar a Política de Privacidade para continuar.',
      errProduto: 'Escolha o produto para receber a ficha.',
      errRequired: 'Falta preencher: ',
      errSend: 'Não foi possível enviar agora.',
      errRetry: 'Não foi possível enviar agora. Verifique a conexão e tente de novo, ou escreva para info@agrotechdaholanda.com.br.',
      errVerify: 'A verificação falhou. Tente de novo.',
      preparing: 'Preparando arquivos...',
      errFilesMany: 'Envie no máximo 3 arquivos.',
      errFileType: 'Este tipo de arquivo não é aceito: {n}. Envie KML, KMZ, JPG, PNG ou PDF.',
      errFileBig: 'O arquivo {n} passa de 5 MB. Envie um arquivo menor.',
      errFileRead: 'Não foi possível ler o arquivo {n}. Tente de novo ou escolha outro.'
    },
    en: {
      sending: 'Sending...',
      done: 'Done',
      linksIntro: 'Ready. The links are valid for 14 days, and we have also sent them to your e-mail.',
      linkIntro: 'Ready. The link is valid for 14 days, and we have also sent it to your e-mail.',
      proposalOk: 'We received your request. We will reply with a proposal for your area.',
      errEmail: 'Please enter a valid e-mail address.',
      errConsent: 'Please accept the Privacy Policy to continue.',
      errProduto: 'Please choose a product to receive the sheet.',
      errRequired: 'Please fill in: ',
      errSend: 'We could not send this right now.',
      errRetry: 'We could not send this right now. Check your connection and try again, or write to info@agrotechdaholanda.com.br.',
      errVerify: 'Verification failed. Please try again.',
      preparing: 'Preparing files...',
      errFilesMany: 'Please send at most 3 files.',
      errFileType: 'This file type is not accepted: {n}. Please send KML, KMZ, JPG, PNG or PDF.',
      errFileBig: 'The file {n} is over 5 MB. Please send a smaller file.',
      errFileRead: 'We could not read the file {n}. Please try again or choose another file.'
    }
  };
  var T = UI[LANG];

  // antibot.js fala com window.__i18n quando ele existe, e cai no inglês quando não
  // existe. Estas são as chaves que aquele arquivo usa, nos dois idiomas do site. Os textos
  // do desafio em si moram em agro-challenge.js (window.AgroChallenge.strings).
  var ANTIBOT = {
    pt: {
      'antibot.error_captcha': 'Falta uma verificação rápida, logo acima do botão. Depois, envie de novo.',
      'antibot.pow_btn': 'Verificando...',
      'antibot.error_generic': 'A verificação falhou. Tente de novo.'
    },
    en: {
      'antibot.error_captcha': 'One quick check is missing, just above the button. Then send again.',
      'antibot.pow_btn': 'Verifying...',
      'antibot.error_generic': 'Verification failed. Please try again.'
    }
  };
  if (!window.__i18n) {
    var AB = ANTIBOT[LANG];
    window.__i18n = {
      t: function (key, fallback) {
        return Object.prototype.hasOwnProperty.call(AB, key) ? AB[key] : fallback;
      }
    };
  }

  var formSeq = 0;

  // ── Anexos (mapa da fazenda) ─────────────────────────────────────────────────────────────
  // Os mesmos limites da função agro-lead (anexos.ts). Foto acima de FOTO_MAX é reduzida.
  var ANEXO_MAX_FILES = 3;
  var ANEXO_MAX_BYTES = 5 * 1024 * 1024;
  var FOTO_MAX = 2 * 1024 * 1024;
  var ANEXO_EXT = ['kml', 'kmz', 'jpg', 'jpeg', 'png', 'pdf'];

  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }

  function fileError(tpl, name) { var e = new Error(tpl.replace('{n}', name)); e.fileError = true; return e; }

  // base64 de um Blob, sem o prefixo data:...;base64,
  function toBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result || ''); resolve(s.slice(s.indexOf(',') + 1)); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(blob);
    });
  }

  function canvasJpeg(canvas, q) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', q); });
  }

  // Foto grande → JPEG de até FOTO_MAX. Lado maior começa em 2560 px; baixa a qualidade e depois o
  // tamanho até caber. Fundo branco, porque a transparência do PNG vira preto no JPEG.
  function shrinkPhoto(file) {
    if (!window.createImageBitmap) return Promise.reject(new Error('no createImageBitmap'));
    return createImageBitmap(file).then(function (bmp) {
      var side = Math.min(2560, Math.max(bmp.width, bmp.height));
      var steps = [[1, 0.85], [1, 0.72], [0.75, 0.72], [0.56, 0.72], [0.42, 0.7], [0.3, 0.7]];
      function attempt(i) {
        var k = side * steps[i][0] / Math.max(bmp.width, bmp.height);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(bmp.width * k));
        c.height = Math.max(1, Math.round(bmp.height * k));
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(bmp, 0, 0, c.width, c.height);
        return canvasJpeg(c, steps[i][1]).then(function (b) {
          if (b && b.size <= FOTO_MAX) return b;
          if (i + 1 < steps.length) return attempt(i + 1);
          throw new Error('still too big');
        });
      }
      return attempt(0).then(function (b) { if (bmp.close) bmp.close(); return b; });
    });
  }

  // Os arquivos escolhidos nos campos habilitados → [{name, type, data}]. Recusa com mensagem
  // (erro com fileError = true) antes de qualquer envio.
  function readAnexos(form) {
    var files = [];
    [].forEach.call(form.querySelectorAll('input[type="file"]'), function (el) {
      if (el.disabled || !el.files) return;
      for (var i = 0; i < el.files.length; i++) files.push({ file: el.files[i], el: el });
    });
    if (!files.length) return Promise.resolve({ anexos: [] });
    if (files.length > ANEXO_MAX_FILES) return Promise.reject(Object.assign(fileError(T.errFilesMany, ''), { field: files[0].el }));
    return files.reduce(function (chain, f) {
      return chain.then(function (out) {
        var file = f.file;
        var ext = extOf(file.name);
        var fail = function (tpl) { return Object.assign(fileError(tpl, file.name), { field: f.el }); };
        if (ANEXO_EXT.indexOf(ext) === -1) throw fail(T.errFileType);
        var photo = ext === 'jpg' || ext === 'jpeg' || ext === 'png';
        var ready;
        if (photo && file.size > FOTO_MAX) {
          ready = shrinkPhoto(file).then(function (b) {
            return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', blob: b };
          }, function () {
            // Sem canvas ou sem redução possível: segue o original se couber no limite da função.
            if (file.size > ANEXO_MAX_BYTES) throw fail(T.errFileBig);
            return { name: file.name, type: file.type, blob: file };
          });
        } else {
          if (file.size > ANEXO_MAX_BYTES) throw fail(T.errFileBig);
          ready = Promise.resolve({ name: file.name, type: file.type, blob: file });
        }
        return ready.then(function (r) {
          return toBase64(r.blob).then(function (data) {
            out.push({ name: r.name, type: r.type || '', data: data });
            return out;
          }, function () { throw fail(T.errFileRead); });
        });
      });
    }, Promise.resolve([])).then(function (anexos) { return { anexos: anexos }; });
  }

  // Os campos obrigatórios que a pessoa vê agora (e-mail, produto, essenciais). A caixa de
  // consentimento fica de fora: ela vem depois do botão dos opcionais.
  function requiredNow(form) {
    return [].filter.call(form.querySelectorAll('.agro-form__field [required]'), function (el) {
      return !el.disabled && !el.closest('[data-produtos][hidden]');
    });
  }

  // O primeiro obrigatório inválido. Um opcional escondido nunca conta: nenhum é obrigatório.
  function firstMissing(form) {
    var req = requiredNow(form);
    for (var i = 0; i < req.length; i++) {
      if (req[i].name === 'email') continue;           // o e-mail tem mensagem própria
      if (!(req[i].value || '').trim() || !req[i].checkValidity()) return req[i];
    }
    return null;
  }

  // ── Essenciais primeiro, opcionais depois (pedido de proposta) ──────────────────────────────
  // Sem JS o <fieldset data-mais> aparece inteiro e o botão fica escondido. Com JS o fieldset some,
  // e o botão "+ Adicionar detalhes" aparece quando todos os obrigatórios visíveis são válidos, com
  // um aviso único numa região aria-live. O botão abre e fecha o fieldset (aria-expanded) sem mover o
  // foco. Depois de aparecer, o botão fica, mesmo que a pessoa apague um essencial.
  // Na página inicial, trocar o produto mostra só as linhas daquele produto e desabilita as outras.
  function initMais(form) {
    var box = form.querySelector('[data-mais]');
    var btn = form.querySelector('[data-mais-btn]');
    var live = form.querySelector('[data-mais-live]');
    var sel = form.querySelector('select[name="produto"]');
    var rows = [].slice.call(form.querySelectorAll('[data-produtos]'));

    function applyProduto() {
      var p = sel ? sel.value : '';
      rows.forEach(function (row) {
        var on = !!p && row.getAttribute('data-produtos').split(' ').indexOf(p) !== -1;
        row.hidden = !on;
        [].forEach.call(row.querySelectorAll('input, select, textarea'), function (c) { c.disabled = !on; });
      });
    }

    if (sel && rows.length) {
      applyProduto();
      // 'input' chega ao <select> antes de subir até o formulário: as linhas do produto já estão
      // no lugar quando check() conta os obrigatórios.
      sel.addEventListener('input', applyProduto);
      sel.addEventListener('change', applyProduto);
    }
    if (!box || !btn) return;

    box.hidden = true;
    var revealed = false;

    function check() {
      if (revealed || !btn) return;
      var req = requiredNow(form);
      if (!req.length || !req.every(function (el) { return (el.value || '').trim() && el.checkValidity(); })) return;
      revealed = true;
      btn.hidden = false;
      if (live) live.textContent = live.getAttribute('data-mais-live');
    }

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      box.hidden = !open;
    });
    form.addEventListener('input', check);
    form.addEventListener('change', check);
    check();
  }

  function initForm(form) {
    var intent = form.getAttribute('data-intent') || 'ficha-tecnica';
    var err = form.querySelector('.agro-form__err');
    var btn = form.querySelector('.agro-form__btn');
    var okBox = form.querySelector('.agro-form__ok');
    var allowed = intent === 'ficha-tecnica' ? PRODUTOS_FICHA : PRODUTOS;

    // aria-describedby precisa de um id no elemento de erro.
    formSeq += 1;
    if (err && !err.id) err.id = 'agro-form-err-' + formSeq;

    if (window.Antibot) window.Antibot.protect(form);

    function produtoValue() {
      var sel = form.querySelector('select[name="produto"]');
      if (sel) return (sel.value || '').trim();
      return (form.getAttribute('data-produto') || '').trim();
    }

    function clearInvalid() {
      [].forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (el) {
        el.removeAttribute('aria-invalid');
        if (err && el.getAttribute('aria-describedby') === err.id) {
          el.removeAttribute('aria-describedby');
        }
      });
    }

    function showErr(msg, field) {
      if (!err) return;
      err.textContent = msg;
      err.hidden = false;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', err.id);
        field.focus();
      }
    }

    function succeed(links) {
      if (btn) { btn.disabled = true; btn.textContent = T.done; }
      [].forEach.call(form.querySelectorAll('.agro-form__field, .agro-form__check, .nx, [data-mais], [data-mais-btn]'),
        function (el) { el.hidden = true; });
      if (err) err.hidden = true;
      if (!okBox) return;
      // Construído com nós do DOM: nome e URL do link entram por textContent e
      // pela propriedade href, nunca por HTML.
      while (okBox.firstChild) okBox.removeChild(okBox.firstChild);
      var p = document.createElement('p');
      if (links && links.length) {
        p.textContent = links.length === 1 ? T.linkIntro : T.linksIntro;
        okBox.appendChild(p);
        var ul = document.createElement('ul');
        links.forEach(function (l) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = l.url;
          a.textContent = l.name;
          a.rel = 'noopener';
          li.appendChild(a);
          ul.appendChild(li);
        });
        okBox.appendChild(ul);
      } else {
        p.textContent = T.proposalOk;
        okBox.appendChild(p);
      }
      okBox.hidden = false;
      okBox.setAttribute('tabindex', '-1');
      okBox.focus();
    }

    initMais(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (err) err.hidden = true;
      clearInvalid();

      var emailEl = form.querySelector('input[name="email"]');
      var email = emailEl ? (emailEl.value || '').trim() : '';
      var pp = form.querySelector('input[name="privacy_policy_accepted"]');
      var produto = produtoValue();
      var produtoSel = form.querySelector('select[name="produto"]');

      if (!email || email.indexOf('@') < 1) {
        showErr(T.errEmail, emailEl);
        return;
      }
      if (produto && allowed.indexOf(produto) === -1) produto = '';
      if (intent === 'ficha-tecnica' && !produto) {
        showErr(T.errProduto, produtoSel);
        return;
      }
      var missing = firstMissing(form);
      if (missing) {
        var ml = missing.id ? form.querySelector('label[for="' + missing.id + '"]') : null;
        showErr(T.errRequired + (ml ? ml.textContent.trim() : missing.name) + '.', missing);
        return;
      }
      if (pp && !pp.checked) {
        showErr(T.errConsent, pp);
        return;
      }

      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = T.sending; }

      // Cada coluna vem do primeiro campo habilitado com aquele name. Campo desabilitado (linha de
      // outro produto na página inicial) nunca conta.
      function val(name) {
        var els = form.querySelectorAll('[name="' + name + '"]');
        for (var i = 0; i < els.length; i++) {
          if (!els[i].disabled) return (els[i].value || '').trim();
        }
        return '';
      }

      // Campos sem coluna própria no servidor (profundidade, tipo de irrigação, tamanho, quem vai
      // ter, e um interesse do <select name="produto"> fora da lista, como "Os dois" ou "Piloto")
      // seguem dentro de `mensagem`, uma linha "Rótulo: valor" cada, para nada do que a pessoa
      // escolheu se perder no caminho. O mesmo vale para o segundo campo de uma coluna já ocupada:
      // com "Os dois", "O que você planta" vai para `cultura` e "O que você colhe" vira uma linha.
      function extras() {
        var lines = [];
        function add(el, value) {
          if (!value) return;
          var lab = el.id ? form.querySelector('label[for="' + el.id + '"]') : null;
          lines.push((lab ? lab.textContent.trim() : el.name) + ': ' + value);
        }
        var taken = {};
        [].forEach.call(form.querySelectorAll('[data-key]'), function (el) {
          // O campo de arquivo segue em `anexos`; o value dele é só "C:\\fakepath\\...".
          if (el.disabled || el.name === 'mensagem' || el.type === 'file') return;
          var v = (el.value || '').trim();
          if (el.hasAttribute('data-extra')) { add(el, v); return; }
          if (taken[el.name]) add(el, v);
          taken[el.name] = true;
        });
        if (produtoSel && produtoSel.value && allowed.indexOf(produtoSel.value) === -1) {
          add(produtoSel, produtoSel.options[produtoSel.selectedIndex].text);
        }
        // O texto livre da pessoa (caixa opcional em todo pedido de proposta) vem depois das
        // linhas acima, separado por uma linha em branco. O maxlength do campo deixa espaço para
        // elas dentro do limite de 4000 caracteres da função.
        var head = lines.join('\n');
        var own = val('mensagem');
        if (!own) return head;
        return head ? head + '\n\n' + own : own;
      }

      function send(antibot, anexos) {
        var payload = {
          email: email,
          intent: intent,
          lang: LANG,
          cultura: val('cultura'),
          area_ha: val('area_ha'),
          fonte_agua: val('fonte_agua'),
          municipio: val('municipio'),
          energia_hoje: val('energia_hoje'),
          mensagem: extras(),
          page_url: window.location.href,
          consent_version: CONSENT_VERSION,
          privacy_policy_accepted: true
        };
        if (produto) payload.produto = produto;
        if (anexos && anexos.length) payload.anexos = anexos;
        if (antibot) {
          for (var k in antibot) {
            if (Object.prototype.hasOwnProperty.call(antibot, k)) payload[k] = antibot[k];
          }
        }
        fetch(FN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (r) {
            if (!r.ok) {
              return r.json().catch(function () { return {}; }).then(function (d) {
                var err = new Error(d.error || T.errSend);
                err.fromServer = true;
                throw err;
              });
            }
            return r.json().catch(function () { return {}; });
          })
          .then(function (data) { succeed(data && data.links); })
          .catch(function (e2) {
            // Only the function's own (translated) messages reach the visitor; a network
            // failure throws the browser's English "Failed to fetch", so it gets T.errRetry.
            showErr((e2 && e2.fromServer && e2.message) || T.errRetry);
            if (btn) { btn.disabled = false; btn.textContent = label; }
          });
      }

      // Arquivos primeiro (pode levar um instante numa foto grande), depois a verificação e o envio.
      var hasFiles = [].some.call(form.querySelectorAll('input[type="file"]'), function (el) {
        return !el.disabled && el.files && el.files.length;
      });
      if (btn && hasFiles) btn.textContent = T.preparing;
      readAnexos(form).then(function (r) {
        if (btn) btn.textContent = T.sending;
        if (window.Antibot) {
          window.Antibot.validate(form).then(function (ab) { send(ab, r.anexos); }).catch(function (m) {
            showErr(typeof m === 'string' ? m : T.errVerify);
            if (btn) { btn.disabled = false; btn.textContent = label; }
          });
        } else {
          send(null, r.anexos);
        }
      }, function (e3) {
        showErr((e3 && e3.fileError && e3.message) || T.errRetry, e3 && e3.field);
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  }

  // ── Seletor entre os dois formulários (página inicial) ──────────────────────
  // Dois botões com aria-pressed num role="group", não um tablist: ativar um lado leva o foco
  // para o primeiro campo do formulário que apareceu, e um tablist manda o foco ficar na aba (as
  // setas trocariam de painel e arrancariam o foco a cada tecla). Botões nativos já funcionam com
  // Enter, Espaço e Tab, sem roving tabindex. Sem JS o seletor fica `hidden` e os dois formulários
  // aparecem um embaixo do outro. Cada formulário continua dono do seu estado (desafio aberto,
  // consentimento marcado, sucesso): trocar de lado só esconde, nunca desmonta nem limpa.
  function initToggle(root) {
    var bar = root.querySelector('.form-toggle');
    if (!bar) return;
    var btns = [].slice.call(bar.querySelectorAll('.form-toggle__btn'));
    var ids = btns.map(function (b) { return b.getAttribute('aria-controls'); });
    var panels = ids.map(function (id) { return document.getElementById(id); });
    if (panels.indexOf(null) !== -1) return;

    function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }

    // O primeiro campo que a pessoa pode usar. Depois de um envio com sucesso os campos somem,
    // e o foco vai para a caixa de confirmação; o honeypot (fora da tela, tabindex -1) nunca.
    function target(panel) {
      var c = panel.querySelectorAll('input, select, textarea, button');
      for (var i = 0; i < c.length; i++) {
        if (c[i].tabIndex >= 0 && !c[i].disabled && visible(c[i])) return c[i];
      }
      var ok = panel.querySelector('.agro-form__ok');
      if (ok && !ok.hidden) return ok;
      panel.setAttribute('tabindex', '-1');
      return panel;
    }

    function show(id, focusEl) {
      var n = ids.indexOf(id);
      if (n === -1) return false;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === n ? 'true' : 'false'); });
      panels.forEach(function (p, i) { p.hidden = i !== n; });
      if (focusEl === 'field') target(panels[n]).focus({ preventScroll: true });
      if (focusEl === 'panel') {
        panels[n].setAttribute('tabindex', '-1');
        panels[n].focus({ preventScroll: true });
      }
      return true;
    }

    function syncHash(id) {
      if (window.location.hash === '#' + id || !window.history.replaceState) return;
      window.history.replaceState(null, '', '#' + id);
    }

    root.classList.add('is-toggled');
    bar.hidden = false;

    // Toque: o foco vai para o painel, não para o campo, senão o teclado do celular abre sozinho e
    // cobre metade do formulário. Mouse e teclado levam o foco direto ao primeiro campo.
    var touched = false;
    btns.forEach(function (b, i) {
      b.addEventListener('pointerdown', function (e) { touched = e.pointerType === 'touch'; });
      b.addEventListener('click', function (e) {
        var viaTouch = touched && e.detail > 0;
        touched = false;
        show(ids[i], viaTouch ? 'panel' : 'field');
        syncHash(ids[i]);
      });
    });

    // Links da página para #proposta ou #ficha (o CTA do piloto, entre outros): trocam o lado
    // antes de rolar. O navegador não rola até um painel escondido, e o hash pode já ser o mesmo
    // (quem voltou para a ficha e clica de novo no CTA), caso em que hashchange nem dispara.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
      if (!a || a.closest('.form-toggle')) return;
      var u;
      try { u = new URL(a.href, window.location.href); } catch (_) { return; }
      if (u.origin !== window.location.origin || u.pathname !== window.location.pathname) return;
      var id = decodeURIComponent(u.hash.slice(1));
      if (ids.indexOf(id) === -1) return;
      e.preventDefault();
      show(id, 'panel');
      if (window.location.hash !== '#' + id && window.history.pushState) {
        window.history.pushState(null, '', '#' + id);
      }
      root.scrollIntoView({ block: 'start' });
      // O Chrome às vezes cancela a rolagem suave longa (da faixa do fim até o topo) e a página
      // fica parada no CTA. Se o bloco não chegou, pula direto.
      setTimeout(function () {
        if (Math.abs(root.getBoundingClientRect().top) > window.innerHeight / 2) {
          root.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
      }, 1600);
    });

    // Voltar/avançar no histórico, ou um hash digitado.
    window.addEventListener('hashchange', function () {
      show(decodeURIComponent(window.location.hash.slice(1)), null);
    });

    // Link direto (/#proposta, ou de outra página): abre o lado certo e rola até o painel inteiro,
    // com o seletor à vista. Qualquer outro hash (#contato, nenhum) fica na ficha técnica.
    var start = decodeURIComponent(window.location.hash.slice(1));
    if (show(start, null)) {
      var go = function () { root.scrollIntoView({ block: 'start' }); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    } else {
      show(ids[0], null);
    }
  }

  function init() {
    [].forEach.call(document.querySelectorAll('.agro-form'), initForm);
    [].forEach.call(document.querySelectorAll('[data-form-toggle]'), initToggle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
