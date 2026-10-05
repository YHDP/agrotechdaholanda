/* Calculadora de retorno (calculadora.html). The arithmetic lives in calc-core.js (AgroCalc.calcular),
   shared with the home mini calculator and, ported, with the agro-lead report; this file only reads the
   inputs, fills the defaults and draws the result. The result follows lab calc-resultado r2, c6 (Yvo
   04-10-2026): one dark card whose title is ALWAYS the combined potential payback, marked as an
   estimate; the strongest argument (harvest, fuel, or the grid) only sets the kicker, the row order and
   the star. The e-mail gate below it is a generated agro-form (intent "calculo"); window.AgroCalcPayload
   hands it the answers, and the server recomputes everything itself. */
(function () {
  var C = window.AgroCalc, K = C.K;
  var $ = function (id) { return document.getElementById(id); };
  var fmtR = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  var NOMES = { soja: 'soja', milho: 'milho', feijao: 'feijão', arroz: 'arroz', cafe: 'café', cana: 'cana', manga: 'manga',
                uva: 'uva', melao: 'melão', banana: 'banana', hortalicas: 'hortaliças', cacau: 'cacau', acai: 'açaí', outro: 'lavoura' };
  var ENERGIA = { diesel: 'o diesel', gasolina: 'a gasolina', rede: 'a conta de luz' };
  var state = { fonte: 'poco', energia: 'diesel', irrigado: false, consumoUnit: 'litros' };

  var ha = $('ha'), haNum = $('haNum'), cultura = $('cultura');
  var diesel = $('diesel'), dieselNum = $('dieselNum'), gasolina = $('gasolina'), gasolinaNum = $('gasolinaNum');
  var tarifa = $('tarifa'), tarifaNum = $('tarifaNum'), imposto = $('imposto'), desconto = $('desconto');
  var lamina = $('lamina'), head = $('head'), eta = $('eta'), etaMotor = $('etaMotor'), cec = $('cec'), consumo = $('consumo');
  var semKg = $('semKg'), comKg = $('comKg'), precoKg = $('precoKg');

  function num(el, dflt) { var v = parseFloat(String(el.value).replace(',', '.')); return isNaN(v) ? dflt : v; }
  function rangeFill(el) { var min = +el.min, max = +el.max, v = +el.value; el.style.setProperty('--pct', ((v - min) / (max - min)) * 100 + '%'); }
  function anos(p) {
    if (!isFinite(p) || p <= 0) return '–';
    if (p > K.LIFE_YEARS) return 'mais de ' + K.LIFE_YEARS + ' anos';
    if (p < 1) return 'menos de 1 ano';
    return 'cerca de ' + fmt1.format(p) + (p < 2 ? ' ano' : ' anos');
  }

  /* The answers, in the shape calcular() and the agro-lead report both take. */
  function respostas() {
    var rede = state.energia === 'rede', gas = state.energia === 'gasolina';
    return {
      ha: Math.max(0, num(haNum, K.HA.padrao)), cultura: cultura.value, fonte: state.fonte, energia: state.energia,
      irrigado: state.irrigado,
      preco: gas ? (num(gasolinaNum, K.GASOLINA) || K.GASOLINA) : (num(dieselNum, K.DIESEL) || K.DIESEL),
      tarifa: num(tarifaNum, K.TARIFA) || K.TARIFA, imposto: imposto.value, desconto: desconto.value,
      lamina: num(lamina, K.LAMINA[cultura.value] || 600), head: num(head, K.HEAD[state.fonte]),
      eta: num(eta, K.ETA) || K.ETA, etaMotor: num(etaMotor, K.ETA_MOTOR) || K.ETA_MOTOR,
      cec: num(cec, gas ? K.CEC_GASOLINA : K.CEC), consumo: num(consumo, 0), consumoUnit: state.consumoUnit,
      semKg: num(semKg, 0), comKg: num(comKg, 0), precoKg: num(precoKg, 0), rede: rede
    };
  }
  window.AgroCalcPayload = function () { var q = respostas(); delete q.rede; return q; };

  function preencherColheita() {
    var d = C.padroesColheita(cultura.value, state.irrigado);
    semKg.value = d.semKg || ''; comKg.value = d.comKg || ''; precoKg.value = d.precoKg || '';
    var fonte = (K.GANHO_FONTE || {})[state.irrigado ? cultura.value + '_manejo' : cultura.value];
    var temPadrao = d.comKg > d.semKg;
    $('colheitaHint').textContent = temPadrao && fonte ? fonte
      : (state.irrigado ? 'Área já irrigada: o ganho é só o que o manejo pelo solo acrescenta. Ajuste com os seus números.'
                        : 'Sem número de referência para esta cultura: preencha com a sua produtividade e o seu preço.');
  }

  function linhaEnergia(r) {
    var nome = { diesel: 'diesel', gasolina: 'gasolina', rede: 'luz' }[state.energia];
    if (!state.irrigado) return state.energia === 'rede' ? 'Comparado a irrigar na rede, por ano' : 'Comparado a irrigar a ' + nome + ', por ano';
    return state.energia === 'rede' ? 'Conta de luz que deixa de pagar, por ano' : 'Sem ' + nome + ', por ano';
  }

  function compute() {
    var q = respostas(), r = C.calcular(q);
    render(q, r);
  }

  function render(q, r) {
    var tag = $('estTag');
    tag.textContent = r.exato ? 'Estimativa com o seu consumo' : 'Estimativa';
    $('rKicker').textContent = r.argumento === 'colheita' ? 'O que mais pesa: a colheita'
      : r.argumento === 'rede' ? 'Na rede, o sol é para irrigar sem esperar a distribuidora'
      : 'O que mais pesa: ' + ENERGIA[state.energia];
    $('rTitle').textContent = anos(r.payback);
    $('rSub').textContent = r.colheita
      ? fmtR.format(r.total) + ' por ano: ' + fmtR.format(r.ganhoVal) + ' de colheita a mais e ' + fmtR.format(r.economia) + ' em energia.'
      : fmtR.format(r.economia) + ' por ano em energia.';
    var tot = Math.max(r.total, 1), mostraBarra = r.colheita && r.argumento !== 'rede';
    $('rBar').hidden = !mostraBarra;
    $('barE').style.width = (100 * r.economia / tot) + '%';
    $('barC').style.width = (100 * r.ganhoVal / tot) + '%';

    var linhas = [];
    var eRow = [r.argumento !== 'colheita', linhaEnergia(r), fmtR.format(r.economia)];
    if (r.colheita) {
      var cRow = [r.argumento === 'colheita', 'Colheita a mais, por ano (' + fmtN.format(r.ganhoKg) + ' kg)', fmtR.format(r.ganhoVal)];
      linhas = r.argumento === 'colheita' ? [cRow, eRow] : [eRow, cRow];
    } else linhas = [eRow];
    var tb = $('rRows');
    while (tb.firstChild) tb.removeChild(tb.firstChild);
    function tr(cls, a, b) {
      var t = document.createElement('tr'); if (cls) t.className = cls;
      var x = document.createElement('td'); x.textContent = a; var y = document.createElement('td'); y.textContent = b;
      t.appendChild(x); t.appendChild(y); tb.appendChild(t);
    }
    linhas.forEach(function (l) { tr(l[0] ? 'win' : '', l[1], l[2]); });
    if (r.colheita) tr('sum', 'Total por ano', fmtR.format(r.total));
    tr('tot', 'Tempo de retorno potencial', anos(r.payback));

    var nomeCultura = NOMES[cultura.value] || 'lavoura';
    $('rFontes').textContent = 'Energia: ' + (q.rede ? 'tarifa rural da ANEEL com impostos e desconto escolhidos' : 'preço médio da ANP')
      + '; lâmina de ' + fmtN.format(q.lamina) + ' mm por ano para ' + nomeCultura + '; altura manométrica de ' + fmtN.format(q.head)
      + ' m. Colheita: ' + (r.colheita ? fmtN.format(q.semKg) + ' para ' + fmtN.format(q.comKg) + ' kg/ha a R$ ' + fmt1.format(q.precoKg) + '/kg' : 'não entra') + '. '
      + 'O retorno usa uma estimativa de custo por hectare do sistema posto no Brasil. Estimativa, não é orçamento.';
  }

  /* Pairs of slider + number box. */
  function syncPair(rangeEl, numEl) {
    rangeEl.addEventListener('input', function () { numEl.value = rangeEl.value; rangeFill(rangeEl); compute(); });
    numEl.addEventListener('input', function () { var v = num(numEl, +rangeEl.value); if (v >= +rangeEl.min && v <= +rangeEl.max) { rangeEl.value = v; rangeFill(rangeEl); } compute(); });
  }
  syncPair(ha, haNum); syncPair(diesel, dieselNum); syncPair(tarifa, tarifaNum); syncPair(gasolina, gasolinaNum);
  [lamina, head, eta, cec, consumo, imposto, desconto, etaMotor, semKg, comKg, precoKg].forEach(function (el) { el.addEventListener('input', compute); });

  function pressed(groupId, attr, value) {
    Array.prototype.forEach.call(document.querySelectorAll('#' + groupId + ' button'), function (x) {
      x.setAttribute('aria-pressed', x.getAttribute(attr) === value ? 'true' : 'false');
    });
  }
  var NOMES_E = { diesel: ['Diesel queimado hoje', 'L/ano', 'Consumo do motor diesel'],
                  gasolina: ['Gasolina queimada hoje', 'L/ano', 'Consumo do motor a gasolina'],
                  rede: ['Energia comprada hoje', 'kWh/ano', ''] };
  function setEnergia(e) {
    if (!NOMES_E[e]) e = 'diesel';
    var mudou = state.energia !== e;
    state.energia = e; var rede = e === 'rede';
    pressed('energia', 'data-energia', e);
    Array.prototype.forEach.call(document.querySelectorAll('.so-rede'), function (x) { x.hidden = !rede; });
    Array.prototype.forEach.call(document.querySelectorAll('.so-comb'), function (x) { x.hidden = rede; });
    Array.prototype.forEach.call(document.querySelectorAll('.so-diesel'), function (x) { x.hidden = e !== 'diesel'; });
    Array.prototype.forEach.call(document.querySelectorAll('.so-gasolina'), function (x) { x.hidden = e !== 'gasolina'; });
    $('uFisica').textContent = NOMES_E[e][1];
    $('consumoLabel').textContent = rede ? 'Já sabe seu consumo real de energia?' : 'Já sabe seu consumo real de ' + e + '?';
    if (NOMES_E[e][2]) $('cecLabel').textContent = NOMES_E[e][2];
    if (mudou && !rede) cec.value = e === 'gasolina' ? K.CEC_GASOLINA : K.CEC;
  }
  function setFonte(f) { state.fonte = f; pressed('fonte', 'data-fonte', f); head.value = K.HEAD[f]; }
  function setIrrigado(v) { state.irrigado = v; pressed('irrigado', 'data-irrigado', v ? 'sim' : 'nao'); }

  Array.prototype.forEach.call(document.querySelectorAll('#energia button'), function (b) {
    b.addEventListener('click', function () { setEnergia(b.getAttribute('data-energia')); compute(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#fonte button'), function (b) {
    b.addEventListener('click', function () { setFonte(b.getAttribute('data-fonte')); compute(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#irrigado button'), function (b) {
    b.addEventListener('click', function () { setIrrigado(b.getAttribute('data-irrigado') === 'sim'); preencherColheita(); compute(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#consumoUnit button'), function (b) {
    b.addEventListener('click', function () { state.consumoUnit = b.getAttribute('data-u'); pressed('consumoUnit', 'data-u', state.consumoUnit); compute(); });
  });
  cultura.addEventListener('change', function () { lamina.value = K.LAMINA[cultura.value] || 600; preencherColheita(); compute(); });
  var advToggle = $('advToggle'), adv = $('adv');
  advToggle.addEventListener('click', function () { var o = adv.classList.toggle('open'); advToggle.setAttribute('aria-expanded', o ? 'true' : 'false'); });

  /* Defaults from calc-core, then the handoff from the home page or the e-mailed report. */
  diesel.value = dieselNum.value = K.DIESEL; eta.value = K.ETA; cec.value = K.CEC;
  tarifa.value = tarifaNum.value = K.TARIFA; etaMotor.value = K.ETA_MOTOR;
  gasolina.value = gasolinaNum.value = K.GASOLINA;
  var q = C.lerParametros(location.search);
  if (q.ha) { haNum.value = q.ha; ha.value = Math.min(+ha.max, q.ha); }
  if (q.cultura && cultura.querySelector('option[value="' + q.cultura + '"]')) cultura.value = q.cultura;
  lamina.value = K.LAMINA[cultura.value];
  setFonte(q.fonte || state.fonte);
  setIrrigado(!!q.irrigado);
  if (q.diesel) { dieselNum.value = q.diesel; diesel.value = q.diesel; }
  if (q.gasolina) { gasolinaNum.value = q.gasolina; gasolina.value = q.gasolina; }
  if (q.tarifa) { tarifaNum.value = q.tarifa; tarifa.value = q.tarifa; }
  if (q.imposto) imposto.value = q.imposto;
  if (q.desconto) desconto.value = q.desconto;
  setEnergia(q.energia || 'diesel');
  preencherColheita();
  if (q.semKg !== undefined) semKg.value = q.semKg;
  if (q.comKg !== undefined) comKg.value = q.comKg;
  if (q.precoKg !== undefined) precoKg.value = q.precoKg;
  if (q.lamina) lamina.value = q.lamina;
  if (q.head) head.value = q.head;
  if (q.eta) eta.value = q.eta;
  if (q.etaMotor) etaMotor.value = q.etaMotor;
  if (q.cec) cec.value = q.cec;
  if (q.consumo) consumo.value = q.consumo;
  if (q.consumoUnit) { state.consumoUnit = q.consumoUnit; pressed('consumoUnit', 'data-u', q.consumoUnit); }
  rangeFill(ha); rangeFill(diesel); rangeFill(tarifa); rangeFill(gasolina);
  compute();
})();
