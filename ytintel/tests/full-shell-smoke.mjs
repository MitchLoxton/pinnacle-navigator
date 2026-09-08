import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {report} from './fixture.mjs';
const root=process.cwd();await mkdir('ytintel-test-proof',{recursive:true});
const server=createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!path.startsWith(root+'/'))throw Error('path');if(path.endsWith('/latest'))path+='/index.html';const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[extname(path)]||'text/plain');res.end(await readFile(path));}catch{res.statusCode=404;res.end('not found');}});await new Promise(r=>server.listen(8766,'127.0.0.1',r));
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
const stop=setTimeout(()=>{console.error('full-shell test deadline exceeded');process.exit(2);},70000);
try{
 await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin==='http://127.0.0.1:8766'||/jsdelivr.net|esm.sh/.test(u.hostname))return route.continue();if(!u.hostname.endsWith('supabase.co'))return route.fulfill({status:404,body:'External media unavailable in test'});const a=u.searchParams.get('action');let d={ok:true,version:'0.31.0',configured:true,always_on:true,enhancement_configured:true,discovery:{videos:[]}};if(a==='analyze')d={ok:true,report:structuredClone(report)};if(a==='research-begin')d={ok:true,run_id:'fixture',token:'test-capability',model:'synthetic-fixture'};if(a==='research-stage')return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({ok:false,code:'CREDIT_BALANCE_EXHAUSTED'})});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)});});
 console.log('Opening full application shell');
 await page.goto('http://127.0.0.1:8766/ytintel/latest/index.html',{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>window.YTIntelDeepResearch&&document.documentElement.dataset.yt300CoreAnalysis==='1'&&document.documentElement.dataset.ytintelAppReady==='0.31.0',null,{timeout:25000});
 await page.waitForTimeout(1500);
 await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=QAfixture01');
 await page.locator('#analyseForm > button.primary').click({timeout:5000});
 await page.waitForSelector('#yt300Progress[data-phase="stopped"]',{timeout:20000});
 const d=await page.evaluate(()=>({sections:document.querySelectorAll('#yt300Report>.yt300-section').length,text:document.querySelector('#yt300Report')?.innerText||'',pct:document.querySelector('#yt300Pct')?.textContent,active:document.querySelector('.view.active')?.id,version:window.YTINTEL_VERSION}));
 assert.equal(d.version,'0.31.0');assert.equal(d.sections,17);assert.equal(d.active,'analyse');assert(d.text.includes('exhausted its credit balance'));assert.notEqual(d.pct,'100%');
 await page.screenshot({path:'ytintel-test-proof/full-shell-mobile.png',timeout:5000});
 await writeFile('ytintel-test-proof/full-shell.json',JSON.stringify({pass:errors.length===0,sections:d.sections,active:d.active,pct:d.pct,errors,provider:'mocked credit failure; full real application assets'},null,2));
 console.log(JSON.stringify({sections:d.sections,active:d.active,pct:d.pct,errors}));
 assert.equal(errors.length,0,'Application JavaScript errors must be fixed before publication');
}catch(e){console.error('Full-shell failure',e.message,JSON.stringify(errors));await page.screenshot({path:'ytintel-test-proof/full-shell-failure.png',timeout:3000}).catch(()=>{});throw e;}finally{clearTimeout(stop);await browser.close();server.close();}
