/* Copiar um texto curto para a área de transferência.
 *
 * POR QUE ISTO EXISTE. Um link mailto abre o cliente de e-mail que o navegador conhece. Quem lê
 * e-mail no Gmail dentro de outra aba, no celular da empresa ou em qualquer lugar que o navegador
 * não conhece, clica e não acontece nada de útil. O endereço copiável é o caminho que sempre
 * funciona, e o mailto continua ali para quem o usa.
 *
 * USO. <button class="copy" data-copy="texto" data-track="nome">Copiar</button>
 * Um irmão com [data-copy-status] recebe o aviso para leitores de tela; se não houver, o próprio
 * botão ainda troca de rótulo, que é o retorno visual.
 *
 * Sem dependências e sem estado global. Roda em qualquer página que o carregue.
 */
(function () {
  'use strict';

  var RESET_MS = 2200;

  function fallbackCopy(text) {
    // navigator.clipboard exige contexto seguro e nem todo navegador em uso no campo o tem.
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function announce(btn, msg) {
    var scope = btn.closest ? btn.closest('[data-copy-scope]') : null;
    var el = (scope || document).querySelector('[data-copy-status]');
    if (el) {
      // Limpar primeiro força o leitor de tela a anunciar de novo em cliques repetidos.
      el.textContent = '';
      setTimeout(function () { el.textContent = msg; }, 30);
    }
  }

  function flash(btn, label) {
    var slot = btn.querySelector('[data-copy-label]') || btn;
    if (btn.getAttribute('data-busy') === '1') return;
    var original = slot.textContent;
    btn.setAttribute('data-busy', '1');
    btn.setAttribute('data-done', '1');
    slot.textContent = label;
    setTimeout(function () {
      slot.textContent = original;
      btn.removeAttribute('data-done');
      btn.removeAttribute('data-busy');
    }, RESET_MS);
  }

  function onClick(e) {
    var btn = e.target;
    while (btn && btn !== document.body && !(btn.getAttribute && btn.getAttribute('data-copy'))) {
      btn = btn.parentElement;
    }
    if (!btn || !btn.getAttribute) return;
    var text = btn.getAttribute('data-copy');
    if (!text) return;

    var done = btn.getAttribute('data-copied-label') || 'Copiado';
    var failed = btn.getAttribute('data-failed-label') || 'Selecione e copie';

    function ok() { flash(btn, done); announce(btn, done); }
    function no() { flash(btn, failed); announce(btn, failed); }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () {
        if (fallbackCopy(text)) ok(); else no();
      });
    } else if (fallbackCopy(text)) {
      ok();
    } else {
      no();
    }
  }

  if (document.addEventListener) document.addEventListener('click', onClick, false);
})();
