const el=id=>document.getElementById(id);
const euro=n=>(Math.round((n??0)*100)/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});

let our={p:49}, M=1200, cap=1000, beta=0.08, season=0, tax=0.24;
let comps=[
  {name:'Comp A',p:45,Q:1,B:1,S:1},
  {name:'Comp B',p:70,Q:2,B:2,S:2},
  {name:'Comp C',p:52,Q:1,B:1,S:1}
];

function shares(players){
  const U=players.map(o=>-beta*o.p+0.2*(o.Q-1)+0.15*(o.B-1)+0.1*(o.S-1));
  const mx=Math.max(...U);
  const ex=U.map(u=>Math.exp(u-mx));
  const sum=ex.reduce((a,b)=>a+b,0);
  return ex.map(e=>e/sum);
}

function runAdvisor(){
  const market=Math.round(M*(1+season/100));
  let best=our.p, bestProfit=-Infinity;
  for(let p=10;p<=120;p+=0.5){
    const s=shares([{...our,p}].concat(comps))[0];
    const q=Math.min(Math.round(s*market),cap);
    const mcUnit=p-20;
    const F=200;
    const pre=(mcUnit*q)-F;
    const post=pre*(1-tax);
    if(post>bestProfit){bestProfit=post;best=p;}
  }
  if(el('advisor')) el('advisor').innerHTML=`Advisor: <b>${euro(best)}</b> utile atteso ${euro(bestProfit)}`;
  window.lastAdvisorPrice=best;
}

function simulateDay(){
  runAdvisor();
  if(el('log')){
    const d=document.createElement('div');
    d.textContent=`Simulato giorno: prezzo nostro ${our.p}`;
    el('log').prepend(d);
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  el('advance').addEventListener('click',simulateDay);
  el('reset').addEventListener('click',()=>location.reload());
  el('show-solution').addEventListener('click',()=>{
    const box=el('solution-box');
    if(window.lastAdvisorPrice)
      box.innerHTML=`👉 Prezzo suggerito: <b>${euro(window.lastAdvisorPrice)}</b>`;
    else box.innerHTML='⚠️ Nessuna simulazione ancora eseguita';
    box.style.display='block';
  });
  runAdvisor();
});
