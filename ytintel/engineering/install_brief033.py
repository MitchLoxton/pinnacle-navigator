"""Unpack the reviewed source bundle, verify its digest, then apply guarded integration."""
from pathlib import Path, PurePosixPath
import base64, gzip, hashlib, json, runpy
root = Path(__file__).resolve().parents[2]
parts = [root / 'ytintel' / 'engineering' / ('brief033.bundle.' + str(i)) for i in (1,2,3)]
s = ''.join(p.read_text().strip() for p in parts)
# Repair two known transcription omissions in the transport chunks. The digest
# below is the authoritative check; arbitrary changes must never be accepted.
s = s.replace('RdEaTeHQDvZ7KH4', 'RdEaTeHQDvZ7S7KH4')
s = s.replace('PHP4wVP3jGWv/SUI755', 'PHP4wVP3jGWv/SZL+/UI755')
raw = base64.b64decode(s, validate=True)
assert hashlib.sha256(raw).hexdigest() == '99b87dd675432c135bd32551fdf5beaf36911182fca5e94ba7d1e5c617e7e020', 'Source bundle transport digest mismatch'
files = json.loads(gzip.decompress(raw))
for name, content in files.items():
    path = PurePosixPath(name)
    assert path.parts[0] == 'ytintel' and '..' not in path.parts and not path.is_absolute()
    dest = root / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content)
    print('Materialized', name)
runpy.run_path(str(root / 'ytintel/engineering/apply_brief033.py'), run_name='__main__')
runpy.run_path(str(root / 'ytintel/engineering/check_brief033.py'), run_name='__main__')
