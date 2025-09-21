/* =========================================================================
   Margin Rush — app.js (v4.9 Pro)
   - Modello logit con 3 competitor (price-war, premium, bandit ε-greedy)
   - IVA, canali di vendita (Online, P.IVA, Dipendente)
   - Costi fissi/variabili, garanzia, MC/BE/MoS, advisor prezzo
   - Grafici BE & MC (canvas 2D)
   - Salvataggio in localStorage
   - Pulsante "💡 Indica la soluzione" supportato via window.lastAdvisorPrice
   ========================================================================= */

//////////////////////
// Utilities & DOM  //
//////////////////////
const el = id => document.getElementById(id);
const euro = n => (Math.round((n ?? 0)*100)/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const pct = x => `${(x*100).toFixed(1)}%`;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const save=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };
const load=(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } };

// Safe get value number
const num = (id, def=0) => {
  const n = +((el(id)?.value ?? def));
  return isFinite(n) ? n : def;
};

//////////////////////
// Stato e default  //
//////////////////////

// Parametri base mercato
let day = load('day', 1);
let M = load('M', 1200);                      // clienti/giorno
let beta = load('beta', 0.08);                // sensibilità prezzo
let season = load('season', 0);               // stagionalità %
let cap = load('cap', 1000);                  // capacità ordini/g

// IVA e imposte
let ivaIncl = load('ivaIncl', true);
let ivaPct = load('ivaPct', 22)/100;
let tax = load('tax', 24)/100;

// Prezzo & investimenti
let our = load('our', { name: "Noi", p: 49, Q: 1, B: 1, S: 1 });

// Costi variabili
let buyCost   = load('buyCost', 20);
let varOver   = load('varOver', 1.2);
let minMargin = load('minMargin', 15); // %

let warranty = load('warranty', {
  months: 24,
  rateIn: 3, costIn: 40,     // % richieste in garanzia, costo
  rateOut: 1, costOut: 30    // % goodwill fuori garanzia, costo
});

// Costi fissi base (giorno)
let fixedBase = load('fixedBase', { staff: 300, rent: 120, saas: 60, other: 20 });

// Canali di vendita
let channel = load('channel', 'online');
let ch = load('chParams', {
  online:   { feePct: 6,  payPct: 2.5, fixedPer: 0.35, logPer: 3, saasM: 100, mgmtM:150 },
  piva:     { autoM:400, fixedM:2000, pct:10, teleKm:0.07, kmM:4000, kml:18, fuel:1.7, otherM:0 },
  employee: { ralY:50000, autoM:450,  teleM:30, tripsM:250, pct:0, kmM:0,   kml:18, fuel:1.7 }
});

// Cassa & reporting
let cash = load('cash', 5000);
let cumProfit = load('cumProfit', 0);

// Competitor
let comps = load('comps', [
  { name:"Comp A (Price-war)", p:45, Q:1, B:1, S:1, strat:"price" },
  { name:"Comp B (Premium)",  p:70, Q:2, B:2, S:2, strat:"premium" },
  { name:"Comp C (Bandit)",   p:52, Q:1, B:1, S:1, strat:"bandit",
    actions:[
      { dp:-.10, name:"Price −10%" },
      { dp:-.05, name:"Price −5%"  },
      { dQ: 1,   name:"+Q"         },
      { dB: 1,   name:"+B"         },
      { dS: 1, dp:+.05, name:"+S & +5%" }
    ],
    Qvals:[0,0,0,0,0], N:[0,0,0,0,0], epsilon:0.25
  }
]);

// Ultimi risultati per "clienti spostati"
let lastShares = null;
let lastMyUnits = 0;

// Advisor globale per pulsante "Indica la soluzione"
window.lastAdvisorPrice = null;

////////////////////////////
// Funzioni di calcolo    //
////////////////////////////

const netP = p => ivaIncl ? p/(1+ivaPct) : p;

const costQ = Q => 8 + 2*Q; // costo qualità per unità (semplice, crescente)

function wCostPerUnit(){
  const rin  = (num('wRateIn',  warranty.rateIn)  || 0)/100;
  const rout = (num('wRateOut', warranty.rateOut) || 0)/100;
  const cin  =  num('wCostIn',  warranty.costIn)  || 0;
  const cout =  num('wCostOut', warranty.costOut) || 0;
  return rin*cin + rout*cout;
}

function channelFixedPerDay(){
  if (channel==='online'){
    const saas = num('onSaaS', ch.online.saasM);
    const mgmt = num('onMgmt', ch.online.mgmtM);
    return (saas + mgmt)/30;
  }
  if (channel==='piva'){
    const km   = num('pvKm', ch.piva.kmM);
    const kml  = num('pvKml', ch.piva.kml) || 1;
    const fuel = num('pvFuel', ch.piva.fuel);
    const tele = num('pvTeleKm', ch.piva.teleKm);
    const otherM = num('pvOtherM', ch.piva.otherM);
    const fuelM = km/kml*fuel;
    const teleM = km*tele;
    return (num('pvAuto', ch.piva.autoM) + num('pvFixed', ch.piva.fixedM) + fuelM + teleM + otherM)/30;
  }
  // employee
  const ralD = (num('emRal', ch.employee.ralY) || 0)/365;
  const autoD= (num('emAuto', ch.employee.autoM)||0)/30;
  const teleD= (num('emTele', ch.employee.teleM)||0)/30;
  const tripD= (num('emTrips',ch.employee.tripsM)||0)/30;
  return ralD + autoD + teleD + tripD;
}

function channelVarPerUnit(pNet){
  if (channel==='online'){
    const feePct = (num('onFeePct', ch.online.feePct)||0)/100;
    const payPct = (num('onPayPct', ch.online.payPct)||0)/100;
    const fixed  =  num('onFixedPer', ch.online.fixedPer)||0;
    const logPer =  num('onLogPer', ch.online.logPer)||0;
    return pNet*(feePct+payPct) + fixed + logPer;
  }
  if (channel==='piva'){
    const pct = (num('pvPct', ch.piva.pct)||0)/100;
    return pNet*pct; // variabile solo la provvigione; altri costi sono fissi/giorno
  }
  // employee
  const pct = (num('emPct', ch.employee.pct)||0)/100;
  // opzionale: km variabili per unità → ignoriamo per semplicità; i km sono fissi di default
  return pNet*pct;
}

function fixedTotalPerDay(){
  const base = num('fxStaff', fixedBase.staff) + num('fxRent', fixedBase.rent) +
               num('fxSaaS', fixedBase.saas) + num('fxOther', fixedBase.other);
  return base + channelFixedPerDay();
}

// Logit shares
function shares(players){
  const U = players.map(o=>{
    const base = 0.6 + (o.B-1)*.15 + (o.Q-1)*.2; // appeal di base
    const price = -beta*o.p;
    const q = .25*(o.Q-1), b = .20*(o.B-1), s=.15*(o.S-1);
    const shock = (season/100)*(0.1+0.2*(o.B-1));
    return base + price + q + b + s + shock;
  });
  const mx = Math.max(...U);
  const ex = U.map(u=>Math.exp(u-mx));
  const sum = ex.reduce((a,b)=>a+b,0);
  return ex.map(e=>e/sum);
}

////////////////////////////
// Competitor strategies  //
////////////////////////////

function compMovePriceWar(c){ // abbassa leggermente prezzo se siamo più competitivi
  // se la nostra quota > loro, provano ad abbassare
  if (lastShares){
    const idx = 1 + comps.findIndex(x=>x.name===c.name);
    const myS = lastShares[0], theirS = lastShares[idx] ?? 0;
    if (myS > theirS) c.p = clamp(c.p * 0.98, 8, 200);
    else c.p = clamp(c.p * 1.01, 8, 200);
  } else {
    c.p = clamp(c.p * 0.99, 8, 200);
  }
}

function compMovePremium(c){
  // investe in Q/B e sostiene prezzo con piccoli aggiustamenti
  if (Math.random()<0.5) c.Q = clamp(c.Q+1,1,3);
  else c.B = clamp(c.B+1,1,3);
  c.S = clamp(c.S + (Math.random()<0.3?1:0),1,2);
  c.p = clamp(c.p * (1 + (Math.random()<0.5?-0.01:0.01)), 10, 220);
}

function compMoveBandit(c){
  // ε-greedy su azioni: valuta con reward = delta quota prevista
  const eps = c.epsilon ?? 0.25;
  let aIdx;
  if (Math.random() < eps){
    aIdx = Math.floor(Math.random()*c.actions.length);
  } else {
    // scegli l'azione migliore finora
    let best=-Infinity, idx=0;
    c.Qvals.forEach((q,i)=>{ if(q>best){best=q; idx=i;} });
    aIdx = idx;
  }
  const a = c.actions[aIdx];

  // stato attuale
  const basePlayers = [our].concat(comps.map(x=>({...x})));
  const beforeS = shares(basePlayers);
  const meIdx = 1 + comps.findIndex(x=>x.name===c.name);
  const before = beforeS[meIdx];

  // applica mossa (simulazione locale)
  const simPlayers = [our].concat(comps.map(x=>{
    if (x.name!==c.name) return {...x};
    const nx = {...x};
    if (a.dp) nx.p = clamp(nx.p*(1+a.dp), 5, 220);
    if (a.dQ) nx.Q = clamp(nx.Q + a.dQ, 1, 3);
    if (a.dB) nx.B = clamp(nx.B + a.dB, 1, 3);
    if (a.dS) nx.S = clamp(nx.S + a.dS, 1, 2);
    return nx;
  }));
  const after = shares(simPlayers)[meIdx];

  const reward = after - before; // delta quota
  // update valori attesi
  c.N[aIdx] += 1;
  c.Qvals[aIdx] = c.Qvals[aIdx] + (reward - c.Qvals[aIdx]) / c.N[aIdx];

  // applica davvero la mossa alla versione reale
  if (a.dp) c.p = clamp(c.p*(1+a.dp), 5, 220);
  if (a.dQ) c.Q = clamp(c.Q + a.dQ, 1, 3);
  if (a.dB) c.B = clamp(c.B + a.dB, 1, 3);
  if (a.dS) c.S = clamp(c.S + a.dS, 1, 2);

  log(`${c.name}: ${a.name} | Δshare previsto ${(reward*100).toFixed(1)}pp`);
}

//////////////////////
// Simulazione      //
//////////////////////

const logEl = el('log');
function log(t){
  if (!logEl) return;
  const d=document.createElement('div');
  d.className='log-item';
  d.textContent = `[G${day}] ${t}`;
  logEl.prepend(d);
}

function drawBEChart(q, pNet, vc, F){
  const cvs = el('beChart'); if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.clientWidth || 600, H = cvs.clientHeight || 220;
  if (cvs.width !== W) cvs.width = W;
  if (cvs.height!== H) cvs.height= H;

  ctx.clearRect(0,0,W,H);
  // assi
  ctx.strokeStyle="#30406e"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(40,H-30); ctx.lineTo(W-10,H-30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40,H-30); ctx.lineTo(40,10); ctx.stroke();

  // scala x: 0..maxX
  const maxX = Math.max(q*1.2, 10);
  const x2px = x => 40 + (W-60)*(x/maxX);
  const y2px = y => (H-30) - (H-50)*(y/Math.max(pNet*maxX, (vc*maxX+F)*1.3, 1));

  // ricavi (pNet * x)
  ctx.strokeStyle="#6ba8ff"; ctx.beginPath();
  for (let x=0;x<=maxX;x+=maxX/40){
    const y = pNet*x;
    const X=x2px(x), Y=y2px(y);
    if (x===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  } ctx.stroke();

  // costi totali (vc*x + F)
  ctx.strokeStyle="#ff7a88"; ctx.beginPath();
  for (let x=0;x<=maxX;x+=maxX/40){
    const y = vc*x + F;
    const X=x2px(x), Y=y2px(y);
    if (x===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  } ctx.stroke();

  // BE
  const denom = Math.max(pNet - vc, 0.0001);
  const beUnits = F / denom / (1 - tax || 1); // BE post-tax
  const beX = x2px(beUnits);
  ctx.strokeStyle="#ffd166"; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(beX,10); ctx.lineTo(beX,H-30); ctx.stroke();
  ctx.setLineDash([]);

  // label
  ctx.fillStyle="#a9b6db"; ctx.font="12px system-ui";
  ctx.fillText("Unità", W-48, H-12);
  ctx.save(); ctx.translate(12, 20); ctx.rotate(-Math.PI/2);
  ctx.fillText("€", 0, 0); ctx.restore();

  // legenda
  ctx.fillStyle="#6ba8ff"; ctx.fillRect(50,14,10,10); ctx.fillStyle="#a9b6db"; ctx.fillText("Ricavi", 65,24);
  ctx.fillStyle="#ff7a88"; ctx.fillRect(120,14,10,10); ctx.fillStyle="#a9b6db"; ctx.fillText("Costi totali", 135,24);
  ctx.fillStyle="#ffd166"; ctx.fillRect(210,14,10,10); ctx.fillStyle="#a9b6db"; ctx.fillText("Break-even", 225,24);
}

function drawMCChart(q, pNet, vc){
  const cvs = el('mcChart'); if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.clientWidth || 600, H = cvs.clientHeight || 220;
  if (cvs.width !== W) cvs.width = W;
  if (cvs.height!== H) cvs.height= H;

  ctx.clearRect(0,0,W,H);
  // assi
  ctx.strokeStyle="#30406e"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(40,H-30); ctx.lineTo(W-10,H-30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40,H-30); ctx.lineTo(40,10); ctx.stroke();

  const maxX = Math.max(q*1.2, 10);
  const x2px = x => 40 + (W-60)*(x/maxX);
  const yMax = Math.max(pNet*maxX, vc*maxX, 1);
  const y2px = y => (H-30) - (H-50)*(y/ yMax);

  // ricavi netti (pNet*x)
  ctx.strokeStyle="#6ba8ff"; ctx.beginPath();
  for (let x=0;x<=maxX;x+=maxX/40){
    const y=pNet*x, X=x2px(x), Y=y2px(y);
    if (x===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  } ctx.stroke();

  // costi variabili (vc*x)
  ctx.strokeStyle="#ff7a88"; ctx.beginPath();
  for (let x=0;x<=maxX;x+=maxX/40){
    const y=vc*x, X=x2px(x), Y=y2px(y);
    if (x===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  } ctx.stroke();

  // area MC fino a q
  ctx.fillStyle="rgba(107,230,117,0.25)"; // area verde
  ctx.beginPath();
  ctx.moveTo(x2px(0), y2px(0));
  ctx.lineTo(x2px(q), y2px(vc*q));
  ctx.lineTo(x2px(q), y2px(pNet*q));
  ctx.lineTo(x2px(0), y2px(0));
  ctx.fill();

  // legenda
  ctx.fillStyle="#6ba8ff"; ctx.fillRect(50,14,10,10); ctx.fillStyle="#a9b6db"; ctx.fillText("Ricavi netti", 65,24);
  ctx.fillStyle="#ff7a88"; ctx.fillRect(140,14,10,10); ctx.fillStyle="#a9b6db"; ctx.fillText("Costi variabili", 155,24);
  ctx.fillStyle="#6be675"; ctx.fillRect(240,14,10,10); ctx.fillStyle="#a9b6db"; ctx.fillText("MC (area)", 255,24);
}

//////////////////////
// Advisor prezzo   //
//////////////////////
function runAdvisor(){
  const F = fixedTotalPerDay();
  const market = Math.round(M * (1 + season/100));
  let best = our.p;
  let bestProf = -Infinity;

  for (let p = 10; p <= 120; p += 0.5) {
    const s = shares([{...our, p}].concat(comps))[0];
    const q = Math.min(Math.round(s * market), cap);

    const pNet = netP(p);
    const vc = buyCost + varOver + costQ(our.Q) + wCostPerUnit() + channelVarPerUnit(pNet);

    const preTax = Math.max(0, pNet - vc) * q - F;
    const postTax = preTax > 0 ? preTax * (1 - tax) : preTax;

    if (postTax > bestProf) {
      bestProf = postTax;
      best = p;
    }
  }

  window.lastAdvisorPrice = best;
  if (el('advisor')) el('advisor').innerHTML = `Advisor: <b>${euro(best)}</b> — utile atteso ${euro(bestProf)} (post-tax).`;
}

//////////////////////
// UI refresh       //
//////////////////////
function refreshEcho(){
  // leggi UI in stato (bidirezionale base)
  if (el('price')) our.p = +el('price').value || our.p;
  if (el('invQ'))  our.Q = +el('invQ').value  || our.Q;
  if (el('invB'))  our.B = +el('invB').value  || our.B;
  if (el('invS'))  our.S = +el('invS').value  || our.S;
  if (el('cap'))   cap   = +el('cap').value   || cap;

  if (el('iva'))     ivaIncl = !!el('iva').checked;
  if (el('ivaPct'))  ivaPct = (+el('ivaPct').value || ivaPct*100)/100;
  if (el('beta'))    beta = +el('beta').value || beta;
  if (el('season'))  season = +el('season').value || season;

  // echi
  if (el('priceEcho')) el('priceEcho').textContent = euro(our.p);
  if (el('invQEcho'))  el('invQEcho').textContent  = our.Q;
  if (el('invBEcho'))  el('invBEcho').textContent  = our.B;
  if (el('invSEcho'))  el('invSEcho').textContent  = our.S;
  if (el('capVal'))    el('capVal').textContent    = cap;
  if (el('M'))         el('M').textContent = M;
  if (el('seasonEcho'))el('seasonEcho').textContent = (season>=0?'+':'') + season + '%';
  if (el('betaEcho'))  el('betaEcho').textContent = beta.toFixed(3);

  // calcola quote
  const players = [our].concat(comps);
  const s = shares(players);
  const market = Math.round(M * (1 + season/100));
  const qList = s.map(si => Math.min(Math.round(si * market), cap));
  // tabella
  const tbody = el('tbl')?.querySelector('tbody');
  if (tbody){
    tbody.innerHTML = '';
    players.forEach((p,i)=>{
      const tr = document.createElement('tr');
      const cols = [
        p.name ?? (i===0?'Noi':'Comp'),
        euro(p.p),
        p.Q, p.B, p.S,
        pct(s[i]),
        qList[i].toString()
      ];
      cols.forEach((c,ci)=>{
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // KPI & costi
  const pNet = netP(our.p);
  const vc = buyCost + varOver + costQ(our.Q) + wCostPerUnit() + channelVarPerUnit(pNet);
  const mcUnit = pNet - vc;
  const F = fixedTotalPerDay();
  const denom = Math.max(mcUnit*(1-tax), 0.000001);
  const beUnits = F / denom;

  if (el('wCostPerUnit')) el('wCostPerUnit').textContent = euro(wCostPerUnit());
  if (el('mcUnit'))       el('mcUnit').textContent       = euro(mcUnit);
  if (el('beUnits'))      el('beUnits').textContent      = isFinite(beUnits)? beUnits.toFixed(1) : '—';

  // KPI nel box report (MC, copertura, MoS)
  const myQ = qList[0];
  const mcTot = Math.max(0, mcUnit) * myQ;
  if (el('kpiMcUnit'))  el('kpiMcUnit').textContent  = euro(mcUnit);
  if (el('kpiMcTotal')) el('kpiMcTotal').textContent = euro(mcTot);
  if (el('kpiCover'))   el('kpiCover').textContent   = mcUnit>0? pct(mcUnit/pNet) : '0%';
  const mos = (myQ>0 && beUnits>0) ? (myQ - beUnits)/myQ : 0;
  if (el('kpiMoS'))     el('kpiMoS').textContent = isFinite(mos)? pct(clamp(mos,-1,1)) : '—';

  // min margin warning
  if (el('minMarginWarn')){
    const minNet = (buyCost + varOver + costQ(our.Q) + wCostPerUnit());
    const minPNet = minNet / (1 - minMargin/100);
    const minPLordo = ivaIncl ? minPNet*(1+ivaPct) : minPNet;
    el('minMarginWarn').textContent = our.p < minPLordo ? '⚠️ sotto margine minimo' : 'OK';
  }

  // grafici
  drawBEChart(myQ, pNet, vc, F);
  drawMCChart(myQ, pNet, vc);

  // advisor
  runAdvisor();

  // header badges
  if (el('day'))       el('day').textContent = day;
  if (el('cash'))      el('cash').textContent = euro(cash);
  if (el('cumprofit')) el('cumprofit').textContent = euro(cumProfit);
  if (el('share'))     el('share').textContent = pct(s[0]||0);

  // save
  save('day',day); save('M',M); save('beta',beta); save('season',season); save('cap',cap);
  save('ivaIncl',ivaIncl); save('ivaPct',ivaPct*100); save('tax',tax*100);
  save('our',our); save('buyCost',buyCost); save('varOver',varOver); save('minMargin',minMargin);
  save('warranty',warranty); save('fixedBase',fixedBase);
  save('channel',channel); save('chParams',ch);
  save('cash',cash); save('cumProfit',cumProfit);
  save('comps',comps);
}

//////////////////////
// Un giorno di gioco
//////////////////////
function simulateDay(){
  const players = [our].concat(comps);
  const s = shares(players);
  const market = Math.round(M * (1 + season/100));
  const qList = s.map(si => Math.min(Math.round(si * market), cap));
  const myQ = qList[0];

  const pNet = netP(our.p);
  const vc = buyCost + varOver + costQ(our.Q) + wCostPerUnit() + channelVarPerUnit(pNet);
  const F = fixedTotalPerDay();

  const mcUnit = pNet - vc;
  const preTax = Math.max(0, mcUnit)*myQ - F;
  const postTax = preTax>0 ? preTax*(1-tax) : preTax;

  cash += postTax;
  cumProfit += postTax;

  if (el('qMe')) el('qMe').textContent = myQ;
  if (el('sMe')) el('sMe').textContent = pct(s[0]||0);
  if (el('pMe')) el('pMe').textContent = euro(postTax);

  // breakdown "clienti spostati" (semplice: confronto con ieri)
  if (lastShares){
    const delta = (s[0] - lastShares[0]) * market;
    // stima rozza contributi (variazioni nostre leve rispetto ieri)
    const bp = ((our.p - prevOur.p) !== 0) ? -Math.sign(our.p - prevOur.p) * Math.abs(delta)*0.5 : 0;
    const bq = (our.Q - prevOur.Q) * Math.abs(delta)*0.25;
    const bb = (our.B - prevOur.B) * Math.abs(delta)*0.15;
    const bs = (our.S - prevOur.S) * Math.abs(delta)*0.10;
    if (el('moved')) el('moved').textContent = delta.toFixed(0);
    if (el('bp')) el('bp').textContent = (bp>=0?'+':'')+Math.round(bp);
    if (el('bq')) el('bq').textContent = (bq>=0?'+':'')+Math.round(bq);
    if (el('bb')) el('bb').textContent = (bb>=0?'+':'')+Math.round(bb);
    if (el('bs')) el('bs').textContent = (bs>=0?'+':'')+Math.round(bs);
  } else {
    if (el('moved')) el('moved').textContent = '0';
  }

  // Log mosse competitor (dopo che si muovono)
  // salva stato precedente per breakdown
  var prevOur = {...our};
  lastShares = s;
  lastMyUnits = myQ;

  // Competitor si muovono per il giorno seguente
  comps.forEach(c=>{
    if (c.strat==='price') compMovePriceWar(c);
    else if (c.strat==='premium') compMovePremium(c);
    else compMoveBandit(c);
  });

  // log riassunto
  log(`Noi — prezzo ${euro(our.p)}, quota ${pct(s[0]||0)}, unità ${myQ}, utile ${euro(postTax)}`);

  day = Math.min(day+1, 10);
  refreshEcho();
}

//////////////////////
// Event wiring     //
//////////////////////
function bind(id, ev='input', fn){
  const x = el(id); if (!x) return;
  x.addEventListener(ev, fn);
}

function showChannelPanels(){
  const map = {
    online:   el('ch-online'),
    piva:     el('ch-piva'),
    employee: el('ch-employee')
  };
  Object.values(map).forEach(n=>{ if(n) n.style.display='none'; });
  if (map[channel]) map[channel].style.display='block';

  // Echo variabili canale
  const pNet = netP(our.p);
  const chVar = channelVarPerUnit(pNet);
  const chFix = channelFixedPerDay();
  if (el('chVarEcho')) el('chVarEcho').textContent = euro(chVar);
  if (el('chFixedEcho')) el('chFixedEcho').textContent = euro(chFix);
  if (el('chPctEcho')){
    const pctV =
      channel==='online' ? (num('onFeePct', ch.online.feePct)+num('onPayPct', ch.online.payPct)) :
      channel==='piva'   ? num('pvPct', ch.piva.pct) :
                           num('emPct', ch.employee.pct);
    el('chPctEcho').textContent = `${pctV?.toFixed?.(1) ?? 0}%`;
  }
}

function wireAll(){
  // Leve principali
  ['price','invQ','invB','invS','cap','beta','season','ivaPct'].forEach(id=>{
    bind(id,'input', ()=>{ refreshEcho(); });
  });
  bind('iva','change', ()=>{ refreshEcho(); });

  // Costi variabili / min margin
  ['buyCost','varOver','minMarginPct','wRateIn','wCostIn','wRateOut','wCostOut'].forEach(id=>{
    bind(id,'input', ()=>{ refreshEcho(); });
  });

  // Garanzia tier
  bind('wTier','change', ()=>{
    warranty.months = +el('wTier').value || warranty.months;
    save('warranty',warranty);
    refreshEcho();
  });

  // Fissi base
  ['fxStaff','fxRent','fxSaaS','fxOther'].forEach(id=>{
    bind(id,'input', ()=>{ refreshEcho(); });
  });

  // Canale
  bind('channel','change', ()=>{
    channel = el('channel').value;
    save('channel',channel);
    showChannelPanels();
    refreshEcho();
  });

  // Online params
  ['onFeePct','onPayPct','onFixedPer','onLogPer','onSaaS','onMgmt'].forEach(id=>{
    bind(id,'input', ()=>{ showChannelPanels(); refreshEcho(); });
  });

  // P.IVA params
  ['pvAuto','pvFixed','pvPct','pvTeleKm','pvKm','pvKml','pvFuel','pvOtherM'].forEach(id=>{
    bind(id,'input', ()=>{ showChannelPanels(); refreshEcho(); });
  });

  // Employee params
  ['emRal','emAuto','emTele','emTrips','emPct','emKm','emKml','emFuel'].forEach(id=>{
    bind(id,'input', ()=>{ showChannelPanels(); refreshEcho(); });
  });

  // Avanza giorno & reset
  bind('advance','click', ()=> simulateDay());
  bind('reset','click', ()=>{
    if (!confirm('Nuova partita? Verranno ripristinati i valori iniziali.')) return;
    localStorage.clear();
    // reload default
    day=1; M=1200; beta=0.08; season=0; cap=1000;
    ivaIncl=true; ivaPct=0.22; tax=0.24;
    our={name:"Noi", p:49, Q:1, B:1, S:1};
    buyCost=20; varOver=1.2; minMargin=15;
    warranty={months:24, rateIn:3, costIn:40, rateOut:1, costOut:30};
    fixedBase={staff:300, rent:120, saas:60, other:20};
    channel='online';
    ch={
      online:{feePct:6,payPct:2.5,fixedPer:0.35,logPer:3,saasM:100,mgmtM:150},
      piva:{autoM:400,fixedM:2000,pct:10,teleKm:0.07,kmM:4000,kml:18,fuel:1.7,otherM:0},
      employee:{ralY:50000,autoM:450,teleM:30,tripsM:250,pct:0,kmM:0,kml:18,fuel:1.7}
    };
    comps=[
      { name:"Comp A (Price-war)", p:45, Q:1, B:1, S:1, strat:"price" },
      { name:"Comp B (Premium)",  p:70, Q:2, B:2, S:2, strat:"premium" },
      { name:"Comp C (Bandit)",   p:52, Q:1, B:1, S:1, strat:"bandit",
        actions:[
          { dp:-.10, name:"Price −10%" },
          { dp:-.05, name:"Price −5%"  },
          { dQ: 1,   name:"+Q"         },
          { dB: 1,   name:"+B"         },
          { dS: 1, dp:+.05, name:"+S & +5%" }
        ],
        Qvals:[0,0,0,0,0], N:[0,0,0,0,0], epsilon:0.25
      }
    ];
    cash=5000; cumProfit=0; lastShares=null; lastMyUnits=0; window.lastAdvisorPrice=null;
    // svuota log
    if (logEl) logEl.innerHTML='';
    refreshEcho();
  });

  // Pulsante "💡 Indica la soluzione"
  bind('show-solution','click', ()=>{
    const box = el('solution-box'); if (!box) return;
    let msg = '';
    if (window.lastAdvisorPrice!=null) {
      msg = `👉 Prezzo suggerito dal sistema: <b>${euro(window.lastAdvisorPrice)}</b>`;
    } else {
      msg = "⚠️ Non ci sono ancora dati sufficienti, avanza almeno 1 turno.";
    }
    box.innerHTML = msg;
    box.style.display = 'block';
  });
}

//////////////////////
// Bootstrap        //
//////////////////////
function hydrateInputsFromState(){
  // Prova a scrivere i default negli input se esistono
  if (el('price')) el('price').value = our.p;
  if (el('invQ'))  el('invQ').value  = our.Q;
  if (el('invB'))  el('invB').value  = our.B;
  if (el('invS'))  el('invS').value  = our.S;
  if (el('cap'))   el('cap').value   = cap;
  if (el('iva'))   el('iva').checked = ivaIncl;
  if (el('ivaPct'))el('ivaPct').value= (ivaPct*100).toFixed(1);
  if (el('beta'))  el('beta').value  = beta;
  if (el('season'))el('season').value= season;

  if (el('buyCost')) el('buyCost').value = buyCost;
  if (el('varOver')) el('varOver').value = varOver;
  if (el('minMarginPct')) el('minMarginPct').value = minMargin;

  if (el('wTier'))   el('wTier').value = warranty.months;
  if (el('wRateIn')) el('wRateIn').value = warranty.rateIn;
  if (el('wCostIn')) el('wCostIn').value = warranty.costIn;
  if (el('wRateOut'))el('wRateOut').value = warranty.rateOut;
  if (el('wCostOut'))el('wCostOut').value = warranty.costOut;

  if (el('fxStaff')) el('fxStaff').value = fixedBase.staff;
  if (el('fxRent'))  el('fxRent').value  = fixedBase.rent;
  if (el('fxSaaS'))  el('fxSaaS').value  = fixedBase.saas;
  if (el('fxOther')) el('fxOther').value = fixedBase.other;

  if (el('channel')) el('channel').value = channel;

  // canali
  if (el('onFeePct'))  el('onFeePct').value  = ch.online.feePct;
  if (el('onPayPct'))  el('onPayPct').value  = ch.online.payPct;
  if (el('onFixedPer'))el('onFixedPer').value= ch.online.fixedPer;
  if (el('onLogPer'))  el('onLogPer').value  = ch.online.logPer;
  if (el('onSaaS'))    el('onSaaS').value    = ch.online.saasM;
  if (el('onMgmt'))    el('onMgmt').value    = ch.online.mgmtM;

  if (el('pvAuto'))    el('pvAuto').value    = ch.piva.autoM;
  if (el('pvFixed'))   el('pvFixed').value   = ch.piva.fixedM;
  if (el('pvPct'))     el('pvPct').value     = ch.piva.pct;
  if (el('pvTeleKm'))  el('pvTeleKm').value  = ch.piva.teleKm;
  if (el('pvKm'))      el('pvKm').value      = ch.piva.kmM;
  if (el('pvKml'))     el('pvKml').value     = ch.piva.kml;
  if (el('pvFuel'))    el('pvFuel').value    = ch.piva.fuel;
  if (el('pvOtherM'))  el('pvOtherM').value  = ch.piva.otherM;

  if (el('emRal'))     el('emRal').value     = ch.employee.ralY;
  if (el('emAuto'))    el('emAuto').value    = ch.employee.autoM;
  if (el('emTele'))    el('emTele').value    = ch.employee.teleM;
  if (el('emTrips'))   el('emTrips').value   = ch.employee.tripsM;
  if (el('emPct'))     el('emPct').value     = ch.employee.pct;
  if (el('emKm'))      el('emKm').value      = ch.employee.kmM;
  if (el('emKml'))     el('emKml').value     = ch.employee.kml;
  if (el('emFuel'))    el('emFuel').value    = ch.employee.fuel;

  // Echo badge header
  if (el('day')) el('day').textContent = day;
  if (el('cash')) el('cash').textContent = euro(cash);
  if (el('cumprofit')) el('cumprofit').textContent = euro(cumProfit);
}

document.addEventListener('DOMContentLoaded', ()=>{
  hydrateInputsFromState();
  showChannelPanels();
  wireAll();
  refreshEcho();
});
