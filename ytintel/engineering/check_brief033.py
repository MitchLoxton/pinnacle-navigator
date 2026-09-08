from pathlib import Path
p=Path('ytintel/tests/workspace033-browser.mjs')
s=p.read_text().replace("page.locator('.tabs [data-tab=\"history\"]').click()", "page.locator('#mobileDock [data-dock=\"history\"]').click()")
p.write_text(s)
