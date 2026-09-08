from pathlib import Path
p=Path('ytintel/tests/workspace033-browser.mjs')
s=p.read_text().replace("page.locator('.tabs [data-tab=\"history\"]').click()", "page.locator('#mobileDock [data-dock=\"history\"]').click()")
p.write_text(s)
p=Path('ytintel/latest/v330-brief.js')
s=p.read_text()
if 'yt330-print-contrast' not in s:
 s += '''
(function(){const s=document.createElement('style');s.id='yt330-print-contrast';s.textContent=`
@media print {
 html,body{background:#fff!important;color:#111!important;font-family:Arial,sans-serif!important;}
 #yt300Report,#yt300Report *{background:transparent!important;background-image:none!important;color:#111!important;text-shadow:none!important;box-shadow:none!important;max-height:none!important;font-family:Arial,sans-serif!important;}
 #yt300Report{font-size:10pt!important;line-height:1.4!important;}
 #yt300Report .yt300-section{border:1px solid #bbb!important;break-inside:auto!important;margin:0 0 12pt!important;padding:12pt!important;}
 #yt300Report h2{font-size:15pt!important;break-after:avoid!important;}
 #yt300Report h3{font-size:12pt!important;break-after:avoid!important;}
 #yt300Report p,#yt300Report td,#yt300Report li{font-size:10pt!important;}
 #yt300Report a{color:#174a9b!important;text-decoration:underline!important;}
 #yt300Report .yt300-strip{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;overflow:visible!important;}
 #yt300Report .yt300-strip>div{border:1px solid #ddd!important;min-width:0!important;break-inside:avoid!important;}
 #yt300Report .yt300-strip b{white-space:normal!important;overflow:visible!important;}
 #yt300Report .yt300-callout,#yt300Report article{break-inside:avoid!important;}
 #yt300Report pre{white-space:pre-wrap!important;overflow:visible!important;font-size:9pt!important;}
 #yt300Report img{max-width:100%!important;}
 #yt300Report button{display:none!important;}
}`;document.head.appendChild(s);})();
'''
p.write_text(s)
