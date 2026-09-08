from pathlib import Path
import shutil
# An auth event already represents a refreshed canonical state. Calling refresh
# from that event causes another event and can starve interactive browser work.
p = Path('ytintel/latest/v295-core-hardening.js')
s = p.read_text()
s = s.replace("window.addEventListener('ytintel:auth',refreshAuth)", "window.addEventListener('ytintel:auth',repairAuthSurface)")
p.write_text(s)
root = Path('.phone-studio/ytintel/latest')
assert root.is_dir(), 'Isolated Script Studio source must exist first'
for filename in ('v331-phone.css', 'v331-phone.js'):
    shutil.copyfile(Path('ytintel/latest') / filename, root / filename)
p = root / 'v320-script-studio.js'
s = p.read_text()
if "import './v331-phone.js?v=0331';" not in s:
    s = "import './v331-phone.js?v=0331';\n" + s
s = s.replace("historyList();$('#yt320Brief').focus({preventScroll:true})", "historyList();if(!matchMedia('(pointer:coarse)').matches)$('#yt320Brief').focus({preventScroll:true})")
p.write_text(s)
p = Path('ytintel/tests/phone0331-browser.mjs')
s = p.read_text()
if '// phone-interaction-bounds' not in s:
    s = '// phone-interaction-bounds\n' + s
    s = s.replace('viewport:innerWidth,width:document.documentElement.scrollWidth', 'viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth,inner:innerWidth')
    s = s.replace("currentPage=page;currentName=engine;errors=[];", "currentPage=page;currentName=engine;errors=[];page.setDefaultTimeout(15000);console.log('Phone engine',engine);")
    s = s.replace("currentName=engine+'-'+width;await", "currentName=engine+'-'+width;console.log('Phone viewport',currentName);await")
    s = s.replace("await page.goto(origin+'/ytintel/latest/index.html'", "console.log('Opening application');await page.goto(origin+'/ytintel/latest/index.html'")
    s = s.replace("await page.addScriptTag({type:'module'", "console.log('Opening pending Script Studio');await page.addScriptTag({type:'module'")
    s = s.replace("await context.close();currentPage=null;\n  }finally", "await context.close();currentPage=null;\n  }catch(error){await currentPage?.screenshot({path:proof+'/failure.png',timeout:4000}).catch(()=>{});throw error;}finally")
s = s.replace('window.YTIntelAuth={user:session.user,session,refresh:', 'window.YTIntelAuth={user:session.user,session,signedIn:true,refresh:')
p.write_text(s)
print('Phone presentation and event-loop repair prepared. Provider and credential behavior unchanged.')
