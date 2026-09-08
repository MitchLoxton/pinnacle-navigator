// phone-interaction-bounds
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {report} from './fixture.mjs';
import {ledgerFrom,writeBatches,resultFrom} from '../../.phone-studio/ytintel/latest/v320-script-contract.mjs';
const root=process.cwd(),proof='phone-artifacts',port=8770,origin=`http://127.0.0.1:${port}`;
await mkdir(proof,{recursive:true});
const server=createServer(async(req,res)=>{try{let p=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+'/'))throw Error('path');if(p.endsWith('/latest'))p+='/index.html';res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[extname(p)]||'text/plain');res.end(await readFile(p));}catch{res.statusCode=404;res.end('not found')}});
await new Promise(r=>server.listen(port,'127.0.0.1',r));
function fixture(){
 const tiers=['Tier 1 - Foundations','Tier 2 - Deeper details'],config={script:'My unchanged opening.\nTier 1 - Foundations\nDistrict 1 supports a replay feature.\nTier 2 - Deeper details\nMy unchanged closing.',brief:'Expand from 50 to 100 details without duplicates.',urls:['https://www.youtube.com/watch?v=1rjw7yD6H8Y','https://www.youtube.com/watch?v=REjHBGlGnek'],tiers,target:100,include_uncertain:false};
 const atoms=[],groups=[];
 for(let i=1;i<=100;i++){const text=`District ${i} supports a replay feature.`,ids=[];for(const kind of i<=50?['script',...(i<=25?['video']:[])]:['video']){const id=kind[0]+i;ids.push(id);atoms.push({id,source_id:kind==='script'?'DRAFT':'V1',source_kind:kind,claim:text,qualifier:'Synthetic test data only.',kind:'stated',receipts:[{segment_id:kind==='script'?'DRAFTL'+i:'V1S'+i,quote:text}]})}groups.push({member_ids:ids,claim:text,qualifier:'Source-stated, not independently verified.',kind:'stated',tier:tiers[i<=50?0:1],reason:'Fixture group.'});}
 const ledger=ledgerFrom({groups,conflicts:[],notes:[]},atoms,config),sources=[{id:'V1',kind:'video',url:config.urls[0],title:'Synthetic phone test - not actual game research',segments:Array.from({length:100},(_,i)=>({id:'V1S'+(i+1),start:i*5,text:`District ${i+1} supports a replay feature.`}))},{id:'DRAFT',kind:'script',segments:[]}];
 const steps={wrapper:{title:'100 synthetic phone test details',opening:'Fixture opening.',closing:'Fixture closing.'},review:{approved:true,issues:[],notes:['Synthetic test only.']}};
 for(const b of writeBatches(ledger,tiers))steps[b.key]={lines:b.details.map(g=>({detail_id:g.id,text:g.claim}))};
 return {config,sources,ledger,result:resultFrom(config,sources,ledger,steps)};
}
const receipts=[];let currentPage=null,currentName='',errors=[];
async function fits(page,label){const d=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth,inner:innerWidth}));assert(d.width<=d.viewport+2,`${label}: page ${d.width} > viewport ${d.viewport}`);return d;}
const deadline=setTimeout(()=>{console.error('Phone suite deadline');process.exit(2)},480000);
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();currentPage=page;currentName=engine;errors=[];page.setDefaultTimeout(15000);console.log('Phone engine',engine);page.on('pageerror',e=>errors.push(e.message));let built=false,worked=false,credit=false;const f=fixture(),calls=[];
   const run=()=>({ok:true,run_id:'phone-fixture',status:worked?(credit?'blocked':f.result.status):'researching',config:f.config,sources:f.sources,coverage:{chunks_total:3,chunks_extracted:worked&&!credit?3:0,chunks_audited:worked&&!credit?3:0},questions:[],jobs:[{key:'plan',kind:'plan',label:'Synthetic editor task',status:worked?(credit?'failed':'done'):'queued',error_code:worked&&credit?'CREDIT_BALANCE_EXHAUSTED':null,error_detail:worked&&credit?'Fixture: API credit balance unavailable; original script retained.':null}],result:worked&&!credit?f.result:null,ledger:worked&&!credit?f.ledger:null});
   await page.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());if(u.origin===origin||u.hostname.includes('jsdelivr'))return route.continue();
    if(!u.hostname.endsWith('supabase.co'))return route.fulfill({status:404,body:'No external media in fixture suite'});
    const action=u.searchParams.get('action');let data={ok:true,version:'0.33.1',configured:true,discovery:{videos:[]}};
    if(u.pathname.endsWith('/ytintel-script-studio')){calls.push(action);assert(calls.length<60,'Auth/list loop');if(action==='list')data={ok:true,runs:built?[{id:'phone-fixture',brief:f.config.brief,status:run().status,target:100,created_at:new Date().toISOString()}]:[]};else if(action==='start'){built=true;worked=false;data=run();}else if(action==='state')data=run();else if(action==='work'){worked=true;if(credit)return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({ok:false,code:'CREDIT_BALANCE_EXHAUSTED',error:'Fixture: API credit balance unavailable; original script retained.'})});data={ok:true,done:true}}else data={ok:true};}
    else if(action==='analyze')data={ok:true,report:structuredClone(report)};
    else if(action==='research-begin')data={ok:true,run_id:'phone-test',token:'fixture-only',model:'mock'};
    else if(action==='research-stage')return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({ok:false,code:'CREDIT_BALANCE_EXHAUSTED'})});
    return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
   });
   console.log('Opening application');await page.goto(origin+'/ytintel/latest/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.YTIntelPhone&&window.YTIntelBriefWorkspace&&document.documentElement.dataset.yt300CoreAnalysis==='1');await page.waitForTimeout(1800);
   for(const [width,height] of [[320,740],[360,800],[390,844],[430,932],[768,1024],[844,390]]){
    currentName=engine+'-'+width;console.log('Phone viewport',currentName);await page.setViewportSize({width,height});await page.waitForTimeout(200);
    await page.locator('#mobileDock [data-dock="analyse"]').tap();
    const dims=await fits(page,currentName+' analysis');
    const input=await page.locator('#videoUrl').evaluate(e=>({font:parseFloat(getComputedStyle(e).fontSize),height:e.getBoundingClientRect().height}));assert(input.font>=16);assert(input.height>=44);
    for(const name of ['os','history','analyse']){const b=page.locator(`#mobileDock [data-dock="${name}"]`);assert((await b.boundingBox()).height>=44);await b.tap();await page.waitForTimeout(50);assert.equal(await page.locator('.view.active').getAttribute('id'),name);await fits(page,currentName+' '+name);}
    await page.locator('#videoUrl').scrollIntoViewIfNeeded();if(width===390||width===320)await page.screenshot({path:`${proof}/${currentName}-analyse.png`});
    receipts.push({engine,viewport:{width,height},pages:['Analyse','Competitors','Vault'],dims,input,touch_navigation:true});
   }
   await page.setViewportSize({width:390,height:844});await page.locator('#yt330Profile summary').tap();await page.locator('[data-profile="niche"]').fill('Phone test');await page.locator('#yt330ProfileSave').tap();assert((await page.locator('#yt330ProfileMessage').innerText()).includes('saved'));await fits(page,engine+' creator form');await page.locator('#yt330Profile summary').tap();
   await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=QAfixture01');await page.locator('#analyseForm>button.primary').tap();await page.waitForSelector('#yt300Progress[data-phase="stopped"]',{timeout:25000});assert.equal(await page.locator('#yt300Report>.yt300-section').count(),17);await fits(page,engine+' 17-section report');await page.locator('#yt300Report').scrollIntoViewIfNeeded();await page.screenshot({path:`${proof}/${engine}-report.png`});
   // Inspect pending Script Studio in this test only. It is not silently published on main.
   console.log('Opening pending Script Studio');await page.addScriptTag({type:'module',url:origin+'/.phone-studio/ytintel/latest/v320-script-studio.js'});await page.waitForFunction(()=>window.YTIntelScriptStudio);
   await page.locator('#yt320Modes [data-mode="studio"]').tap();
   await page.locator('#yt320Example').tap();await page.locator('#yt320File').setInputFiles({name:'phone-script.txt',mimeType:'text/plain',buffer:Buffer.from(f.config.script)});
   await page.waitForFunction(script=>document.querySelector('#yt320Script').value===script,f.config.script);
   assert.equal(await page.locator('#yt320Script').inputValue(),f.config.script);assert.equal(await page.locator('#yt320Tiers').inputValue(),f.config.tiers.join('\n'));
   for(const width of [320,360,390,430]){await page.setViewportSize({width,height:844});await fits(page,engine+' studio form '+width);for(const id of ['yt320Brief','yt320Script','yt320Sources','yt320Target','yt320Tiers'])assert(await page.locator('#'+id).evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16));}
   await page.setViewportSize({width:390,height:844});await page.locator('#yt320Brief').scrollIntoViewIfNeeded();await page.screenshot({path:`${proof}/${engine}-studio-inputs.png`});
   // Simulate an OS-keyboard visual viewport shrink, without making a hardware claim.
   await page.locator('#yt320Script').focus();
   const keyboard=await page.evaluate(()=>{const original=window.visualViewport;Object.defineProperty(window,'visualViewport',{configurable:true,value:{height:innerHeight-310,offsetTop:0,scale:1}});window.YTIntelPhone.refresh();const r={state:document.documentElement.dataset.ytPhoneKeyboard,dock:getComputedStyle(document.querySelector('#mobileDock')).visibility,focus:document.activeElement.id};Object.defineProperty(window,'visualViewport',{configurable:true,value:original});window.YTIntelPhone.refresh();return r;});assert.equal(keyboard.state,'open');assert.equal(keyboard.dock,'hidden');assert.equal(keyboard.focus,'yt320Script');
   await page.evaluate(()=>{const session={access_token:'synthetic-fixture-not-a-secret',user:{id:'phone-fixture-user'}};window.YTIntelAuth={user:session.user,session,signedIn:true,refresh:async()=>{window.dispatchEvent(new CustomEvent('ytintel:auth'));return session},openAccount:()=>{}};window.YTIntelAuthReady=Promise.resolve(window.YTIntelAuth);window.dispatchEvent(new CustomEvent('ytintel:auth'));});
   await page.locator('#yt320Build').tap();await page.waitForSelector('#yt320Output:not([hidden])',{timeout:20000});await page.waitForFunction(()=>!document.querySelector('#yt320Build').disabled);assert.equal(await page.locator('.yt320-tier article').count(),100);
   for(const [width,height] of [[320,740],[360,800],[390,844],[430,932],[844,390]]){await page.setViewportSize({width,height});await fits(page,engine+' studio 100 details '+width);}
   await page.setViewportSize({width:390,height:844});await page.locator('#yt320Output').scrollIntoViewIfNeeded();await page.screenshot({path:`${proof}/${engine}-studio-result.png`});await page.locator('.yt320-tier article').last().scrollIntoViewIfNeeded();assert.equal(await page.locator('.yt320-number').last().innerText(),'100');
   await page.locator('.yt320-tier details summary').first().tap();assert(await page.locator('.yt320-receipt').first().isVisible());
   const download=page.waitForEvent('download');await page.locator('[data-export="csv"]').tap();assert.equal((await download).suggestedFilename(),'source-fact-ledger.csv');await page.locator('[data-view="evidence"]').tap();assert.equal(await page.locator('.yt320-ledger').count(),100);await fits(page,engine+' ledger');
   await page.locator('[data-view="changes"]').tap();await fits(page,engine+' change log');
   credit=true;await page.locator('#yt320Build').tap();await page.waitForFunction(()=>!document.querySelector('#yt320Build').disabled&&document.querySelector('#yt320Message').textContent.includes('API credit balance'),null,{timeout:15000});assert(!await page.locator('#yt320Output').isVisible());assert.notEqual(await page.locator('#yt320Pct').innerText(),'100%');assert.equal(await page.locator('#yt320Script').inputValue(),f.config.script);
   await page.locator('#yt320Progress').scrollIntoViewIfNeeded();await page.screenshot({path:`${proof}/${engine}-studio-blocked.png`});
   receipts.push({engine,script_studio:'development module under synthetic responses only',file_import:true,original_preserved:true,details_rendered:100,ledger_rows:100,csv_download:true,credit_failure_preserved:true,keyboard_simulation:keyboard,errors});assert.deepEqual(errors,[]);
   await context.close();currentPage=null;
  }catch(error){await currentPage?.screenshot({path:proof+'/failure.png',timeout:4000}).catch(()=>{});throw error;}finally{await browser.close();}
 }
 await writeFile(proof+'/phone-receipt.json',JSON.stringify({pass:true,provider:'All model/backend results simulated. No live AI or physical-device claim.',receipts},null,2));console.log(JSON.stringify({pass:true,checks:receipts.length,engines:['chromium','webkit']}));
}catch(e){await currentPage?.screenshot({path:`${proof}/failure.png`,timeout:4000}).catch(()=>{});await writeFile(proof+'/failure.json',JSON.stringify({error:e.message,at:currentName,errors,receipts},null,2));throw e;}
finally{clearTimeout(deadline);server.close();}
