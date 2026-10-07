/* Calculadora de retorno: the one source of numbers, shared by calculadora.html and the mini
   calculator on the home page (PT and EN). The site generator (site-build/build_site.py) also reads
   the K block below to print the source line under the mini calculator, so the page text and the
   arithmetic cannot drift apart. Keep K strict JSON between the two markers.

   Provenance (Proton 6-projects/dutch-flow-tech-brazil):
   - DIESEL 7.33 and GASOLINA 6.55 R$/L: national average resale price of óleo diesel S10 and gasolina
     comum in ANP's weekly survey, week of 20 to 26 September 2026 (resumo_semanal_lpc_2026-09-20_
     2026-09-26.xlsx, sheet BRASIL; 3,147 and 4,480 stations). Was 6.97 (week of 5 to 11 July 2026).
   - CUSTO_USD_POR_HA: landed estimate per hectare, surface water 2,000 and well 2,450 (Tom's e-mail
     to Yvo, 24-09-2026; product-docs-pt/ficha-sistema-irrigacao-solar-fontes.md). Excludes well,
     reservoir and installation.
   - FX: R$ 5.10 per US$, mid-July 2026 (calculadora-research.md, TradingEconomics).
   - COEF: rho*g/3.6e6 = 1000*9.81/3,600,000 kWh per m3 per m of head.
   - ETA 0.60, pump set (pump x drive): FAO Irrigation Manual Module 5, Irrigation Pumping Plant
     (Savva & Frenken, 2001), pp. 31-33: best pump 0.69, V-belt or gear drive loses at most 5%, so
     0.66 is the design ceiling; Lima et al. 2009, Rev. Bras. Eng. Agric. Ambiental 13(4), measured
     59-63% on Brazilian centre-pivot motor-pump sets in the field. Approved by Yvo 24-09-2026
     (was 0.55).
   - CEC 0.28 L diesel per kWh of engine output: FAO Module 5 p. 35 (rule of thumb 0.25 L/kWh; the
     Lister example burns 241-266 g/kWh, 0.29-0.32 L/kWh).
   - CO2_PER_L 2.24 kg fossil CO2 per litre of pump diesel B15: 0.85 x 2.63, where 2.63 = ANP
     density 0.840 kg/L x PCI 10,100 kcal/kg (Anuario Estatistico 2023, fatores de conversao) x
     IPCC 2006 74,100 kg CO2/TJ. The 15% biodiesel is biogenic and counts as zero. B15 is the legal
     blend since 1 Aug 2025; B16 still awaited CNPE approval on 24-09-2026. If B16 comes into force:
     0.84 x 2.63 = 2.21. (Was 2.68, the IPCC default for pure fossil diesel.)
   - HEAD river 20 m / well 40 m: drip-irrigation baseline (FAO Module 5 pp. 34-35 assumes 20 m of
     operating pressure plus losses for localized irrigation, plus the lift). Pivot and sprinkler
     need more pressure (FAO Example 6: 30 m operating + 6 m friction), so for them these are floors.
   - LAMINA mm/year per crop: calculadora-research.md (Embrapa for soy, maize, beans, cane; FAO Kc
     for fruit and vegetables, flagged there as an editable assumption). cacau 300: the 275 mm mean
     dry-season deficit of the Transamazonica (Morais, R. Bras. Ci. Solo 1998) / 0.9 microsprinkler
     efficiency; upper bound 640 (3.5 mm/day, Leite 2013 CEPLAC, over June-November, no rain).
     acai 580: 120 L per clump per day x 400 clumps/ha = 4.8 mm/day over August-November, 122 days
     (Embrapa Comunicado Tecnico 317, 2019). Research: research-packs/cacau-para.md, acai-para.md.
   - GANHO harvest gain per ha, cacau and acai only, where the value of irrigation is the harvest,
     not the fuel. cacau 600 -> 1500 kg/ha dry beans: Bahia, Siqueira 2018 cited in Silva, UFRB 2020
     thesis (no Para trial exists), counted at half that gain, 600 -> 1050, because Para already
     averages 901 kg/ha (IBGE PAM 2025) where the Bahia baseline was 600. acai: irrigated BRS cultivars 10 to 12 t/ha, "more than 50%" above
     rainfed terra firme (Embrapa, Cultivo do acaizeiro em terra firme, 2025, ch. 10); taken at the low
     end, 10 t/ha against 10 / 1.5 = 6.7 t/ha.
   - PRECO_KG the farmer's price, default the visitor can change. cacau 17.00 R$/kg dried beans: Para
     convencional, Noticias Agricolas "Mercado do Cacau", 02/10/2026 (Sep-Oct 2026 range 15-19 after the
     2026 collapse; IBGE PAM 2025 annual average was 40.09). Refresh monthly. acai 4.44 R$/kg fruit:
     IBGE PAM 2025 implied price for Para, 8,334,100 thousand R$ / 1,875,043 t (SIDRA 1613, c82/45981,
     published 17/09/2026); an annual average across safra and entressafra.
   - CEC_GASOLINA 0.50 L per kWh of engine output: FAO, Water lifting devices, 4.4 Internal combustion
     engines: spark-ignition engines 25-30% efficient on paper, small ones far worse in the field.
     Taken at 25% on Brazilian gasolina C (30% anhydrous ethanol since Aug 2025, about 28.9 MJ/L:
     0.7 x 32.2 + 0.3 x 21.2), so 3.6 / (0.25 x 28.9) = 0.50. Derived, editable on the page.
   - CO2_PER_L_GASOLINA 1.56 kg fossil CO2 per litre of gasolina C: 0.70 x 32.2 MJ/L x IPCC 2006
     69,300 kg CO2/TJ. The ethanol share is biogenic and counts as zero. Derived.
   - TARIFA 0.82 R$/kWh: median TE+TUSD of subgroup B2 rural, modality convencional, "Tarifa de
     Aplicação", across the 81 distributors in ANEEL's open data (tarifas-distribuidoras-energia-
     eletrica), rows valid on 30-09-2026. p10 0.73, p90 1.01. Before taxes.
   - IMPOSTO multipliers: bill = tariff / (1 - ICMS - PIS/COFINS), PIS/COFINS ~5% (CPFL/RGE 2026).
     1.05 rural ICMS exempt (SP defers 100%, SEFAZ-SP), 1.11 ICMS 5% (MS irrigation, SEFAZ-MS),
     1.30 full ICMS ~18%. Other states not verified: the visitor picks.
   - DESCONTO: irrigation and aquaculture discount on up to 8.5 h/day outside 17:00-21:30 (Lei 10.438/2002
     art. 25, REN ANEEL 1.000/2021 art. 186, Portaria MME 137/2026), needs outorga. Grupo B: 60%
     South/Southeast, 67% North/Centre-West/MG (Neoenergia SP page), 73% Nordeste (secondary sources).
     Pumping within 8.5 h fits the window whole, so the discount applies to all of it.
   - ETA_MOTOR 0.90: electric motor efficiency on top of ETA. Assumption, typical of IR3 motors in the
     5 to 15 kW range; not verified at a source. Editable on the page.
   Research: Proton research-packs/combustivel-irrigacao-brasil.md and calculadora-research.md. */
(function (root) {
  "use strict";
  var K = /*K*/{
    "COEF": 0.002725,
    "CO2_PER_L": 2.24,
    "FX": 5.10,
    "LIFE_YEARS": 15,
    "DIESEL": 7.33,
    "DIESEL_SEMANA": ["2026-09-20", "2026-09-26"],
    "GASOLINA": 6.55,
    "CEC_GASOLINA": 0.50,
    "CO2_PER_L_GASOLINA": 1.56,
    "ETA": 0.60,
    "CEC": 0.28,
    "HEAD": { "rio": 20, "poco": 40 },
    "CUSTO_USD_POR_HA": { "rio": 2000, "poco": 2450 },
    "LAMINA": { "soja": 400, "milho": 450, "feijao": 350, "arroz": 1200, "cafe": 1000, "cana": 1200, "manga": 1150,
                "uva": 700, "melao": 450, "banana": 1400, "hortalicas": 400, "outro": 600,
                "cacau": 300, "acai": 580 },
    "GANHO": { "cacau": { "sem": 600, "com": 1050 }, "acai": { "sem": 6700, "com": 10000 },
               "soja": { "sem": 3470, "com": 3960 }, "milho": { "sem": 6376, "com": 7400 },
               "feijao": { "sem": 1470, "com": 2090 }, "cafe": { "sem": 1620, "com": 2100 },
               "cana": { "sem": 75000, "com": 90000 }, "banana": { "sem": 14200, "com": 19500 } },
    "GANHO_MANEJO": { "cafe": { "sem": 2100, "com": 2310 } },
    "GANHO_FONTE": {
      "cacau": "Bahia: 600 kg/ha sem irrigação, 1.500 com (Siqueira 2018, em Silva, UFRB 2020); contamos metade do ganho.",
      "acai": "Embrapa: 10 a 12 t/ha irrigado, mais de 50% acima da terra firme sem irrigação (2025); usamos o piso.",
      "soja": "Metade do ganho de um ensaio no Rio Grande do Sul (2021). Na média nacional a irrigação é seguro contra veranico.",
      "milho": "Metade da diferença entre lavouras irrigadas e não irrigadas no Censo Agropecuário (IBGE).",
      "feijao": "CONAB: feijão de inverno sob pivô contra o feijão das águas, média de cinco anos em Goiás.",
      "cafe": "Emater-MG: café irrigado contra sequeiro em Minas Gerais (2018), a menor das três fontes.",
      "cana": "Metade do ganho de um ensaio de gotejamento em Jaú (SP).",
      "banana": "Metade da diferença entre lavouras irrigadas e não irrigadas no Censo Agropecuário (IBGE).",
      "cafe_manejo": "Embrapa Cerrados: +13 sacas/ha com manejo da irrigação; contamos cerca de 10%."
    },
    "GANHO_FONTE_EN": {
      "cacau": "Bahia: 600 kg/ha without irrigation, 1,500 with (Siqueira 2018, in Silva, UFRB 2020); we count half the gain.",
      "acai": "Embrapa: 10 to 12 t/ha irrigated, more than 50% above rainfed upland açaí (2025); we use the floor.",
      "soja": "Half the gain of one trial in Rio Grande do Sul (2021). On the national average, irrigation is insurance against dry spells.",
      "milho": "Half the gap between irrigated and rainfed farms in the Agricultural Census (IBGE).",
      "feijao": "CONAB: winter beans under pivot against rainy-season beans, five-year average in Goiás.",
      "cafe": "Emater-MG: irrigated against rainfed coffee in Minas Gerais (2018), the lowest of three sources.",
      "cana": "Half the gain of one drip trial in Jaú (SP).",
      "banana": "Half the gap between irrigated and rainfed farms in the Agricultural Census (IBGE).",
      "cafe_manejo": "Embrapa Cerrados: +13 bags/ha with irrigation management; we count about 10%."
    },
    "PRECO_KG": { "cacau": 17.00, "acai": 4.44, "soja": 1.91, "milho": 0.86, "feijao": 3.36, "arroz": 1.55,
                  "cafe": 26.20, "cana": 0.142, "manga": 1.93, "uva": 4.09, "melao": 1.90, "banana": 2.25 },
    "PRECO_LIDO": { "cacau": "2026-10-02", "acai": "2026-09-17", "cafe": "2026-10-02", "outras": "2026-09-17" },
    "TARIFA": 0.82,
    "TARIFA_LIDA": "2026-09-30",
    "IMPOSTO": { "isento": 1.05, "reduzido": 1.11, "cheio": 1.30 },
    "DESCONTO": { "nenhum": 0, "sul": 0.60, "centro": 0.67, "nordeste": 0.73 },
    "ETA_MOTOR": 0.90,
    "HA": { "min": 1, "max": 5000, "padrao": 10 },
    "DIESEL_FAIXA": { "min": 1, "max": 20 }
  }/*K*/;

  /* Diesel burned per year to lift the crop's water: volume (1 mm = 10 m3/ha) x head -> hydraulic
     energy -> shaft energy through the pump set's efficiency -> litres through the engine's
     specific consumption. */
  function estimar(ha, lamina, head, eta, cec, preco) {
    var V = ha * lamina * 10;
    var Ehyd = K.COEF * V * head;
    var litros = (Ehyd / eta) * cec;
    return { litros: litros, economia: litros * preco };
  }
  /* Grid instead of diesel: the same hydraulic energy, through the pump set and the electric motor,
     bought at the tariff with taxes, less the irrigation discount. */
  function estimarRede(ha, lamina, head, eta, etaMotor, tarifa, imposto, desconto) {
    var V = ha * lamina * 10;
    var kwh = (K.COEF * V * head) / (eta * etaMotor);
    var porKwh = tarifa * imposto * (1 - desconto);
    return { kwh: kwh, porKwh: porKwh, economia: kwh * porKwh };
  }
  function custo(ha, fonte) { return ha * K.CUSTO_USD_POR_HA[fonte] * K.FX; }
  function payback(custoBRL, economia) { return economia > 0 ? custoBRL / economia : Infinity; }

  /* Handoff from the home page and from the e-mailed report: ?ha=&cultura=&fonte=&energia=&irrigado=
     &diesel=&gasolina=&tarifa=&imposto=&desconto=&sem=&com=&preco_kg=. Anything outside the allowed
     values is dropped, never clamped into something the visitor did not ask for. */
  function lerParametros(search) {
    var q = new URLSearchParams(search || ""), out = {};
    function num(k, min, max) { var v = parseFloat(q.get(k)); return isFinite(v) && v >= min && v <= max ? v : undefined; }
    function key(k, obj) { var v = q.get(k); return Object.prototype.hasOwnProperty.call(obj, v) ? v : undefined; }
    var v;
    if ((v = num("ha", K.HA.min, K.HA.max)) !== undefined) out.ha = v;
    if ((v = key("cultura", K.LAMINA)) !== undefined) out.cultura = v;
    if ((v = key("fonte", K.HEAD)) !== undefined) out.fonte = v;
    if (["diesel", "gasolina", "rede"].indexOf(q.get("energia")) >= 0) out.energia = q.get("energia");
    if (["sim", "nao", "1", "0"].indexOf(q.get("irrigado")) >= 0) out.irrigado = q.get("irrigado") === "sim" || q.get("irrigado") === "1";
    if ((v = num("diesel", K.DIESEL_FAIXA.min, K.DIESEL_FAIXA.max)) !== undefined) out.diesel = v;
    if ((v = num("gasolina", 1, 20)) !== undefined) out.gasolina = v;
    if ((v = num("tarifa", 0.1, 3)) !== undefined) out.tarifa = v;
    if ((v = key("imposto", K.IMPOSTO)) !== undefined) out.imposto = v;
    if ((v = key("desconto", K.DESCONTO)) !== undefined) out.desconto = v;
    if ((v = num("sem", 0, 100000)) !== undefined) out.semKg = v;
    if ((v = num("com", 0, 100000)) !== undefined) out.comKg = v;
    if ((v = num("preco_kg", 0, 1000)) !== undefined) out.precoKg = v;
    if ((v = num("lamina", 50, 2500)) !== undefined) out.lamina = v;
    if ((v = num("head", 5, 200)) !== undefined) out.head = v;
    if ((v = num("eta", 0.3, 0.85)) !== undefined) out.eta = v;
    if ((v = num("eta_motor", 0.6, 0.97)) !== undefined) out.etaMotor = v;
    if ((v = num("cec", 0.15, 0.5)) !== undefined) out.cec = v;
    if ((v = num("consumo", 0, 1e8)) !== undefined) out.consumo = v;
    if (["litros", "reais"].indexOf(q.get("consumo_unit")) >= 0) out.consumoUnit = q.get("consumo_unit");
    return out;
  }

  /* The whole calculation from one set of answers, so the full calculator, the home mini calculator and
     the server report (agro-lead, ported in calc.ts) give the same numbers. q: ha, cultura, fonte,
     energia (diesel|gasolina|rede), preco (R$/L fuel), tarifa, imposto, desconto (keys), lamina, head,
     eta, etaMotor, cec, consumo (exact use, optional), consumoUnit (litros|reais), precoKg. */
  function calcular(q) {
    var ha = q.ha, rede = q.energia === "rede", gas = q.energia === "gasolina", fisico, economia, porKwh = 0;
    var exato = q.consumo > 0;
    if (rede) {
      porKwh = q.tarifa * K.IMPOSTO[q.imposto] * (1 - K.DESCONTO[q.desconto]);
      if (exato) { if (q.consumoUnit === "reais") { economia = q.consumo; fisico = porKwh > 0 ? economia / porKwh : 0; } else { fisico = q.consumo; economia = fisico * porKwh; } }
      else { var r = estimarRede(ha, q.lamina, q.head, q.eta, q.etaMotor, q.tarifa, K.IMPOSTO[q.imposto], K.DESCONTO[q.desconto]); fisico = r.kwh; economia = r.economia; }
    } else {
      if (exato) { if (q.consumoUnit === "reais") { economia = q.consumo; fisico = economia / q.preco; } else { fisico = q.consumo; economia = fisico * q.preco; } }
      else { var e = estimar(ha, q.lamina, q.head, q.eta, q.cec, q.preco); fisico = e.litros; economia = e.economia; }
    }
    var co2 = rede ? 0 : fisico * (gas ? K.CO2_PER_L_GASOLINA : K.CO2_PER_L) / 1000;
    var investimento = custo(ha, q.fonte);
    // Harvest: the farmer's own yields (defaults from padroesColheita) and price. Gain only when both
    // yields and the price are filled and "with" beats "without".
    var semKg = q.semKg > 0 ? q.semKg : 0, comKg = q.comKg > 0 ? q.comKg : 0, precoKg = q.precoKg > 0 ? q.precoKg : 0;
    var colheita = comKg > semKg && precoKg > 0;
    var ganhoKg = colheita ? ha * (comKg - semKg) : 0, ganhoVal = ganhoKg * precoKg;
    var total = economia + ganhoVal;
    var out = { exato: exato, rede: rede, irrigado: !!q.irrigado, fisico: fisico, porKwh: porKwh, economia: economia, co2: co2,
                investimento: investimento, paybackEnergia: payback(investimento, economia),
                colheita: colheita, ganhoKg: ganhoKg, ganhoVal: ganhoVal, total: total,
                payback: payback(investimento, total), economia15: economia * K.LIFE_YEARS, total15: total * K.LIFE_YEARS };
    out.argumento = argumento(out);
    return out;
  }
  /* Defaults for the three harvest fields of a crop. irrigado = the area is already irrigated today:
     then the gain is only what soil-moisture-driven management adds (factor B); otherwise it is the
     step from rainfed to irrigated (factor A). A crop without a researched default returns zeros, and
     the harvest row stays hidden until the farmer fills in his own numbers. */
  function padroesColheita(cultura, irrigado) {
    var g = (irrigado ? K.GANHO_MANEJO : K.GANHO)[cultura];
    return { semKg: g ? g.sem : 0, comKg: g ? g.com : 0, precoKg: K.PRECO_KG[cultura] || 0 };
  }
  /* The strongest selling argument, one per result: the harvest when it is worth more than the energy
     saved; otherwise the energy; and on the grid, when the saving alone does not repay the system in its
     lifetime, the reason that remains (irrigating where the distributor gives no new load). */
  function argumento(r) {
    if (r.colheita && r.ganhoVal >= r.economia) return "colheita";
    if (r.rede && !(r.payback <= K.LIFE_YEARS)) return "rede";
    return "energia";
  }

  /* Payback as a farmer says it (Yvo 05-10-2026): months under a year, then years and months, never a
     decimal year; beyond the 15-year life, "mais de 15 anos". lang "pt" or "en". */
  function tempo(anos, lang) {
    var en = lang === "en";
    if (!isFinite(anos) || anos <= 0) return "–";
    if (anos > K.LIFE_YEARS) return en ? "over " + K.LIFE_YEARS + " years" : "mais de " + K.LIFE_YEARS + " anos";
    var m = Math.max(1, Math.round(anos * 12)), a = Math.floor(m / 12), r = m % 12;
    function mes(n) { return n + (en ? (n === 1 ? " month" : " months") : (n === 1 ? " mês" : " meses")); }
    if (a === 0) return mes(m);
    var ano = a + (en ? (a === 1 ? " year" : " years") : (a === 1 ? " ano" : " anos"));
    return r ? ano + (en ? " and " : " e ") + mes(r) : ano;
  }

  /* Reais as the server's brl() in agro-lead/calc.ts writes them: "R$ 8.769" in Portuguese, "R$ 8,769" in
     English (en-GB separators, like the English PDF). Intl's own currency style drops the space in English.
     The space is a no-break space, as Intl's pt-BR one was, so "R$" never ends a line on its own. */
  var LOCALE = { pt: "pt-BR", en: "en-GB" };
  function brl(n, lang, dec) {
    dec = dec || 0;
    return "R$\u00a0" + new Intl.NumberFormat(LOCALE[lang] || LOCALE.pt, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  }
  /* "pt" or "en" from <html lang>, the same test as agro-form.js. */
  function idioma() { return /^en/i.test(document.documentElement.lang || "") ? "en" : "pt"; }

  root.AgroCalc = { K: K, estimar: estimar, estimarRede: estimarRede, custo: custo, payback: payback, lerParametros: lerParametros,
                    calcular: calcular, argumento: argumento, padroesColheita: padroesColheita, tempo: tempo,
                    brl: brl, LOCALE: LOCALE, idioma: idioma };
})(window);
