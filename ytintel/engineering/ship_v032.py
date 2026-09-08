from pathlib import Path
import json,re
root=Path('ytintel/latest')
def put(path,text): Path(path).write_text(text)
def replace_one(text,old,new):
    if new in text:return text
    if text.count(old)!=1:raise RuntimeError('Source drift: '+old[:100])
    return text.replace(old,new)
p=root/'v320-script-studio.js';s=p.read_text()
s=replace_one(s,"window.addEventListener('ytintel:auth',()=>{const uid=currentUser();if(uid!==owner&&owner!==null)","window.addEventListener('ytintel:auth',()=>{const uid=currentUser();if(uid===owner)return;if(uid!==owner&&owner!==null)")
s=replace_one(s,"async function pump(){stop=false;buttonBusy(true);", "async function pump(){const pumpOwner=currentUser();stop=false;buttonBusy(true);")
s=replace_one(s,"state=await call('state',{run_id:active});progress(state);if(state.result", "state=await call('state',{run_id:active});if(currentUser()!==pumpOwner){state=null;break}progress(state);if(state.result")
p.write_text(s)
p=Path('ytintel/backend/script-v032.mjs');s=p.read_text()
s=replace_one(s,"return finishModel(run,job,await provider('responses/'+encodeURIComponent(old.response_id)))}", "try{return await finishModel(run,job,await provider('responses/'+encodeURIComponent(old.response_id)))}catch(e){await db(sp(run.id,job.key),'PATCH',{status:'failed',error_code:e.code||'STAGE_FAILED',error_detail:clean(e.message).slice(0,800),finished_at:new Date().toISOString()}).catch(()=>{});throw e}}")
s=replace_one(s,"if(action==='retry'){const allowed=", "if(action==='retry'){if(Number(run.config.retry_count||0)>=3)throw fail('RETRY_LIMIT','This project reached its retry safety limit. Start a new version after resolving the blocker.',429);const allowed=")
s=replace_one(s,"await db(rp(run.id),'PATCH',{status:'researching'});return json({ok:true})", "await db(rp(run.id),'PATCH',{status:'researching',config:{...run.config,retry_count:Number(run.config.retry_count||0)+1}});return json({ok:true})")
p.write_text(s)
p=root/'v320-script-contract.mjs';s=p.read_text()
s=s.replace("replace(/[^a-z0-9 ]/g,'')","replace(/[^\\p{L}\\p{N} ]/gu,'')")
s=replace_one(s,"export function validateOutput(kind,d,input){const errors=[];", "const numbers=x=>(String(x||'').replace(/(\\d),(?=\\d{3}(?:\\D|$))/g,'$1').match(/\\b\\d+(?:\\.\\d+)?\\b/g)||[]);\nexport function validateOutput(kind,d,input){const errors=[];")
s=replace_one(s,"if(g.kind==='stated'&&members.some(x=>x.kind!=='stated'))errors.push('UNCERTAINTY_UPGRADED')", "if(g.kind==='stated'&&members.some(x=>x.kind!=='stated'))errors.push('UNCERTAINTY_UPGRADED');const allowedNumbers=new Set(numbers(members.map(m=>m.claim+' '+m.qualifier+' '+m.receipts.map(r=>r.quote).join(' ')).join(' ')));if(numbers(g.claim+' '+g.qualifier).some(n=>!allowedNumbers.has(n)))errors.push('INVENTED_GROUP_NUMBER')")
s=replace_one(s,"if(A(d.lines).some(x=>clean(x.text).length<8))errors.push('EMPTY_SCRIPT_LINE')", "if(A(d.lines).some(x=>clean(x.text).length<8))errors.push('EMPTY_SCRIPT_LINE');for(const line of A(d.lines)){const detail=input.details.find(x=>x.id===line.detail_id);if(detail&&numbers(line.text).some(n=>!new Set(numbers(detail.claim+' '+detail.qualifier)).has(n)))errors.push('INVENTED_SCRIPT_NUMBER')}")
s=replace_one(s,"const quote=x=>'\"'+String(x??'').replaceAll('\"','\"\"')+'\"';", "const quote=x=>{let t=String(x??'');if(/^[=+@\\-\\t\\r]/.test(t))t=\"'\"+t;return '\"'+t.replaceAll('\"','\"\"')+'\"'};")
p.write_text(s)
p=root/'index.html';s=p.read_text()
if 'v320-script-studio.js' not in s:s=replace_one(s,'</body>','<script type="module" src="v320-script-studio.js?v=0320"></script>\n</body>')
s=s.replace("window.YTINTEL_VERSION='0.31.0'","window.YTINTEL_VERSION='0.32.0'").replace('v=0310','v=0320');p.write_text(s)
for file in ['v201-always-on.js','v300-core-analysis.js']:
 p=root/file;s=p.read_text().replace('0.31.0','0.32.0').replace('v=0310','v=0320');p.write_text(s)
p=root/'sw.js';s=p.read_text();s=re.sub(r"const CACHE='ytintel-shell-v0310[^']*'","const CACHE='ytintel-shell-v0320'",s);s=s.replace("const V='0310'","const V='0320'")
if 'v320-script-studio.js' not in s:s=s.replace('const CORE=[','const CORE=[`./v320-script-studio.js?v=${V}`,`./v320-script-contract.mjs?v=${V}`,`./v320-script-studio.css?v=${V}`,')
p.write_text(s)
for file in ['ytintel/tests/production-v031.mjs','ytintel/tests/full-shell-smoke.mjs']:
 p=Path(file);p.write_text(p.read_text().replace('0.31.0','0.32.0'))
p=Path('.github/workflows/ytintel-v300-ci.yml');s=p.read_text().replace('ytintel-shell-v0310','ytintel-shell-v0320');p.write_text(s)
release={
'release_id':'ytintel-0.32.0-script-studio', 'version':'v0.32.0', 'title':'Script Studio - Sources Into Scripts',
'summary':'Paste your AI-style request, source videos and existing draft. Research every caption chunk, merge overlapping details and write into your existing tiers. Actual AI output still requires working provider credits.',
'discord_changes':['New Script Studio inside Analyse: multiple videos + your existing script + your own brief.','Two-pass detail extraction, deduplication, source receipts and rapid-fire tier writing; no padding to reach 100.','Private versions and source-pack exports. AI drafting remains subject to the existing API-credit blocker.'],
'changes':['Added Video analysis / Script Studio modes without restoring retired navigation.','Accepts one to four full YouTube videos, a pasted or TXT/Markdown script, explicit tiers and a target of up to 200 total details.','Preserves the original script and its tier order.','Runs lead editing, parallel chunk extraction and coverage audits, semantic deduplication, tier-writing batches and independent editorial review.','Keeps conflicting claims out of the script and labels rumors/inferences rather than presenting them as confirmed.','Reports actual count, shortfall, added/retained detail counts and duplicates merged; preserves extra details in an appendix.','Links each detail to source caption blocks or original-script lines.','Saves projects privately with server-validated ownership and row-level security.','Adds pause/resume, explicit bounded retries, saved versions, Markdown and fact-ledger CSV exports.','Allows exporting gathered source evidence even when AI drafting is blocked.'],
'known_limitations':['Video evidence is caption-backed; not every visual-only or audio-only detail is inspected.','All caption chunks are accounted for, but automatic fact extraction is not guaranteed exhaustive.','Source-stated claims are not independently verified. No external fact checking is silently added.','The existing API account has previously returned CREDIT_BALANCE_EXHAUSTED; live AI script quality is unverified until a funded run passes.','Projects support TXT/Markdown import or pasted script text; other formats must be pasted as text.'],
'why_it_matters':'The requested outcome is a usable, traceable rewrite in the creator\'s own structure - not another transcript summary.'}
(root/'release.json').write_text(json.dumps(release,indent=2)+'\n')
print('Script Studio integration applied; provider availability is not implied.')
