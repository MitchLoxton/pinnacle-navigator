from pathlib import Path
import re,json
root=Path('ytintel/latest')
def patch(s,a,b):
 if b in s:return s
 if s.count(a)!=1:raise RuntimeError('Source drift: '+a[:100])
 return s.replace(a,b)
p=root/'v320-script-contract.mjs';s=p.read_text()
if "from './v320-source-overrides.mjs'" not in s:s="import {manualTranscripts,addReceiptLocations,receiptsMarkdown} from './v320-source-overrides.mjs';\n"+s
s=patch(s,"return {script,brief,urls,tiers,target,include_uncertain:b.include_uncertain===true}","return {script,brief,urls,tiers,target,transcripts:manualTranscripts(b.transcripts,urls),include_uncertain:b.include_uncertain===true}")
s=patch(s,"export function resultFrom(config,sources,ledger,steps){const wrapper=", "export function resultFrom(config,sources,ledger,steps){ledger=addReceiptLocations(ledger,sources);const wrapper=")
lines=s.splitlines()
for i,l in enumerate(lines):
 if l.startswith('export function markdown(') and 'receiptsMarkdown(r)' not in l:lines[i]=l[:-1]+'+receiptsMarkdown(r)}'
s='\n'.join(lines)+'\n';s=s.replace("x.source_id+'/'+x.segment_id+': '+x.quote","x.source_id+'/'+x.segment_id+': '+x.quote+' '+(x.source_url||'')");p.write_text(s)
p=Path('ytintel/backend/script-v032.mjs');s=p.read_text()
if "import {suppliedSource}" not in s:s="import {suppliedSource} from '../latest/v320-source-overrides.mjs';\n"+s
s=patch(s,"{url,index:i}));", "{url,index:i,transcript:config.transcripts?.[url]||''}));")
s=patch(s,"async function readSource(input){let d,r;", "async function readSource(input){if(input.transcript)return suppliedSource(input.transcript,input.url,input.index);let d,r;")
s=s.replace("if(raw.length>100000)","if(raw.length>260000)").replace('Request exceeds 100,000 characters.','Request exceeds 260,000 characters.');p.write_text(s)
p=root/'v320-script-studio.js';s=p.read_text()
if "import {scriptText}" not in s:s="import {scriptText} from './v320-source-overrides.mjs?v=0320';\n"+s
if 'function suppliedInputs()' not in s:
 s=s.replace("const currentUser=",'''let manualCache={};
function suppliedInputs(){const urls=urlsFrom(($('#yt320Brief')?.value||'')+'\\n'+($('#yt320Sources')?.value||''));return Object.fromEntries(urls.filter(u=>String(manualCache[u]||'').trim()).map(u=>[u,manualCache[u]]))}
function syncSupplied(urls){const root=$('#yt320Manual');if(!root||root.dataset.urls===urls.join('|'))return;root.dataset.urls=urls.join('|');root.innerHTML=urls.length?`<details><summary>Missing captions? Supply a transcript</summary><p class="yt320-fine">Optional fallback for videos whose captions cannot be retrieved. Paste the full transcript for that same video. Untimed text will not get made-up timestamps.</p>${urls.map((u,i)=>`<label>Video ${i+1} transcript<textarea rows="5" maxlength="160000" data-transcript-url="${E(u)}" placeholder="Leave blank to fetch captions automatically. Paste this video's transcript only when needed.">${E(manualCache[u]||'')}</textarea></label>`).join('')}</details>`:'';root.querySelectorAll('[data-transcript-url]').forEach(x=>x.oninput=()=>{manualCache[x.dataset.transcriptUrl]=x.value;persist()})}
function failure(code,text){if(code==='SOURCE_UNAVAILABLE'){const d=$('#yt320Manual details');if(d)d.open=true;text+=' Open Missing captions, supply the full transcript for that video, then click Build revised script to create a new version. The previous version stays saved.'}message(text,'warning')}
const currentUser=''',1)
 s=patch(s,"target:Number($('#yt320Target')?.value),include_uncertain:","target:Number($('#yt320Target')?.value),transcripts:suppliedInputs(),include_uncertain:")
 s=patch(s,"function restore(data){for(const", "function restore(data){manualCache={...(data.transcripts||{})};const box=$('#yt320Manual');if(box){box.innerHTML='';delete box.dataset.urls}for(const")
 lines=s.splitlines()
 for i,l in enumerate(lines):
  if l.startswith('function sourcePreview()') and 'syncSupplied(urls)' not in l:lines[i]=l[:-1]+';syncSupplied(urls)}'
 s='\n'.join(lines)+'\n'
 s=s.replace('<div id="yt320SourceList" class="yt320-source-links"></div>','<div id="yt320SourceList" class="yt320-source-links"></div><div id="yt320Manual"></div>')
 s=s.replace("message(failed.error_detail||failed.error_code,'warning')","failure(failed.error_code,failed.error_detail||failed.error_code)")
 s=s.replace("message(err.reason.message,'warning')","failure(err.reason.code,err.reason.message)")
 s=s.replace("const md=markdown(r);if(b.dataset.export==='copy')", "const md=b.dataset.export==='copy'?scriptText(r):markdown(r);if(b.dataset.export==='copy')")
 s=s.replace("if(uid!==owner&&owner!==null){stop=true;active=null;state=null;", "if(uid!==owner&&owner!==null){manualCache={};stop=true;active=null;state=null;")
# A supplied transcript without timestamps links to the video, never a fabricated 0:00.
lines=s.splitlines()
for i,l in enumerate(lines):
 if l.startswith('function receiptLinks('):
  lines[i]='''function receiptLinks(item,s){return A(item.receipts).map(r=>{const source=A(s.sources).find(x=>x.id===r.source_id),row=A(source?.segments).find(x=>x.id===r.segment_id),timed=typeof row?.start==='number'&&Number.isFinite(row.start),label=source?.kind==='video'?source.title+' · '+(timed?`${Math.floor(row.start/60)}:${String(Math.floor(row.start%60)).padStart(2,'0')}`:'untimed '+r.segment_id):'Original script · '+r.segment_id;const url=source?.url?(source.url+(timed?'&t='+Math.floor(row.start)+'s':'')):null;return `<div class="yt320-receipt">${url?`<a href="${E(url)}" target="_blank" rel="noopener noreferrer">${E(label)} ↗</a>`:`<b>${E(label)}</b>`}<q>${E(r.quote)}</q>${source?.provenance==='user_supplied_transcript'?'<small>Evidence from your supplied transcript; not independently retrieved.</small>':''}</div>`}).join('')}'''
s='\n'.join(lines)+'\n';p.write_text(s)
p=root/'sw.js';s=p.read_text()
if 'v320-source-overrides.mjs' not in s:s=s.replace('const CORE=[','const CORE=[`./v320-source-overrides.mjs?v=${V}`,')
p.write_text(s)
p=Path('ytintel/tests/script-studio.test.mjs');s=p.read_text()
if 'supplied-transcript provenance' not in s:s+='''
const {manualTranscripts,suppliedSource}=await import('../latest/v320-source-overrides.mjs');
test('supplied-transcript provenance is explicit and untimed text has no fake timestamp',()=>{const s=suppliedSource('A district has a railway station.',config.urls[1],1);assert.equal(s.provenance,'user_supplied_transcript');assert.equal(s.segments[0].start,null)});
test('supplied caption timestamps are retained when actually provided',()=>assert.equal(suppliedSource('[0:08] A district has a railway station.',config.urls[1],1).segments[0].start,8));
test('transcripts cannot silently attach to unrelated source URLs',()=>assert.throws(()=>manualTranscripts({'https://bad.example/video':'A district has a railway station.'},config.urls),{code:'TRANSCRIPT_SOURCE_MISMATCH'}));
test('exports retain each detail source location',()=>{const f=fullResult();assert(f.result.ledger.groups.some(g=>g.receipts.some(r=>r.source_url?.includes('&t='))))});
'''
p.write_text(s)
p=root/'release.json';d=json.loads(p.read_text());entry='Added clearly labelled supplied-transcript recovery for unavailable captions; untimed text never receives invented timestamps.'
if entry not in d['changes']:d['changes'].append(entry)
d['known_limitations'].append('The supplied second example video returned no accessible caption tracks on the live source test; its full transcript can be pasted explicitly to continue.')
p.write_text(json.dumps(d,indent=2)+'\n')
print('Missing-caption recovery, truthful timestamps and source-linked exports integrated.')
