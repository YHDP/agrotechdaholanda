/* Mobile menu. Nothing else — the site has no runtime layout logic and no i18n:
   it is single-language, so labels are in the HTML where a crawler can read them. */
(function () {
  var t = document.getElementById('navToggle');
  var l = document.getElementById('navLinks');
  if (!t || !l) return;
  t.addEventListener('click', function () {
    var open = l.classList.toggle('is-open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
    t.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
})();
