import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const proof='ytintel-live-proof';await mkdir(proof,{recursive:true});
const url='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/?qa=v031-live-'+Date.now();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage(),errors=[],requests=[],failures=[];
page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
// Record action names and status only. Never log auth headers or per-run capability tokens.
page.on('response',async response=>{try{const u=new URL(response.url());if(!u.hostname.endsWith('supabase.co'))return;const action=u.searchParams.get('action');if(!action)return;requests.push({action,status:response.status()});if(action==='research-stage'&&!response.ok()){const j=await response.json().catch(()=>({}));failures.push({action,status:response.status(),code:j.code||j.error||'unknown'});}}catch{}});
const hardStop=setTimeout(()=>{console.error('Production browser deadline exceeded');process.exit(2)},810000);
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.YTIntelDeepResearch&&document.documentElement.dataset.yt300CoreAnalysis==='1'&&window.YTINTEL_VERSION==='0.32.0',null,{timeout:60000});
 await page.waitForTimeout(1500);
 const before=await page.evaluate(()=>({version:window.YTINTEL_VERSION,active:document.querySelector('.view.active')?.id,auth:document.documentElement.dataset.ytintelAuth,buttons:document.querySelectorAll('#analyseForm>button.primary').length,tour:document.querySelector('#v20Tour.show')!==null,dock:[...document.querySelectorAll('#mobileDock [data-dock]')].map(x=>x.dataset.dock)}));
 assert.equal(before.version,'0.32.0');assert.equal(before.active,'analyse');assert.equal(before.buttons,1);assert.equal(before.tour,false);assert.deepEqual(before.dock,['analyse','os','history']);
 await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=GzhT10i4vag');
 await page.locator('#analyseForm>button.primary').click({timeout:15000});
 await page.waitForSelector('#yt300Progress[data-phase="running"]',{timeout:15000});
 const animation=await page.locator('.yt300-progressbar').evaluate(e=>getComputedStyle(e,':after').animationName);assert.equal(animation,'yt310-sweep');
 await page.waitForSelector('#yt300Progress[data-phase="stopped"]',{timeout:730000});
 await page.waitForSelector('#yt300Report>.yt300-section:nth-child(17)',{timeout:10000});
 const result=await page.evaluate(()=>({version:window.YTINTEL_VERSION,heads:[...document.querySelectorAll('#yt300Report>.yt300-section .yt300-stepno')].map(e=>Number(e.textContent)),deep:window.YTIntelLastReport?.deep_research,pct:document.querySelector('#yt300Pct')?.textContent,text:document.querySelector('#yt300Report')?.innerText||'',summary:document.querySelector('#yt300Report>.yt300-section:nth-child(2)')?.innerText||'',takeaways:document.querySelector('#yt300Report>.yt300-section:nth-child(3)')?.innerText||'',submit_enabled:!document.querySelector('#analyseForm>button.primary')?.disabled,source_segments:window.YTIntelLastReport?.transcript?.segments?.length||0,md:window.YTIntelDeepResearch.reportMarkdown(document.querySelector('#yt300Report')),vault_count:JSON.parse(localStorage.getItem('ytintel-v300-analysis-vault')||'[]').length}));
 assert.deepEqual(result.heads,Array.from({length:17},(_,i)=>i+1));assert(result.source_segments>0);assert(result.submit_enabled);assert(requests.some(r=>r.action==='research-begin'));assert(requests.some(r=>r.action==='research-stage'));
 const reviewed=result.deep?.status==='model_reviewed';
 if(!reviewed){assert.equal(result.deep?.error_code,'CREDIT_BALANCE_EXHAUSTED','Only the independently confirmed credit blocker is an expected incomplete result');assert.notEqual(result.pct,'100%');assert(result.summary.includes('Transcript excerpts are not being substituted'));assert(result.takeaways.includes('Transcript excerpts are not being substituted'));assert.equal(result.vault_count,0);assert(result.md.includes('Report incomplete'));}
 else {assert(result.deep.model_calls>=8);assert(result.summary.includes('What the video actually argues'));assert(result.vault_count>0);}
 await page.locator('#yt300Report').scrollIntoViewIfNeeded();await page.screenshot({path:proof+'/desktop-report.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
 await page.locator('#yt300Progress').scrollIntoViewIfNeeded();await page.screenshot({path:proof+'/mobile-progress.png'});
 await page.locator('#yt300Report>.yt300-section:nth-child(2)').scrollIntoViewIfNeeded();await page.screenshot({path:proof+'/mobile-summary.png'});
 const dimensions=await page.evaluate(()=>({viewport:innerWidth,document_width:document.documentElement.scrollWidth}));
 assert(dimensions.document_width<=dimensions.viewport+2,'Mobile page overflows horizontally');
 assert.equal(errors.length,0,'The deployed app must have no JavaScript errors');
 const receipt={pass:true,test:'real deployed frontend + real source/backend; no mocked responses',before,version:result.version,sections:result.heads,source_segments:result.source_segments,model_status:result.deep?.status,model_error:result.deep?.error_code||null,model_pipeline_completed:reviewed,benchmark_quality_verified:false,progress:result.pct,animation,dimensions,requests,failures,errors,finished_at:new Date().toISOString()};
 await writeFile(proof+'/receipt.json',JSON.stringify(receipt,null,2));await writeFile(proof+'/report.md',result.md);
 console.log(JSON.stringify(receipt,null,2));
}catch(e){await writeFile(proof+'/failure.json',JSON.stringify({pass:false,error:e.message,errors,requests,failures},null,2));await page.screenshot({path:proof+'/failure.png',timeout:5000}).catch(()=>{});throw e;}
finally{clearTimeout(hardStop);await browser.close();}
