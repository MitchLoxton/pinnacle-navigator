import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {report,outputs} from './fixture.mjs';
import {buildEvidence,validateStage} from '../latest/v310-contract.mjs';
const ROOT=process.cwd(),proof=resolve('ytintel-test-proof');await mkdir(proof,{recursive:true});
const html=`<!doctype html><html><head><link rel="stylesheet" href="/ytintel/latest/v300-core-analysis.css"></head><body><nav class="tabs"><button data-tab="analyse">Analyse</button><button data-tab="history">Vault</button></nav><section class="view active" id="analyse"><div class="hero"><div class="eyebrow"></div><h1></h1><p></p><form id="analyseForm"><input id="videoUrl"><button>Analyse</button></form></div><div id="loading"></div><div id="error"></div><div id="report"></div></section><section id="history"><div class="hero"></div></section><section id="updates"><div class="grid"></div></section><script>let lastReport=null;window.YTIntelAuth={signedIn:false};window.YTIntelToast=()=>{};</script><script src="/ytintel/latest/v310-deep-research.js"></script><script>window.YTIntelDeepResearch.ready.then(()=>{const s=document.createElement('script');s.src='/ytintel/latest/v300-core-analysis.js';document.body.appendChild(s)})</script></body></html>`;
const server=createServer(async(req,res)=>{try{if(req.url.startsWith('/harness')){res.setHeader('Content-Type','text/html');res.end(html);return;}const path=resolve(ROOT,'.'+decodeURIComponent(req.url.split('?')[0]));if(!path.startsWith(ROOT+'/'))throw Error('bad path');const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};res.setHeader('Content-Type',types[extname(path)]||'text/plain');res.end(await readFile(path));}catch{res.statusCode=404;res.end('not found');}});await new Promise(r=>server.listen(8765,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});const results=[];
const deadline=setTimeout(()=>{console.error('browser-test hard deadline exceeded');process.exit(2);},120000);
try{
 for(const mode of ['valid','credit','echo']){
  const context=await browser.newContext({viewport:{width:mode==='valid'?1440:390,height:900}}),page=await context.newPage(),calls=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());if(u.origin==='http://127.0.0.1:8765')return route.continue();
   if(u.hostname.endsWith('supabase.co')){
    const action=u.searchParams.get('action'),body=req.postDataJSON()||{};let data;
    if(action==='research-begin')data={ok:true,run_id:'fixture',token:'in-memory-test-token',model:'synthetic-fixture'};
    else if(action==='research-stage'){
     calls.push(body.stage);
     await new Promise(r=>setTimeout(r,200));
     if(mode==='credit')return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({ok:false,code:'CREDIT_BALANCE_EXHAUSTED'})});
     const out=structuredClone(outputs[body.stage]);
     if(mode==='echo'&&body.stage==='summary')out.beats[0].meaning=report.transcript.segments[0].text;
     data={ok:true,data:out,checks:validateStage(body.stage,out,buildEvidence(report)),model:'synthetic-fixture',source:'model',fallback:false};
    }else if(action==='analyze')data={ok:true,report:structuredClone(report)};else data={ok:true,discovery:{videos:[]}};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
   }
   return route.fulfill({status:404,body:'Deliberately unavailable public media in test'});
  });
  await page.goto('http://127.0.0.1:8765/harness');
  await page.waitForFunction(()=>document.documentElement.dataset.yt300CoreAnalysis==='1');
  await page.fill('#videoUrl','https://www.youtube.com/watch?v=QAfixture01');await page.click('#analyseForm button');
  await page.waitForSelector('#yt300Progress[data-phase="running"]');
  const animation=await page.$eval('.yt300-progressbar',e=>getComputedStyle(e,':after').animationName);assert.equal(animation,'yt310-sweep');
  await page.waitForSelector('#yt300Progress[data-phase="stopped"]',{timeout:40000});
  await page.waitForSelector('#yt300Report > .yt300-section:nth-child(17)',{timeout:5000});
  const state=await page.evaluate(()=>({text:document.querySelector('#yt300Report').innerText,heads:[...document.querySelectorAll('#yt300Report>.yt300-section .yt300-stepno')].map(e=>Number(e.textContent)),deep:window.YTIntelLastReport?.deep_research,vault:JSON.parse(localStorage.getItem('ytintel-v300-analysis-vault')||'[]'),pct:document.querySelector('#yt300Pct').textContent,md:window.YTIntelDeepResearch.reportMarkdown(document.querySelector('#yt300Report'))}));
  assert.deepEqual(state.heads,Array.from({length:17},(_,i)=>i+1));assert(!state.text.includes('BAD RAW OVERRIDE'));
  if(mode==='valid'){assert.equal(state.deep.status,'model_reviewed');assert.equal(calls.length,8);assert(state.text.includes('Control observation timing'));assert(state.md.includes('Original direction 2, beat 4'));assert(state.vault.length>0);}else{assert.notEqual(state.deep.status,'model_reviewed');assert.equal(state.vault.length,0);assert.notEqual(state.pct,'100%');assert(state.text.includes('Report incomplete'));assert(!calls.includes('remake'));}
  if(mode==='credit')assert(state.text.includes('exhausted its credit balance'));
  if(mode==='echo')assert(calls.filter(x=>x==='summary').length===2);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:resolve(proof,mode+'.png'),fullPage:false});
  results.push({mode,pass:true,sections:state.heads.length,model_calls_mocked:calls,deep_status:state.deep.status,animation,pct:state.pct});
  await context.close();
 }
 await writeFile(resolve(proof,'results.json'),JSON.stringify({provider:'synthetic fixtures only; not live model quality proof',results},null,2));
 console.log(JSON.stringify(results,null,2));
}finally{clearTimeout(deadline);await browser.close();server.close();}
