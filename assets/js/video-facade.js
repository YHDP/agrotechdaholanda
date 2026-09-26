/* Vídeo com clique para carregar (notícias, 2026-09-25).
   A página chega com um cartaz nosso, servido deste domínio, cujo botão é um link comum para o vídeo
   no YouTube: sem JS, ele abre o YouTube. Com JS, o link vira um <button>, e só o clique (ou Enter /
   Espaço) troca o cartaz inteiro pelo iframe de www.youtube-nocookie.com, já no segundo certo, e leva
   o foco para o iframe. Antes do clique, nenhuma requisição vai ao YouTube (ver a seção "Vídeo do
   YouTube" da política de privacidade). O frame-src da CSP libera esse domínio só na página da
   notícia. */
(function () {
  var boxes = document.querySelectorAll('[data-video]');
  [].forEach.call(boxes, function (box) {
    var link = box.querySelector('a.video__play');
    var id = box.getAttribute('data-yt') || '';
    if (!link || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    var start = parseInt(box.getAttribute('data-start'), 10) || 0;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = link.className;
    btn.innerHTML = link.innerHTML;   // our own markup, from the generator
    ['data-track', 'aria-describedby'].forEach(function (a) {
      if (link.hasAttribute(a)) btn.setAttribute(a, link.getAttribute(a));
    });
    link.parentNode.replaceChild(btn, link);

    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&start=' + start + '&end=' + (parseInt(start, 10) + 21);
      f.title = box.getAttribute('data-title') || 'YouTube';
      f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      box.classList.add('video__quadro--on');
      box.textContent = '';
      box.appendChild(f);
      f.focus();
    });
  });
})();
