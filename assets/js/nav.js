/* Menu do topo. Nada além disso: o site não tem lógica de layout em tempo de execução nem i18n.
   Os rótulos ficam no HTML (data-label-open / data-label-close, na língua da página), onde um
   rastreador os lê; o JS só alterna entre eles. */
(function () {
  var t = document.getElementById('navToggle');
  var l = document.getElementById('navLinks');
  if (t && l) {
    t.addEventListener('click', function () {
      var open = l.classList.toggle('is-open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      t.setAttribute('aria-label', open ? (t.getAttribute('data-label-close') || 'Fechar menu')
                                         : (t.getAttribute('data-label-open') || 'Abrir menu'));
    });
  }

  // O <details> abre e fecha sozinho no próprio botão, e só isso. Um menu que não fecha ao clicar
  // fora nem com Esc fica preso na frente da página, e é a primeira coisa que alguém tenta.
  var drop = document.getElementById('navDrop');
  if (!drop || !document.addEventListener) return;

  document.addEventListener('click', function (e) {
    if (drop.open && !drop.contains(e.target)) drop.open = false;
  }, false);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    if (!drop.open) return;
    drop.open = false;
    var btn = drop.querySelector('summary');
    // Devolve o foco a quem abriu, senão ele fica num elemento que acabou de sumir.
    if (btn && btn.focus) btn.focus();
  }, false);
})();
