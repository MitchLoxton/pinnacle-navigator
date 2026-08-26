from datetime import date
import time
import requests
import betfair_2plus_fast as b

# Stable public mirror of the original Betfair Australian WIN CSV archive.
# Use completed 2012-2024 history for this research pass so every period comes
# from the same source. 2023-24 is the untouched final holdout.
b.END = date(2024, 12, 28)
b.AUDIT_END = date(2022, 12, 31)

PREFIXES = {
    'PR': ('ascot','asct','belmont','belm','pinjarra','pinj'),
    'SR': ('randwick','rand','rosehill','rose','canterbury','cant','warwick farm','warf','kembla grange','kemg','newcastle','newc','hawkesbury','hawk','gosford','gosf'),
    'MR': ('flemington','flem','caulfield','caul','moonee valley','mval','sandown','sand','mornington','morn','pakenham','pakn','cranbourne','cran','ballarat','ball'),
}

def region_alias(v):
    x=b.norm(v)
    for region, prefixes in PREFIXES.items():
        if any(x==p or x.startswith(p) for p in prefixes):
            return region
    return None


def mirror_download(d):
    p=b.CACHE/b.fn(d)
    if p.exists() and p.stat().st_size>100:
        return str(p)
    url=(f'https://raw.githubusercontent.com/EonHorizons/betfair_sp/main/'
         f'data_original/horse/aus/{d.year}/{d.month:02d}/{b.fn(d)}')
    for a in range(3):
        try:
            r=requests.get(url,timeout=30,headers={'User-Agent':'Mozilla/5.0'})
            if r.status_code==404:
                return None
            r.raise_for_status()
            p.write_bytes(r.content)
            return str(p)
        except Exception:
            if a==2:
                return None
            time.sleep(.4*(a+1))

b.region = region_alias
b.download_one = mirror_download
b.main()
