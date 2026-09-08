"""Repair the real v0.31 shell before publication; safe to re-run."""
from pathlib import Path
import re
R=Path('ytintel/latest')
def edit(name, transform):
 p=R/name; old=p.read_text(); new=transform(old)
 if new!=old:p.write_text(new)
def replace_function(s,name,body):
 s,n=re.subn(r'^(?:async )?function '+name+r'\(.*$',lambda _:body,s,flags=re.M)
 if n!=1:raise RuntimeError('Expected one '+name)
 return s
# Two pre-existing syntax errors hidden by the old narrow CI.
edit('v150-platform.js',lambda s:s.replace('Math.round((x.usage/x.quota)*100):null}}catch{}','Math.round((x.usage/x.quota)*100):null}}}catch{}'))
edit('v160-smartstart.js',lambda s:s.replace("setTimeout(()=>$('#radarBtn')?.click(),120)}\nfunction recentLabel", "setTimeout(()=>$('#radarBtn')?.click(),120)}\n}\nfunction recentLabel"))
# The reference node was moved into a sidebar group, so use its real parent.
edit('v270-forensics.js',lambda s:s.replace('nav.insertBefore(b,analyseBtn||null)', '(analyseBtn?.parentNode||nav).insertBefore(b,analyseBtn||null)'))
# Old onboarding covered the Analyse button on fresh phones. Keep it opt-in only.
edit('v200-universal.js',lambda s:s.replace("if(!read(TOUR,'')&&count('ytintel-v120-radar-history')===0&&count('ytintel-v170-sprints')===0)setTimeout(()=>openTour(0),900);",''))
# Smart Start is retired; do not execute a retired workflow at page load.
edit('index.html',lambda s:re.sub(r'<script src="v160-smartstart\.js[^\"]*"[^>]*></script>\n?','',s).replace('id="analyseForm"','id="analyseForm" aria-label="Analyse a YouTube video"').replace('<button class="btn primary">Analyse deeply</button>','<button class="btn primary" type="submit" id="ytAnalyseSubmit">Run full analysis</button>'))
# Only the current orchestrator may run model review.
edit('v201-always-on.js',lambda s:re.sub(r",?\s*\['v300-final-review\.js[^\n]*?'v300-final-review'\]",'',s).replace('v=0300','v=0310'))
def shell(s):
 s=s.replace("const VERSION='0.18.1'","const VERSION='0.31.0'").replace('sw.js?v=0181','sw.js?v=0310').replace('ytintel-shell-v0181','ytintel-shell-v0310')
 return replace_function(s,'lockStatus','function lockStatus(){ /* Current analysis orchestrator owns status. */ }')
edit('v170-shell.js',shell)
# A handled media-unavailable collection stage resolves with explicit limitations.
edit('v300-core-analysis.js',lambda s:s.replace("task('visual',sprite.error?'warn':'done'", "task('visual','done'"))
edit('v150-platform.js',lambda s:s.replace('<button data-dock="os">Home</button><button data-dock="radar">Radar</button><button data-dock="analyse">Analyse</button><button data-dock="loop">Creator Loop</button>','<button data-dock="analyse">Analyse</button><button data-dock="os">Competitors</button><button data-dock="history">Vault</button>'))
edit('v300-focus.js',lambda s:s.replace("const HIDE=['sprint'","const HIDE=['viral','sprint'"))
def deep(s):
 s=s.replace("root.dataset.phase=stopped?'stopped':'running';", "root.dataset.phase=stopped?'stopped':'running';root.setAttribute('aria-busy',String(!stopped));")
 s=s.replace("if(h)h.textContent=synthesis.ok&&remakeResult.ok&&modelTasks.final_review?.status==='done'?'Research finished - review and limitations below':'Research incomplete - see the blocked stages';", "const passed=synthesis.ok&&remakeResult.ok&&modelTasks.final_review?.status==='done';if(h)h.textContent=passed?'Research finished - review and limitations below':'Research incomplete - see the blocked stages';const statusEl=$('#status');if(statusEl){statusEl.textContent=passed?'v0.31.0 - Research reviewed':'v0.31.0 - AI analysis blocked';statusEl.dataset.researchState=passed?'reviewed':'blocked';}")
 return s
edit('v310-deep-research.js',deep)
def loader(s):
 a=s.index('function setStatus()');b=s.index('\nfunction relabel',a)
 return s[:a]+"function setStatus(){const s=$('#status');if(!s||s.dataset.researchState)return;s.textContent='v0.31.0 - Ready';s.title='Model-backed analysis is checked per run. Ready does not imply API credit is available.'}"+s[b:]
edit('v201-always-on.js',loader)
p=R/'v300-core-analysis.css';s=p.read_text()
if 'v031-mobile-shipping' not in s:
 s+='''\n/* v031-mobile-shipping: prevent wide source facts or receipts from widening the page. */
#analyse,#report,#yt300Report,.yt300-section,.yt300-room{min-width:0;max-width:100%;box-sizing:border-box}
#yt300Report .yt300-callout,#yt300Report .yt300-item>div,#yt300Progress .yt310-worker{min-width:0;overflow-wrap:anywhere}
#yt300Report .yt300-strip{max-width:100%;overflow-x:auto}
@media(max-width:600px){#yt300Progress .yt310-workers{grid-template-columns:minmax(0,1fr)}.yt300-room-head{flex-wrap:wrap}.yt300-section{padding:16px}.yt300-section h2{font-size:21px;line-height:1.3}.yt300-summary-top,.yt300-steal,.yt300-package,.yt300-channel-grid{grid-template-columns:minmax(0,1fr)}}
'''
 p.write_text(s)
print('v0.31 full-shell repairs applied')
