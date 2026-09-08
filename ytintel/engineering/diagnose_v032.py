from pathlib import Path
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
p.write_text(s)
print('Auth notifications now reconcile UI without refreshing auth recursively.')
