/* Peregrino's Burger — interação do mouse com os lanches (sem dependências) */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var criar = function (tag, classe) { var el = document.createElement(tag); el.className = classe; return el; };
  var limitar = function (n, min, max) { return Math.min(max, Math.max(min, n)); };
  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MORDIDAS_ATE_RENASCER = 4;

  /* ---------- Camadas: "Pão de brioche@0-40|Queijo@49-61" (em % da altura da foto) ---------- */
  function lerCamadas(li) {
    return (li.getAttribute('data-camadas') || '').split('|').map(function (p) {
      var m = p.match(/^(.+)@(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
      return m ? { nome: m[1].trim(), de: +m[2], ate: +m[3] } : null;
    }).filter(Boolean);
  }
  function camadaEm(camadas, pct) {
    for (var i = 0; i < camadas.length; i++) if (pct >= camadas[i].de && pct < camadas[i].ate) return camadas[i];
    return camadas[camadas.length - 1];
  }

  /* ---------- Mapa de transparência: o mouse só "pega" no lanche, não no espaço vazio da foto ---------- */
  function mapaAlfa(img) {
    if (img._mapa !== undefined) return img._mapa;
    if (!img.complete || !img.naturalWidth) return null;      // ainda carregando: tenta de novo depois
    try {
      var w = 96, h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      img._mapa = { w: w, h: h, d: ctx.getImageData(0, 0, w, h).data };
    } catch (e) {
      img._mapa = null;                                        // aberto direto do arquivo: sem leitura de pixels
    }
    return img._mapa;
  }
  function solido(mapa, fx, fy) {
    if (!mapa) return true;
    var x = limitar(Math.floor(fx * mapa.w), 0, mapa.w - 1), y = limitar(Math.floor(fy * mapa.h), 0, mapa.h - 1);
    return mapa.d[(y * mapa.w + x) * 4 + 3] > 40;
  }

  /* ---------- Lanches do cardápio ---------- */
  function montarLanche(li) {
    var palco = $('.lanche__palco', li);
    var img = palco && $('img', palco);
    if (!img) return;
    var camadas = lerCamadas(li);

    // invólucro: recebe a inclinação 3D; a cópia da foto, o brilho e o rótulo ficam dentro dele
    var foto = criar('div', 'foto');
    foto.style.setProperty('--foto', 'url("' + img.src + '")');
    img.draggable = false;
    img.parentNode.insertBefore(foto, img);
    foto.appendChild(img);

    var camada = new Image();
    camada.className = 'foto__camada';
    camada.alt = '';
    camada.loading = 'lazy';
    camada.draggable = false;
    camada.setAttribute('aria-hidden', 'true');
    camada.src = img.src;
    var luz = criar('span', 'foto__luz');
    var rotulo = criar('span', 'foto__rotulo');
    rotulo.setAttribute('aria-hidden', 'true');
    foto.appendChild(camada);
    foto.appendChild(luz);
    foto.appendChild(rotulo);

    var mordidas = [];
    var ultimo = null, quadro = 0, timerRotulo = 0, indiceToque = -1, nomeAtual = '', larguraRotulo = 0;

    // área da foto sem transformação (a inclinação 3D mexeria nas medidas durante o movimento)
    function caixa() {
      var p = palco.getBoundingClientRect();
      return { x: p.left + palco.clientLeft + foto.offsetLeft, y: p.top + palco.clientTop + foto.offsetTop, w: foto.offsetWidth, h: foto.offsetHeight };
    }

    function mostrarCamada(c, x, y, b) {
      foto.style.setProperty('--y1', c.de + '%');
      foto.style.setProperty('--y2', c.ate + '%');
      foto.classList.add('is-scan');
      if (c.nome !== nomeAtual) { rotulo.textContent = c.nome; nomeAtual = c.nome; larguraRotulo = rotulo.offsetWidth; }
      posicionarRotulo(x + 18, y - 46, b);
    }
    function posicionarRotulo(x, y, b) {
      rotulo.style.setProperty('--cx', limitar(x, -8, b.w - larguraRotulo + 8).toFixed(0) + 'px');
      rotulo.style.setProperty('--cy', Math.max(y, -34).toFixed(0) + 'px');
      rotulo.classList.add('is-on');
    }
    function esconderCamada() {
      foto.classList.remove('is-scan');
      rotulo.classList.remove('is-on');
      nomeAtual = '';
    }

    function sair() {
      ultimo = null;
      foto.classList.remove('is-hover', 'is-mexendo');
      foto.style.setProperty('--rx', '0deg');
      foto.style.setProperty('--ry', '0deg');
      foto.style.setProperty('--s', '1');
      esconderCamada();
    }

    function aplicar() {
      quadro = 0;
      var e = ultimo;
      if (!e) return;
      var b = caixa();
      var fx = (e.clientX - b.x) / b.w, fy = (e.clientY - b.y) / b.h;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) { sair(); return; }

      foto.classList.add('is-hover', 'is-mexendo');
      foto.style.setProperty('--gx', (fx * 100).toFixed(0) + '%');
      foto.style.setProperty('--gy', (fy * 100).toFixed(0) + '%');
      if (!reduzMovimento) {
        foto.style.setProperty('--rx', ((0.5 - fy) * 12).toFixed(1) + 'deg');
        foto.style.setProperty('--ry', ((fx - 0.5) * 14).toFixed(1) + 'deg');
        foto.style.setProperty('--s', '1.05');
      }
      if (camadas.length && solido(mapaAlfa(img), fx, fy)) {
        mostrarCamada(camadaEm(camadas, fy * 100), fx * b.w, fy * b.h, b);
      } else {
        esconderCamada();
      }
    }

    palco.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      ultimo = e;
      if (!quadro) quadro = requestAnimationFrame(aplicar);
    });
    palco.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      if (quadro) { cancelAnimationFrame(quadro); quadro = 0; }
      sair();
    });

    /* Clique: uma mordida, sempre pela lateral. Depois de algumas, o lanche renasce. */
    function morder(fx, fy, b) {
      var direita = fx >= 0.5;
      var cx = direita ? 97 : 3;
      var cy = limitar(fy * 100, 10, 90);
      var r = 0.15 * b.w;                                      // raio da mordida, em px
      var buraco = function (x, y, raio) {
        return 'radial-gradient(ellipse ' + (raio / b.w * 100).toFixed(2) + '% ' + (raio / b.h * 100).toFixed(2) + '% at ' +
          x.toFixed(2) + '% ' + y.toFixed(2) + '%, transparent 93%, #000 100%)';
      };
      mordidas.push(buraco(cx, cy, r));
      var para_dentro = direita ? Math.PI : 0;
      [-0.95, -0.32, 0.32, 0.95].forEach(function (a) {       // as "ondinhas" da mordida
        mordidas.push(buraco(cx + Math.cos(para_dentro + a) * r / b.w * 100, cy + Math.sin(para_dentro + a) * r / b.h * 100, r * 0.38));
      });
      foto.style.setProperty('--mordidas', mordidas.join(','));

      if (!reduzMovimento) {
        for (var i = 0; i < 7; i++) {
          var m = criar('span', 'migalha');
          m.style.left = (cx / 100 * b.w - 3) + 'px';
          m.style.top = (cy / 100 * b.h - 3) + 'px';
          m.style.setProperty('--dx', ((direita ? 1 : -1) * (14 + Math.random() * 46)).toFixed(0) + 'px');
          m.style.setProperty('--dy', (-18 + Math.random() * 78).toFixed(0) + 'px');
          foto.appendChild(m);
          setTimeout(function (el) { el.remove(); }, 700, m);
        }
        foto.classList.remove('is-mordida');
        void foto.offsetWidth;                                 // reinicia a animação
        foto.classList.add('is-mordida');
      }

      if (mordidas.length >= MORDIDAS_ATE_RENASCER * 5) setTimeout(renascer, 650);
    }

    function renascer() {
      mordidas = [];
      foto.style.removeProperty('--mordidas');
      foto.classList.add('is-volta');
      setTimeout(function () { foto.classList.remove('is-volta'); }, 700);
      // convida a pedir
      var b = caixa();
      foto.classList.remove('is-scan');
      nomeAtual = '';
      rotulo.textContent = 'Deu fome? Adicione ao pedido';
      larguraRotulo = rotulo.offsetWidth;
      posicionarRotulo((b.w - larguraRotulo) / 2, b.h * 0.34, b);
      clearTimeout(timerRotulo);
      timerRotulo = setTimeout(function () { rotulo.classList.remove('is-on'); }, 3200);
      li.classList.add('is-chama');
      setTimeout(function () { li.classList.remove('is-chama'); }, 2200);
    }

    /* Toque: mostra um ingrediente por vez, de cima para baixo */
    function proximaCamada() {
      if (!camadas.length) return;
      indiceToque = (indiceToque + 1) % camadas.length;
      var c = camadas[indiceToque], b = caixa();
      mostrarCamada(c, b.w * 0.18, (c.de + c.ate) / 200 * b.h, b);
      clearTimeout(timerRotulo);
      timerRotulo = setTimeout(esconderCamada, 3200);
    }

    palco.addEventListener('pointerup', function (e) {
      if (e.button > 0) return;
      if (e.pointerType === 'touch') { proximaCamada(); return; }
      var b = caixa();
      var fx = (e.clientX - b.x) / b.w, fy = (e.clientY - b.y) / b.h;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1 || !solido(mapaAlfa(img), fx, fy)) return;
      morder(fx, fy, b);
    });
  }
  $$('.lanche').forEach(montarLanche);

  /* ---------- Início: os lanches seguem o mouse e se abrem em leque ---------- */
  var hero = $('.hero');
  var arte = $('.hero__arte');
  if (hero && arte && !reduzMovimento) {
    var camadasHero = $$('[data-prof]', arte);
    var alvo = null, raf = 0;

    var aplicarHero = function () {
      raf = 0;
      if (!alvo) return;
      var r = arte.getBoundingClientRect();
      var nx = limitar((alvo.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
      var ny = limitar((alvo.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
      camadasHero.forEach(function (el) {
        var d = +el.getAttribute('data-prof') || 0;
        el.style.setProperty('--px', (nx * d).toFixed(1) + 'px');
        el.style.setProperty('--py', (ny * d * 0.7).toFixed(1) + 'px');
      });
      arte.style.setProperty('--lx', (50 + nx * 30).toFixed(0) + '%');
      arte.style.setProperty('--ly', (50 + ny * 24).toFixed(0) + '%');
    };
    var repouso = function () {
      alvo = null;
      camadasHero.forEach(function (el) { el.style.setProperty('--px', '0px'); el.style.setProperty('--py', '0px'); });
      arte.style.setProperty('--lx', '50%');
      arte.style.setProperty('--ly', '50%');
      arte.classList.remove('is-aberto');
    };

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      alvo = e;
      if (!raf) raf = requestAnimationFrame(aplicarHero);
    });
    hero.addEventListener('pointerleave', repouso);
    arte.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') arte.classList.add('is-aberto'); });
    arte.addEventListener('pointerleave', function () { arte.classList.remove('is-aberto'); });
  }
})();
