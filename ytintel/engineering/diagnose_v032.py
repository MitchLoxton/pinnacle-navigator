from pathlib import Path
import json
p=Path('ytintel/latest/v295-core-hardening.js');s=p.read_text()
old="window.addEventListener('ytintel:auth',refreshAuth)"
new="window.addEventListener('ytintel:auth',repairAuthSurface)"
if old in s:
 if s.count(old)!=1:raise RuntimeError('Auth listener source drift')
 s=s.replace(old,new)
 p.write_text(s)
else:
 if new not in s:raise RuntimeError('Expected canonical auth event handler')
p=Path('ytintel/tests/script-studio-browser.mjs');s=p.read_text()
old="JSON.stringify({error:e.message,errors,calls},null,2)"
new="JSON.stringify({error:e.message,errors,calls,dom:await page.evaluate(()=>({message:document.querySelector('#yt320Message')?.textContent,formValid:document.querySelector('#yt320Form')?.checkValidity(),inputValidity:[...document.querySelectorAll('#yt320Form input,#yt320Form textarea')].map(x=>({id:x.id,valid:x.checkValidity(),message:x.validationMessage,value:x.type==='file'?'':x.value})),auth:window.YTIntelAuth?.user?.id||null,submit:String(document.querySelector('#yt320Form')?.onsubmit),events:window.__studioTestEvents||[]}))},null,2)"
if old in s:s=s.replace(old,new)
old="page.on('pageerror',e=>errors.push(e.message));"
new="page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.__studioTestEvents=[];document.addEventListener('click',e=>{if(e.target.id?.startsWith('yt320'))window.__studioTestEvents.push('click:'+e.target.id)},true);document.addEventListener('submit',e=>window.__studioTestEvents.push('submit:'+e.target.id),true)});"
if 'window.__studioTestEvents=[]' not in s and old in s:s=s.replace(old,new)
s=s.replace("await page.locator('#yt320History>summary').click();await page.waitForSelector('[data-open-run]');","await page.locator('#yt320History>summary').click();await page.locator('.yt320-saved>summary').first().click();await page.waitForSelector('[data-open-run]');")
p.write_text(s)
p=Path('ytintel/latest/release.json');d=json.loads(p.read_text());d['summary']='Script Studio is live: videos + your draft into one tiered script. AI drafting needs API credits; real AI rewrite quality is not yet verified.';d['discord_changes']=['Your brief + up to four videos + your script, in one workspace.','Duplicate checks, source receipts and your original tiers. No filler to reach 100.','Private versions + exports. AI drafting still needs working API credits.'];d['changes'].append('Fixed a pre-existing auth notification loop that recursively refreshed the session and blocked submissions.');p.write_text(json.dumps(d,indent=2)+'\n')
print('Auth notifications reconcile UI without recursive refresh; saved folders are tested as users open them.')
