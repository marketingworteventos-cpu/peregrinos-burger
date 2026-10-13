/* Peregrino's Burger — interações do site (sem dependências) */
(function () {
  'use strict';

  window.__peregrinoReady = true;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Dados da loja (se mudar, atualize também o texto do site e o JSON-LD) ---------- */
  var TELEFONE = '5511972796660';   // WhatsApp com DDI + DDD
  var ABRE = 18, FECHA = 22;        // domingo, em horas (horário de São Paulo)
  var ULTIMA_RETIRADA = 21.5;       // última retirada às 21h30
  var MAX_POR_ITEM = 20;
  var CHAVE = 'peregrinos-burger:pedido';

  /* ---------- Cabeçalho: fundo ao rolar ---------- */
  var header = $('[data-header]');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var burger = $('[data-burger]');
  var nav = $('[data-nav]');
  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('modal-aberto', open);
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 921px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------- Link ativo no menu ---------- */
  var navLinks = $$('.nav__lista a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var secoes = navLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(function (s) { ioNav.observe(s); });
  }

  /* ---------- Revelar ao rolar ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Ano no rodapé ---------- */
  var ano = $('[data-ano]');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ---------- Hora e data em São Paulo (a loja abre no horário de lá, onde quer que o visitante esteja) ---------- */
  var DIAS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function agoraSP() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { dia: DIAS[p.weekday], ano: +p.year, mes: +p.month, d: +p.day, min: (+p.hour % 24) * 60 + (+p.minute) };
    } catch (e) {
      var n = new Date();
      return { dia: n.getDay(), ano: n.getFullYear(), mes: n.getMonth() + 1, d: n.getDate(), min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var hLabel = function (min) { var h = Math.floor(min / 60), m = min % 60; return h + 'h' + (m ? pad(m) : ''); };

  /* ---------- "Aberto agora" ---------- */
  var chips = $$('[data-status]');
  function atualizarStatus() {
    var n = agoraSP();
    var tipo, texto;
    if (n.dia === 0 && n.min >= ABRE * 60 && n.min < FECHA * 60) { tipo = 'aberto'; texto = 'Aberto agora · fecha às ' + FECHA + 'h'; }
    else if (n.dia === 0 && n.min < ABRE * 60) { tipo = 'hoje'; texto = 'Abre hoje às ' + ABRE + 'h'; }
    else { tipo = 'fechado'; texto = 'Fechado agora · abre domingo às ' + ABRE + 'h'; }
    chips.forEach(function (c) {
      c.hidden = false;
      c.classList.remove('is-aberto', 'is-hoje', 'is-fechado');
      c.classList.add('is-' + tipo);
      $('[data-status-texto]', c).textContent = texto;
    });
  }
  if (chips.length) { atualizarStatus(); setInterval(atualizarStatus, 60000); }

  /* ---------- Cardápio: preços lidos do próprio HTML ---------- */
  var brl = function (v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
  var semNbsp = function (s) { return s.replace(/ /g, ' '); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var lerPreco = function (txt) { return parseFloat(txt.replace(/[^\d,]/g, '').replace(',', '.')); };

  var itens = {};
  var ordem = [];
  $$('[data-item]').forEach(function (el) {
    var id = el.getAttribute('data-id');
    var p = $('.js-preco', el);
    var preco = p ? lerPreco(p.textContent) : NaN;
    if (!id || isNaN(preco)) return;
    itens[id] = { id: id, nome: el.getAttribute('data-nome') || id, tipo: el.getAttribute('data-tipo'), preco: preco, el: el };
    ordem.push(id);
  });

  var minLanche = Math.min.apply(null, ordem.filter(function (id) { return itens[id].tipo === 'lanche'; }).map(function (id) { return itens[id].preco; }));
  if (isFinite(minLanche)) $$('[data-preco-min]').forEach(function (el) { el.textContent = brl(minLanche); });

  /* ---------- Pedido ---------- */
  var qtd = {};
  var barra = $('[data-barra]');
  var dlg = $('[data-gaveta]');
  var form = $('[data-form]');
  if (!barra || !dlg || !form || !ordem.length) return;

  var elVazio = $('[data-vazio]');
  var elLinhas = $('[data-linhas]');
  var elListaCab = $('[data-lista-cab]');
  var elDados = $('[data-dados]');
  var elRodape = $('[data-rodape]');
  var elTotal = $('[data-total]');
  var campoNome = $('#pedido-nome');
  var campoHora = $('#pedido-hora');
  var campoObs = $('#pedido-obs');
  var aviso = $('[data-aviso]');

  function carregar() {
    try {
      var o = JSON.parse(localStorage.getItem(CHAVE) || '{}');
      ordem.forEach(function (id) {
        var n = parseInt(o.q && o.q[id], 10);
        if (n > 0) qtd[id] = Math.min(n, MAX_POR_ITEM);
      });
      if (typeof o.nome === 'string') campoNome.value = o.nome.slice(0, 60);
    } catch (e) { /* sem armazenamento: o site funciona do mesmo jeito */ }
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify({ q: qtd, nome: campoNome.value })); } catch (e) { /* ignorar */ }
  }

  function stepperHTML(id, oculto) {
    var nome = esc(itens[id].nome);
    return '<div class="stepper" role="group" aria-label="Quantidade de ' + nome + '"' + (oculto ? ' hidden' : '') + '>' +
      '<button type="button" data-acao="menos" data-id="' + id + '" aria-label="Tirar um ' + nome + '"><svg class="ico" aria-hidden="true"><use href="#ico-menos"/></svg></button>' +
      '<output>1</output>' +
      '<button type="button" data-acao="mais" data-id="' + id + '" aria-label="Adicionar mais um ' + nome + '"><svg class="ico" aria-hidden="true"><use href="#ico-mais"/></svg></button>' +
      '</div>';
  }

  function montarControles() {
    ordem.forEach(function (id) {
      var it = itens[id];
      var box = $('[data-controles]', it.el);
      if (!box) return;
      var nome = esc(it.nome);
      var add = it.tipo === 'bebida'
        ? '<button class="btn-icone" type="button" data-acao="mais" data-id="' + id + '" aria-label="Adicionar ' + nome + ' ao pedido"><svg class="ico" aria-hidden="true"><use href="#ico-mais"/></svg></button>'
        : '<button class="btn btn--contorno btn--pequeno" type="button" data-acao="mais" data-id="' + id + '" aria-label="Adicionar ' + nome + ' ao pedido"><span><svg class="ico" aria-hidden="true"><use href="#ico-mais"/></svg> Adicionar</span></button>';
      box.innerHTML = add + stepperHTML(id, true);
      it.add = box.firstElementChild;
      it.stepper = box.lastElementChild;
      it.out = $('output', it.stepper);
      it.mais = $('[data-acao="mais"]', it.stepper);
    });
  }

  function totais() {
    var q = 0, t = 0;
    ordem.forEach(function (id) { var n = qtd[id] || 0; q += n; t += n * itens[id].preco; });
    return { q: q, t: t };
  }

  function renderGaveta(t) {
    var vazio = t.q === 0;
    elVazio.hidden = !vazio;
    elLinhas.hidden = vazio;
    elListaCab.hidden = vazio;
    elDados.hidden = vazio;
    elRodape.hidden = vazio;
    elTotal.textContent = brl(t.t);
    if (!dlg.open) return;

    // guarda qual botão tinha o foco para devolvê-lo depois de redesenhar a lista
    var foco = document.activeElement;
    var guardado = foco && elLinhas.contains(foco) ? { id: foco.getAttribute('data-id'), acao: foco.getAttribute('data-acao') } : null;

    elLinhas.innerHTML = ordem.filter(function (id) { return qtd[id] > 0; }).map(function (id) {
      var it = itens[id], n = qtd[id];
      return '<li data-id="' + id + '"><span class="linha__nome">' + esc(it.nome) + '</span>' +
        '<span class="linha__preco">' + n + ' × ' + brl(it.preco) + ' = ' + brl(n * it.preco) + '</span>' +
        stepperHTML(id, false).replace('<output>1</output>', '<output>' + n + '</output>') + '</li>';
    }).join('');

    if (guardado) {
      var alvo = $('[data-id="' + guardado.id + '"][data-acao="' + guardado.acao + '"]', elLinhas) || $('[data-acao="mais"]', elLinhas) || (vazio ? $('[data-fechar]', elVazio) : campoNome);
      if (alvo) alvo.focus();
    }
  }

  function renderizar() {
    ordem.forEach(function (id) {
      var it = itens[id], n = qtd[id] || 0;
      if (!it.add) return;
      it.add.hidden = n > 0;
      it.stepper.hidden = n === 0;
      it.out.textContent = n;
      it.mais.disabled = n >= MAX_POR_ITEM;
    });
    var t = totais();
    barra.hidden = t.q === 0 || dlg.open;
    $('[data-barra-qtd]').textContent = t.q;
    $('[data-barra-itens]').textContent = t.q + (t.q === 1 ? ' item' : ' itens');
    $('[data-barra-total]').textContent = brl(t.t);
    renderGaveta(t);
  }

  function anunciar(msg) {
    aviso.textContent = '';
    setTimeout(function () { aviso.textContent = msg; }, 60);
  }

  function mudar(id, n) {
    n = Math.max(0, Math.min(MAX_POR_ITEM, n));
    if (n === (qtd[id] || 0)) return;
    if (n === 0) delete qtd[id]; else qtd[id] = n;
    salvar();
    renderizar();
    var t = totais();
    anunciar(n === 0
      ? itens[id].nome + ' removido do pedido. Total ' + brl(t.t) + '.'
      : n + ' × ' + itens[id].nome + ' no pedido. Total ' + brl(t.t) + '.');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-acao]');
    if (!b) return;
    var id = b.getAttribute('data-id');
    if (!itens[id]) return;
    var tinhaFoco = document.activeElement === b;
    var n = (qtd[id] || 0) + (b.getAttribute('data-acao') === 'mais' ? 1 : -1);
    mudar(id, n);
    // o botão "Adicionar" some quando entra o contador (e vice-versa): leva o foco junto
    var it = itens[id];
    if (tinhaFoco && it.add && !dlg.contains(b)) {
      var alvo = (qtd[id] || 0) > 0 ? it.mais : it.add;
      if (alvo && !alvo.disabled) alvo.focus();
    }
  });

  /* Retirada: próximo domingo, em intervalos de 30 minutos */
  function dataRetirada() {
    var n = agoraSP();
    var slots = [];
    for (var m = ABRE * 60; m <= ULTIMA_RETIRADA * 60; m += 30) slots.push(m);
    var falta = (7 - n.dia) % 7;
    var hoje = false;
    if (falta === 0) {
      var livres = slots.filter(function (m) { return m >= n.min + 30; });   // ao menos 30 min de antecedência
      if (livres.length) { slots = livres; hoje = true; } else { falta = 7; }
    }
    var d = new Date(Date.UTC(n.ano, n.mes - 1, n.d + falta));
    return { slots: slots, hoje: hoje, rotulo: 'domingo, ' + pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) };
  }

  function preencherRetirada() {
    var r = dataRetirada();
    var anterior = campoHora.value;
    campoHora.innerHTML = '<option value="">Escolha o horário</option>' + r.slots.map(function (m) {
      return '<option value="' + m + '">' + hLabel(m) + '</option>';
    }).join('');
    if (anterior && r.slots.indexOf(+anterior) !== -1) campoHora.value = anterior;
    $('[data-retirada-dia]').textContent = '· ' + (r.hoje ? 'hoje, ' : '') + r.rotulo;
    return r;
  }

  /* Janela do pedido */
  function abrir() {
    preencherRetirada();
    erro('nome', false); erro('hora', false);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('modal-aberto');
    renderizar();
  }
  function fechar() {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  dlg.addEventListener('close', function () {
    document.body.classList.remove('modal-aberto');
    renderizar();
    if (!barra.hidden) $('[data-abrir-pedido]').focus();
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) fechar(); });
  $('[data-abrir-pedido]').addEventListener('click', abrir);
  $$('[data-fechar]').forEach(function (b) { b.addEventListener('click', fechar); });
  $('[data-limpar]').addEventListener('click', function () {
    qtd = {};
    salvar();
    renderizar();
    anunciar('Pedido limpo.');
  });
  campoNome.addEventListener('input', function () { salvar(); if (campoNome.value.trim().length >= 2) erro('nome', false); });
  campoHora.addEventListener('change', function () { if (campoHora.value) erro('hora', false); });

  function erro(campo, mostrar) {
    var msg = $('[data-erro="' + campo + '"]');
    var input = campo === 'nome' ? campoNome : campoHora;
    msg.hidden = !mostrar;
    if (mostrar) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function montarMensagem(nome, hora, obs) {
    var t = totais();
    var r = dataRetirada();
    var l = ["Olá, Peregrino's Burger! Quero fazer um pedido para retirada no local.", '', '*Pedido*'];
    ordem.forEach(function (id) {
      var n = qtd[id];
      if (n) l.push('• ' + n + 'x ' + itens[id].nome + ' — ' + semNbsp(brl(n * itens[id].preco)));
    });
    l.push('', '*Total: ' + semNbsp(brl(t.t)) + '*', '');
    l.push('*Nome:* ' + nome);
    l.push('*Retirada:* ' + (r.hoje ? 'hoje, ' : '') + r.rotulo + ', às ' + hLabel(+hora));
    if (obs) l.push('*Observações:* ' + obs);
    return l.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!totais().q) return;
    var nome = campoNome.value.trim();
    var hora = campoHora.value;
    var obs = campoObs.value.trim();
    var semNome = nome.length < 2, semHora = !hora;
    erro('nome', semNome);
    erro('hora', semHora);
    if (semNome) { campoNome.focus(); return; }
    if (semHora) { campoHora.focus(); return; }

    var link = document.createElement('a');
    link.href = 'https://wa.me/' + TELEFONE + '?text=' + encodeURIComponent(montarMensagem(nome, hora, obs));
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    salvar();
  });

  carregar();
  montarControles();
  renderizar();
})();
