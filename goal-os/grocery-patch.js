(()=>{
if(window.__goalOsGroceryV31)return;window.__goalOsGroceryV31=true;
try{
const css=`
.shopHome{border-color:#3f5420;background:linear-gradient(145deg,#18220d,#0a0f0c 58%)}
.shopHomeTop{display:flex;justify-content:space-between;gap:12px;align-items:center}.shopHome h2{margin:4px 0 3px;font-size:22px}.shopProgress{height:9px;background:#141c16;border:1px solid var(--line);border-radius:99px;overflow:hidden;margin:11px 0}.shopProgress i{display:block;height:100%;background:var(--lime);width:0}.shopStart{width:100%;font-size:15px;padding:13px!important}
.shopgroups{display:grid;gap:11px}.shopgroup{border:1px solid var(--line);border-radius:17px;padding:12px;background:#0b100d}.shopgroup h3{font-size:13px;margin:0 0 3px;color:var(--lime)}.shopgroup .aisleNote{font-size:9px;color:var(--mut);margin-bottom:7px}
.shopitem{display:grid;grid-template-columns:32px 1fr auto;gap:10px;align-items:start;padding:11px 0;border-top:1px solid #1e2821}.shopitem:first-of-type{border-top:0}.shopitem button{width:30px;height:30px;border-radius:50%;border:1px solid #455248;background:#080d09;color:transparent;font-weight:900}.shopitem.bought{opacity:.45}.shopitem.bought button{background:var(--lime);color:#11170d;border-color:var(--lime)}.shopname{font-size:12px;line-height:1.3;font-weight:850}.shopbuy{font-size:10px;line-height:1.35;color:#d8e0d5;margin-top:3px}.shopneed{font-size:9px;color:var(--mut);margin-top:2px}.shopqty{font-size:12px;font-weight:950;white-space:nowrap;color:#fff;text-align:right}.shopdays{font-size:10px;color:#d6dfd3;line-height:1.45;margin-top:5px}.foodactions{display:flex;gap:7px;flex-wrap:wrap}.foodactions .btn{flex:1}.shopToolbar{display:flex;gap:7px;align-items:center;margin:10px 0}.shopToolbar .btn{flex:1}.shopCounter{font-size:11px;font-weight:900;color:var(--lime)}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const brand=document.querySelector('.brand');if(brand)brand.textContent='GOAL OS · V31 WOOLWORTHS SHOP';

const foodCard=[...document.querySelectorAll('.card')].find(x=>x.querySelector('.kick')?.textContent.includes('FOOD & MACROS'));
if(foodCard){
  const top=foodCard.querySelector('.foodTop');const open=[...top.querySelectorAll('button')].find(b=>b.textContent.trim()==='Open');
  if(open&&!document.getElementById('shop3Top')){const b=document.createElement('button');b.id='shop3Top';b.className='btn do';b.textContent='Woolworths';b.onclick=e=>{e.stopPropagation();openGrocery()};open.before(b)}
  if(!document.getElementById('shopHome')){
    const el=document.createElement('section');el.className='card shopHome';el.id='shopHome';
    el.innerHTML=`<div class="shopHomeTop"><div><div class="kick">WOOLWORTHS · 3-DAY SHOP</div><h2>Walk in. Buy this. Leave.</h2><div class="mini" id="shopHomeDays">Exact list in store-walk order.</div></div><div class="shopCounter" id="shopHomeCounter">—</div></div><div class="shopProgress"><i id="shopHomeBar"></i></div><button class="btn primary shopStart" onclick="openGrocery()">🛒 START SHOP</button>`;
    foodCard.insertAdjacentElement('afterend',el);
  }
}

const foodModal=document.getElementById('foodModal');
if(foodModal&&!document.getElementById('shop3Food')){const rem=document.getElementById('remaining');const b=document.createElement('button');b.id='shop3Food';b.className='btn primary foodbtn';b.textContent='🛒 Woolworths 3-day shop';b.onclick=openGrocery;rem.after(b)}

if(!document.getElementById('groceryModal'))document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="groceryModal" onclick="if(event.target===this)closeGrocery()"><div class="sheet"><div class="sheethead"><div><div class="kick">WOOLWORTHS · STORE WALK</div><h2 style="margin:3px 0">Buy exactly this.</h2><div class="shopdays" id="shopDays"></div></div><button class="btn" onclick="closeGrocery()">×</button></div><div class="notice"><b>Walk order:</b> this follows a typical Woolworths layout so you move through the store once. Exact aisle numbers differ by branch.</div><div class="shopToolbar"><div class="shopCounter" id="shopCounter"></div><button class="btn" onclick="clearShopChecks()">Reset ticks</button></div><div class="shopgroups" id="shopGroups"></div></div></div>`);

if(!st.shopChecks)st.shopChecks={};
const SHOP={
train:[['Protein','Eggs',3,'count'],['Protein','Chicken breast',200,'g'],['Protein','Salmon fillet',200,'g'],['Protein','Plant protein powder',30,'g'],['Carbs','Oats',100,'g'],['Carbs','Dry rice',110,'g'],['Carbs','Potatoes',400,'g'],['Carbs','Rice cakes',3,'count'],['Produce','Bananas',2,'count'],['Produce','Berries',150,'g'],['Produce','Other fruit (apple/orange)',1,'count'],['Produce','Mixed vegetables / salad',500,'g'],['Fats + extras','Fortified soy milk',300,'ml'],['Fats + extras','Olive oil',10,'g'],['Fats + extras','Peanut butter',20,'g']],
recover:[['Protein','Eggs',3,'count'],['Protein','Chicken breast',200,'g'],['Protein','Lean beef',200,'g'],['Protein','Plant protein powder',30,'g'],['Protein','High-protein soy yogurt',250,'g'],['Carbs','Oats',90,'g'],['Carbs','Dry rice',90,'g'],['Carbs','Potatoes',400,'g'],['Produce','Berries',250,'g'],['Produce','Other fruit (apple/orange)',1,'count'],['Produce','Mixed vegetables / salad',500,'g'],['Fats + extras','Fortified soy milk',300,'ml'],['Fats + extras','Olive oil',10,'g'],['Fats + extras','Almonds',30,'g']],
active:[['Protein','Eggs',4,'count'],['Protein','Chicken breast',200,'g'],['Protein','Lean protein for dinner',200,'g'],['Protein','Plant protein powder',30,'g'],['Protein','High-protein soy yogurt',250,'g'],['Carbs','Wholegrain bread',3,'slices'],['Carbs','Dry rice',110,'g'],['Carbs','Potatoes',400,'g'],['Produce','Avocado',0.5,'count'],['Produce','Other fruit',2,'count'],['Produce','Mixed vegetables / salad',500,'g'],['Fats + extras','Olive oil',10,'g'],['Fats + extras','Nuts',30,'g']]
};
function typeFor(d){const n=days[d.getDay()];return ['Monday','Tuesday','Thursday','Friday'].includes(n)?'train':n==='Saturday'?'active':'recover'}
function data(){const out={},labels=[];for(let n=0;n<3;n++){const d=new Date();d.setDate(d.getDate()+n);const ty=typeFor(d);labels.push(d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})+' · '+(ty==='train'?'Training':ty==='active'?'Active':'Recovery'));SHOP[ty].forEach(([cat,name,q,u])=>{const k=cat+'|'+name+'|'+u;(out[k]||(out[k]={cat,name,q:0,u})).q+=q})}return{items:Object.values(out),labels}}
function fmt(q,u){if(u==='g'&&q>=1000)return (q/1000).toFixed(q%1000?1:0)+' kg';if(u==='ml'&&q>=1000)return (q/1000).toFixed(q%1000?1:0)+' L';if(u==='count')return q===0.5?'½':Number.isInteger(q)?String(q):q.toFixed(1);return q+' '+u}
function id(x){return key()+'|'+x.cat+'|'+x.name}
function loc(name){
 if(/Bananas|Berries|fruit|Avocado|Potatoes|vegetables|salad/i.test(name))return ['1 · FRESH PRODUCE','Front of store · fruit & veg'];
 if(/Wholegrain bread/i.test(name))return ['2 · BAKERY','Bread section / bakery'];
 if(/Chicken|Salmon|Lean beef|Lean protein/i.test(name))return ['3 · MEAT & SEAFOOD','Fresh meat / seafood fridges'];
 if(/Eggs|soy yogurt|soy milk/i.test(name))return ['4 · EGGS & CHILLED','Eggs / dairy-alternative fridges'];
 if(/Oats|Peanut butter/i.test(name))return ['5 · BREAKFAST & SPREADS','Breakfast / spreads aisle'];
 if(/Dry rice|Rice cakes|Olive oil|Almonds|Nuts/i.test(name))return ['6 · PANTRY','Rice / snacks / oils / nuts aisles'];
 if(/protein powder/i.test(name))return ['7 · HEALTH / SPORTS NUTRITION','Health-food / sports-nutrition area'];
 return ['8 · OTHER','Check nearby aisle signage'];
}
function buyLine(x){const n=x.name,q=x.q;
 if(n==='Eggs')return `Buy 1 × 12-pack eggs`;
 if(n==='Chicken breast')return `Buy about ${Math.ceil(q/100)*100} g chicken breast`;
 if(n==='Salmon fillet')return `Buy about ${Math.ceil(q/100)*100} g salmon fillets`;
 if(n==='Lean beef')return `Buy 1 × ~500 g lean beef/mince`;
 if(n==='Lean protein for dinner')return `Buy 1 × ~250 g lean meat/fish portion`;
 if(n==='Plant protein powder')return `If low at home: 1 tub plant protein`;
 if(n==='High-protein soy yogurt')return `Buy 1 × ${q<=500?500:1000} g tub`;
 if(n==='Oats')return `Buy 1 × 500 g bag/tub oats`;
 if(n==='Dry rice')return `Buy 1 × 1 kg bag rice`;
 if(n==='Potatoes')return `Buy about ${q>=1000?(Math.ceil(q/500)*0.5)+' kg':Math.ceil(q/100)*100+' g'} potatoes`;
 if(n==='Rice cakes')return `Buy 1 packet rice cakes`;
 if(n==='Wholegrain bread')return `Buy 1 loaf wholegrain bread`;
 if(n==='Bananas')return `Pick ${Math.ceil(q)} bananas`;
 if(/Other fruit/.test(n))return `Pick ${Math.ceil(q)} apples/oranges or similar fruit`;
 if(n==='Berries')return `Buy about ${Math.ceil(q/100)*100} g berries (fresh or frozen)`;
 if(n==='Mixed vegetables / salad')return `Buy about ${(q/1000).toFixed(q%1000?1:0)} kg vegetables/salad total`;
 if(n==='Avocado')return `Buy 1 avocado`;
 if(n==='Fortified soy milk')return `Buy 1 × 1 L fortified soy milk`;
 if(n==='Olive oil')return `Only buy if low at home: olive oil`;
 if(n==='Peanut butter')return `Only buy if low at home: peanut butter`;
 if(n==='Almonds'||n==='Nuts')return `Buy 1 small bag unsalted nuts`;
 return `Buy enough for ${fmt(q,x.u)}`;
}
function grouped(items){const m=new Map();items.forEach(x=>{const [g,n]=loc(x.name);if(!m.has(g))m.set(g,{g,n,items:[]});m.get(g).items.push(x)});return [...m.values()].sort((a,b)=>parseInt(a.g)-parseInt(b.g))}
function stats(){const g=data(),total=g.items.length,done=g.items.filter(x=>!!st.shopChecks[id(x)]).length;return{...g,total,done,left:total-done}}
function updateHome(){const s=stats();const c=document.getElementById('shopHomeCounter'),bar=document.getElementById('shopHomeBar'),d=document.getElementById('shopHomeDays');if(c)c.textContent=s.left+' left';if(bar)bar.style.width=(s.total?s.done/s.total*100:0)+'%';if(d)d.textContent=s.labels.map(x=>x.split(' · ')[0]).join(' → ')}
window.openGrocery=()=>{document.getElementById('groceryModal').classList.add('open');renderGrocery()};
window.closeGrocery=()=>document.getElementById('groceryModal').classList.remove('open');
window.toggleShop=i=>{st.shopChecks[i]=!st.shopChecks[i];save();renderGrocery();updateHome()};
window.clearShopChecks=()=>{const p=key()+'|';Object.keys(st.shopChecks).filter(k=>k.startsWith(p)).forEach(k=>delete st.shopChecks[k]);save();renderGrocery();updateHome()};
window.renderGrocery=()=>{const s=stats();document.getElementById('shopDays').innerHTML=s.labels.join('<br>');document.getElementById('shopCounter').textContent=s.done+'/'+s.total+' bought · '+s.left+' left';document.getElementById('shopGroups').innerHTML=grouped(s.items).map(gr=>`<div class="shopgroup"><h3>${gr.g}</h3><div class="aisleNote">${gr.n}</div>${gr.items.map(x=>{const i=id(x),b=!!st.shopChecks[i];return `<div class="shopitem ${b?'bought':''}"><button onclick="toggleShop('${i.replace(/'/g,"\\'")}')">✓</button><div><div class="shopname">${x.name}</div><div class="shopbuy">${buyLine(x)}</div><div class="shopneed">Meal-plan need: ${fmt(x.q,x.u)}</div></div><div class="shopqty">${fmt(x.q,x.u)}</div></div>`}).join('')}</div>`).join('');updateHome()};
updateHome();save();
}catch(e){console.error('Woolworths shop patch failed',e)}
})();
