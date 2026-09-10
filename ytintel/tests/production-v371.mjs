import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('ytintel-live-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addInitScript(()=>{try{localStorage.setItem('ytintel-v350-profile',JSON.stringify({niche:'GTA 6',subniche:'GTA 6 money/news',channel:'@ytinteltest',audience:'GTA 6 players',competitors:'Blake Ryan',brand:'Proof over hype. No guru language. Use only provable claims.',complete:true}))}catch{}});
const page=await context.newPage();
page.setDefaultTimeout(60000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/?qa=v0371-'+Date.now();
try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.1'&&!document.querySelector('#boot')&&!document.querySelector('#app')?.hidden,null,{timeout:120000});
  const shell=await page.evaluate(()=>({
    version:window.YTINTEL_VERSION,
    creatorInAnalyse:!!document.querySelector('#analyse #creatorCard'),
    creatorInVault:!!document.querySelector('#vault #creatorCard'),
    progressClass:document.querySelector('#progressCard')?.className||''
  }));
  assert.equal(shell.version,'0.37.1');
  assert.equal(shell.creatorInAnalyse,false,'Creator DNA must not live in Analyse');
  assert.equal(shell.creatorInVault,true,'Creator DNA should live outside Analyse');
  assert.match(shell.progressClass,/v371-compact-progress/);

  await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=GzhT10i4vag');
  await page.locator('#analyseBtn').click();
  await page.waitForFunction(()=>document.querySelector('#report')?.dataset.v363Premium==='1',null,{timeout:360000});
  await page.waitForFunction(()=>window.__YTINTEL_FEEDBACK_OVERHAUL?.version==='0.37.1',null,{timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#progressPct')?.textContent==='100%',null,{timeout:60000});
  await page.waitForFunction(()=>!!document.querySelector('#v364-channel-stats'),null,{timeout:60000});
  await page.waitForTimeout(500);

  const result=await page.evaluate(()=>{
    const sec=n=>document.querySelector(`#report [data-section="${n}"]`),txt=n=>sec(n)?.innerText||'';
    const sections=[...document.querySelectorAll('#report [data-section]')];
    return {
      count:sections.length,
      titles:sections.map(s=>s.querySelector('h2')?.textContent.trim()),
      strip:txt(1),summary:txt(2),takeaways:txt(3),rehooks:txt(5),payoffs:txt(6),replay:txt(7),packaging:txt(12),channel:txt(15),make:txt(16),vaultHidden:getComputedStyle(sec(17)).display==='none',exportText:txt(18),
      takeawayRows:sec(3)?.querySelectorAll('.v371-row').length||0,
      activityDetails:!!document.querySelector('#progressCard details#v371-activity'),
      activityOpen:document.querySelector('#progressCard details#v371-activity')?.open||false,
      packageVault:!!document.querySelector('#v371-package-vault'),
      exportButtons:[...sec(18)?.querySelectorAll('button')||[]].map(x=>x.textContent.trim()),
      markdown:window.__YTINTEL_FULL_MARKDOWN||'',
      pct:document.querySelector('#progressPct')?.textContent||'',
      progressMsg:document.querySelector('#progressMsg')?.textContent||''
    };
  });
  assert.equal(result.count,18);
  assert.equal(result.pct,'100%');
  assert(result.activityDetails&&!result.activityOpen,'Activity must be folded by default');
  assert(result.vaultHidden,'Vault entry must be hidden from Analyse');
  for(const label of ['What the video is','How it is built','How it is doing','What appears to matter','What is worth taking'])assert(result.summary.includes(label),`summary missing ${label}`);
  assert(!result.summary.includes('The video develops the promise in its title through examples, evidence and a final action.'),'generic summary slop survived');
  assert(result.takeawayRows>=5,`expected >=5 takeaways, got ${result.takeawayRows}`);
  assert(!/No strong deterministic takeaways/i.test(result.takeaways));
  assert(/attention resets detected|No defensible attention resets/i.test(result.rehooks));
  assert(/First payoff|No source-backed payoff/i.test(result.payoffs));
  assert(/Replay curve available|No public Most Replayed curve/i.test(result.replay));
  assert(result.packageVault&&/Packaging vault receipt/i.test(result.packaging));
  assert(/Context used:/i.test(result.make)&&/Direction 1/i.test(result.make)&&/Title variants/i.test(result.make)&&/Exact hook direction/i.test(result.make)&&/Beat sheet/i.test(result.make)&&/Thumbnail composition/i.test(result.make)&&/Steal this/i.test(result.make)&&/Do not copy that/i.test(result.make)&&/Measure after publishing/i.test(result.make));
  assert(result.exportButtons.includes('Copy full analysis Markdown'));
  assert(result.exportButtons.includes('Download Markdown'));
  assert(result.markdown.startsWith('# YTIntel Analysis —'));
  assert(!/\bSubscribers\s+0\b/i.test(result.channel),'channel context still displays subscriber zero');
  assert(!/\bNiche\s+GTA 6\b/i.test(result.strip),'Creator DNA leaked into source niche');
  assert.equal(errors.length,0,errors.join('\n'));
  await page.screenshot({path:'ytintel-live-proof/v371-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
  const mobile=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
  assert(mobile.width<=mobile.viewport+2,`mobile overflow ${mobile.width}`);
  await writeFile('ytintel-live-proof/v371-receipt.json',JSON.stringify({pass:true,url,result,mobile,errors},null,2));
  console.log('V371_LIVE_PASS',JSON.stringify({pass:true,count:result.count,pct:result.pct,takeawayRows:result.takeawayRows,vaultHidden:result.vaultHidden,packageVault:result.packageVault,exportButtons:result.exportButtons,mobile,errors},null,2));
}finally{await browser.close()}
