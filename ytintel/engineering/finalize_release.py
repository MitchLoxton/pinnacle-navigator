from pathlib import Path
import re

root = Path('ytintel')
auth = root / 'latest/v281-auth-fix.js'
s = auth.read_text()
marker = 'v031-release-state-owned-by-current-loader'
if marker not in s:
    # Legacy auth UI must not claim ownership of the app release or a running analysis.
    lines = s.splitlines(keepends=True)
    hits = [i for i, line in enumerate(lines) if "window.YTINTEL_VERSION='0.28.1'" in line]
    if len(hits) != 1:
        raise RuntimeError('Expected exactly one legacy auth version assignment')
    lines[hits[0]] = '  // ' + marker + ': authentication does not set the app release.\n'
    s = ''.join(lines)
    anchor = 'function restoreAnalysisAccess(){\n'
    if s.count(anchor) != 1:
        raise RuntimeError('Auth access anchor changed')
    s = s.replace(anchor, anchor + "  if(document.querySelector('#yt300Progress[data-phase=\"running\"]'))return;\n", 1)
    auth.write_text(s)

loader = root / 'latest/v201-always-on.js'
s = loader.read_text()
if "dataset.ytintelAppReady='0.31.0'" not in s:
    anchor = "  try{window.dispatchEvent(new CustomEvent('ytintel:late-layers-ready'))}catch{}"
    if s.count(anchor) != 1:
        raise RuntimeError('Loader completion anchor changed')
    s = s.replace(anchor, "  window.YTINTEL_VERSION='0.31.0';\n  document.documentElement.dataset.ytintelAppReady='0.31.0';\n" + anchor, 1)
    s = s.replace('v281-auth-fix.js?v=0310', 'v281-auth-fix.js?v=0310-r2')
    loader.write_text(s)

full = root / 'tests/full-shell-smoke.mjs'
s = full.read_text()
old = "()=>window.YTIntelDeepResearch&&document.documentElement.dataset.yt300CoreAnalysis==='1'"
new = "()=>window.YTIntelDeepResearch&&document.documentElement.dataset.yt300CoreAnalysis==='1'&&document.documentElement.dataset.ytintelAppReady==='0.31.0'"
if old in s and new not in s:
    s = s.replace(old, new, 1)
if "assert.equal(d.version,'0.31.0')" not in s:
    s = s.replace("assert.equal(d.sections,17);", "assert.equal(d.version,'0.31.0');assert.equal(d.sections,17);", 1)
full.write_text(s)

prod = root / 'tests/production-v031.mjs'
s = prod.read_text()
if "dataset.ytintelAppReady==='0.31.0'" not in s:
    old = "document.documentElement.dataset.yt300CoreAnalysis==='1'&&window.YTINTEL_VERSION==='0.31.0'"
    new = old + "&&document.documentElement.dataset.ytintelAppReady==='0.31.0'"
    if s.count(old) != 1:
        raise RuntimeError('Production readiness anchor changed')
    s = s.replace(old, new, 1)
if "assert.equal(result.version,'0.31.0')" not in s:
    s = s.replace('assert.deepEqual(result.heads,', "assert.equal(result.version,'0.31.0');assert.deepEqual(result.heads,", 1)
prod.write_text(s)

sw = root / 'latest/sw.js'
s = sw.read_text()
s = re.sub(r"const CACHE='ytintel-shell-v0310[^']*';", "const CACHE='ytintel-shell-v0310-r2';", s, count=1)
sw.write_text(s)
print('Release ownership, busy-state protection and readiness regression checks integrated.')
