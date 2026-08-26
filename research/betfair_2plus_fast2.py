import betfair_2plus_fast as b

# Betfair's older Australian files abbreviate venue names (e.g. Rand, Caul,
# KemG, Pakn) while modern files often use full venue names. Classification is
# purely by venue label and therefore does not use race outcomes.
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

b.region = region_alias
b.main()
# rerun marker: venue-aware parser active
