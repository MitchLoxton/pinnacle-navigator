from pathlib import Path
import json
base = Path('ytintel/latest')
p = base / 'index.html'
s = p.read_text()
if 'v331-phone.js' not in s:
    assert '</head>' in s and '</body>' in s
    s = s.replace('</head>', '  <link id="yt331PhoneStyle" rel="stylesheet" href="v331-phone.css?v=0331">\n</head>')
    s = s.replace('</body>', '<script src="v331-phone.js?v=0331"></script>\n</body>')
p.write_text(s.replace('v=0330', 'v=0331'))
for path in [base / 'v201-always-on.js', base / 'v300-core-analysis.js', Path('ytintel/tests/production-v031.mjs')]:
    s = path.read_text()
    path.write_text(s.replace('0.33.0', '0.33.1').replace('v=0330', 'v=0331'))
p = base / 'sw.js'
s = p.read_text().replace("const CACHE='ytintel-shell-v0330';", "const CACHE='ytintel-shell-v0330-phone0331';").replace("const V='0310';", "const V='0331';")
if './v331-phone.js' not in s:
    s = s.replace('const CORE=[', 'const CORE=[`./v331-phone.js?v=${V}`,`./v331-phone.css?v=${V}`,')
p.write_text(s)
release = {
 'release_id': 'ytintel-0.33.1-phone-compatibility', 'version': 'v0.33.1',
 'title': 'Built for your phone',
 'summary': 'Phone-first layout, readable fields and thumb-sized controls. Script Studio mobile styling is also prepared on its development branch; its AI release remains separate.',
 'discord_changes': ['Phone-sized reports, readable input fields and bigger tap targets.', 'Bottom navigation clears the keyboard; safe-area spacing protects the last line.', 'Script Studio phone layout tested with fixtures; full AI release remains pending.'],
 'changes': ['Added a dedicated responsive presentation layer for small screens and touch tablets.', 'Reflowed source metrics into a two-column grid, and kept wide tables within their own scroll areas.', 'Set text-entry controls to 16px and main touch controls to at least 44px.', 'Added keyboard-aware dock visibility and visual-viewport sizing for dialogs.', 'Kept Analyse, Competitors and Vault accessible from the bottom navigation.', 'Preserved zoom, data, account permissions and all existing analysis behavior.', 'Prepared the same layout for Script Studio forms, file import, source receipts and saved versions.', 'Added Chromium and WebKit phone-layout tests with explicit synthetic backend responses.'],
 'known_limitations': ['Automated browser checks are not physical iPhone or Android device testing.', 'The keyboard check simulates visual-viewport shrinkage, not a physical OS keyboard.', 'Script Studio remains on its separate development branch and is not enabled by this phone release.', 'This presentation release does not fix or change the previously reported API credit blocker.'],
 'why_it_matters': 'Research should be readable and operable on a phone without shrinking a desktop dashboard.'
}
(base / 'release.json').write_text(json.dumps(release, indent=2) + '\n')
print('Phone presentation integrated; backend, credentials and stored research unchanged.')
