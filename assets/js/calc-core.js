/* Calculadora de retorno: the one source of numbers, shared by calculadora.html and the mini
   calculator on the home page (PT and EN). The site generator (site-build/build_site.py) also reads
   the K block below to print the source line under the mini calculator, so the page text and the
   arithmetic cannot drift apart. Keep K strict JSON between the two markers.

   Provenance (Proton 6-projects/dutch-flow-tech-brazil):
   - DIESEL: diesel S-10, national average price in ANP's weekly survey, week of 5 to 11 July 2026
     (calculadora-research.md, citing Jornal de Brasília and DGABC of 10 July 2026).
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
     for fruit and vegetables, flagged there as an editable assumption). */
(function (root) {
  "use strict";
  var K = /*K*/{
    "COEF": 0.002725,
    "CO2_PER_L": 2.24,
    "FX": 5.10,
    "LIFE_YEARS": 15,
    "DIESEL": 6.97,
    "DIESEL_SEMANA": ["2026-07-05", "2026-07-11"],
    "ETA": 0.60,
    "CEC": 0.28,
    "HEAD": { "rio": 20, "poco": 40 },
    "CUSTO_USD_POR_HA": { "rio": 2000, "poco": 2450 },
    "LAMINA": { "soja": 400, "milho": 450, "feijao": 350, "arroz": 1200, "cafe": 1000, "cana": 1200, "manga": 1150,
                "uva": 700, "melao": 450, "banana": 1400, "hortalicas": 400, "outro": 600 },
    "HA": { "min": 1, "max": 5000, "padrao": 50 },
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
  function custo(ha, fonte) { return ha * K.CUSTO_USD_POR_HA[fonte] * K.FX; }
  function payback(custoBRL, economia) { return economia > 0 ? custoBRL / economia : Infinity; }

  /* Handoff from the home page: ?ha=&cultura=&fonte=&diesel=. Anything outside the allowed values
     is dropped, never clamped into something the visitor did not ask for. */
  function lerParametros(search) {
    var q = new URLSearchParams(search || ""), out = {};
    var ha = parseFloat(q.get("ha")), diesel = parseFloat(q.get("diesel"));
    if (isFinite(ha) && ha >= K.HA.min && ha <= K.HA.max) out.ha = ha;
    if (Object.prototype.hasOwnProperty.call(K.LAMINA, q.get("cultura"))) out.cultura = q.get("cultura");
    if (Object.prototype.hasOwnProperty.call(K.HEAD, q.get("fonte"))) out.fonte = q.get("fonte");
    if (isFinite(diesel) && diesel >= K.DIESEL_FAIXA.min && diesel <= K.DIESEL_FAIXA.max) out.diesel = diesel;
    return out;
  }

  root.AgroCalc = { K: K, estimar: estimar, custo: custo, payback: payback, lerParametros: lerParametros };
})(window);
