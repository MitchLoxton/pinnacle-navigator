import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

await mkdir('ytintel-v390-proof',{recursive:true});
const root=process.cwd();
const server=createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!path.startsWith(root+'/'))throw Error('bad path');if(path.endsWith('/latest')||path.endsWith('/latest/'))path=resolve(path,'index.html');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[extname(path)]||'text/plain');res.end(await readFile(path));}catch{res.statusCode=404;res.end('not found')}});
await new Promise(r=>server.listen(8769,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/ytintel-v0|api\.openai\.com/i.test(r.url()))requests.push(r.url())});
try{
  await page.goto('http://127.0.0.1:8769/ytintel/latest/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.YTIntelStableShell?.coreReady===true&&window.YTIntelStableShell?.intelligenceReady===true,null,{timeout:30000});
  const boot=await page.evaluate(()=>({scripts:document.scripts.length,version:document.querySelector('#version')?.textContent,shell:document.documentElement.dataset.ytintelShell,wpmGuard:!!window.YTIntelWpmGuard}));
  assert.equal(boot.scripts,1,'HTML must have one script owner');assert.equal(boot.version,'v0.39.0');assert.equal(boot.shell,'stable');assert.equal(boot.wpmGuard,true,'WPM guard missing');
  const tab=async n=>{await page.locator(`[data-tab="${n}"]`).click();await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),n)};
  await tab('vault');
  await page.locator('#creator_niche').fill('YouTube creator education');await page.locator('#creator_subniche').fill('AI content systems');await page.locator('#creator_audience').fill('YouTube creators');await page.locator('#creator_brand').fill('Evidence first. Never copy source wording.');await page.locator('#saveCreator').click();
  await tab('analyse');await page.setViewportSize({width:390,height:844});
  for(const n of ['competitors','vault','analyse']){await page.locator(`[data-dock="${n}"]`).click();await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),n)}
  const mobile=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert(mobile.scroll<=mobile.viewport+1,`mobile overflow ${mobile.scroll}>${mobile.viewport}`);
  await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=GzhT10i4vag');await page.locator('#analyseBtn').click();
  await page.waitForFunction(()=>!document.querySelector('#progressCard')?.classList.contains('hidden'),null,{timeout:10000});
  await page.locator('[data-dock="vault"]').click();await page.waitForFunction(()=>document.querySelector('#vault')?.classList.contains('active'));await page.locator('[data-dock="analyse"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('#report > .section').length>=17||(document.querySelector('#analyseError')?.textContent||'').trim().length>0,null,{timeout:210000});
  await page.waitForFunction(()=>document.documentElement.dataset.ytintelIntelligence==='v390'||(document.querySelector('#analyseError')?.textContent||'').trim().length>0,null,{timeout:15000});
  const result=await page.evaluate(()=>({sections:document.querySelectorAll('#report > .section').length,error:(document.querySelector('#analyseError')?.textContent||'').trim(),pct:document.querySelector('#progressPct')?.textContent||'',buttonDisabled:document.querySelector('#analyseBtn')?.disabled,summary:document.querySelector('#report > .section[data-section="2"]')?.innerText||'',takeaways:document.querySelector('#report > .section[data-section="3"]')?.innerText||'',audio:document.querySelector('#report > .section[data-section="11"]')?.innerText||'',remake:document.querySelector('#report > .section[data-section="14"]')?.innerText||'',review:document.querySelector('#report > .section[data-section="16"]')?.innerText||'',version:document.querySelector('#version')?.textContent,active:document.querySelector('.view.active')?.id,intelligence:document.documentElement.dataset.ytintelIntelligence,wpm:window.__YTINTEL_SOURCE_REPORT?.pacing?.video_words_per_minute??null,totalWords:window.__YTINTEL_SOURCE_REPORT?.pacing?.total_words??null,rawWpm:window.__YTINTEL_SOURCE_REPORT?.pacing?.raw_reported_words_per_minute??null}));
  assert.equal(result.error,'',result.error);assert(result.sections>=17,`only ${result.sections} sections`);assert.equal(result.pct,'100%');assert.equal(result.buttonDisabled,false);assert.equal(result.version,'v0.39.0');assert.equal(result.active,'analyse');assert.equal(result.intelligence,'v390');
  assert.match(result.summary,/INTELLIGENCE PASS/i);assert.match(result.summary,/Receipt:/i);assert(!/evidence-mode watch replacement/i.test(result.summary),'old evidence fallback survived');
  assert.match(result.takeaways,/(ACTIONABLE TAKEAWAYS|FACT \/ LIST VIDEO MODE)/i);assert.match(result.takeaways,/Receipt:/i);
  assert(Number.isFinite(Number(result.wpm))&&Number(result.wpm)>=80&&Number(result.wpm)<=330,`implausible corrected WPM ${result.wpm}; raw ${result.rawWpm}`);assert(Number(result.totalWords)>500,`deduped words too low: ${result.totalWords}`);assert.match(result.audio,new RegExp(String(result.wpm).replace('.','\\.')));
  assert.match(result.remake,/CREATOR-DNA BLUEPRINT/i);assert.match(result.remake,/AI content systems/i);assert.match(result.review,/INDEPENDENT DETERMINISTIC CROSS-CHECK/i);assert(!/692\.7 WPM/.test(result.review),'old broken WPM leaked into review');
  assert.deepEqual(errors,[],errors.join(' | '));assert(!requests.some(x=>/ytintel-v093|api\.openai\.com/i.test(x)),`paid/model route called: ${requests.join(', ')}`);
  await page.screenshot({path:'ytintel-v390-proof/mobile.png',fullPage:true});
  const receipt={pass:true,boot,result,mobile,errors,requests:requests.map(x=>x.replace(/\?.*$/,'')),checked_at:new Date().toISOString()};await writeFile('ytintel-v390-proof/receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
}finally{await browser.close();server.close()}
