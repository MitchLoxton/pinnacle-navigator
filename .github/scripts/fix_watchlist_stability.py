from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"{label} target not found")
    return text.replace(old, new, 1)


p = Path("racing/premium-ui.js")
s = p.read_text(encoding="utf-8")
old_guard = "if(activeTab!=='history') render();"
count = s.count(old_guard)
if count < 5:
    raise SystemExit(f"premium-ui passive guard count was {count}, expected at least 5")
s = s.replace(old_guard, "if(activeTab==='home') render();")
p.write_text(s, encoding="utf-8")

p = Path("racing/watchlist-odds.js")
s = p.read_text(encoding="utf-8")

redraw_block = """    const refreshAfterPremiumRender = () => {
      if (isWatchlistOpen()) scheduleRender(120);
    };
    window.addEventListener('mitchell-base-ready', refreshAfterPremiumRender);
    window.addEventListener('mitchell-assist-health', refreshAfterPremiumRender);
    window.addEventListener('mitchell-preflight-health', refreshAfterPremiumRender);
    window.addEventListener('mitchell-live-health', refreshAfterPremiumRender);
"""
s = replace_once(s, redraw_block, "", "watchlist background redraw listeners")

marker = "  function render() {\n"
helper = """  function marketRenderKey() {
    return JSON.stringify((lastResults || []).map(result => ({
      race:raceCode(result?.race),
      status:result?.oddsStatus || '',
      favouritePrice:Number.isFinite(Number(result?.favouritePrice)) ? Number(result.favouritePrice) : null,
      runners:(Array.isArray(result?.runners) ? result.runners : []).map(r => [r?.number, r?.name, r?.price, r?.placePrice, r?.scratched, r?.suspended])
    })));
  }

"""
s = replace_once(s, marker, helper + marker, "watchlist render marker")

old_start = """    let root = page.querySelector('[data-watchlist-live-odds]');
    if (!root) {
"""
new_start = """    const key = marketRenderKey();
    let root = page.querySelector('[data-watchlist-live-odds]');
    if (root?.dataset?.marketRenderKey === key) {
      root.querySelector('[data-watch-odds-refresh]')?.addEventListener('click', () => refresh(true), { once:true });
      return;
    }
    if (!root) {
"""
s = replace_once(s, old_start, new_start, "watchlist render start")

old_insert = """      root = holder.firstElementChild;
      const title = page.querySelector('.premium-section-title');
"""
new_insert = """      root = holder.firstElementChild;
      root.dataset.marketRenderKey = key;
      const title = page.querySelector('.premium-section-title');
"""
s = replace_once(s, old_insert, new_insert, "watchlist initial insert")

old_replace = """      const next = holder.firstElementChild;
      root.replaceWith(next);
      root = next;
"""
new_replace = """      const next = holder.firstElementChild;
      next.dataset.marketRenderKey = key;
      const pageY = window.scrollY || document.documentElement.scrollTop || 0;
      root.replaceWith(next);
      root = next;
      if (pageY > 0) requestAnimationFrame(() => window.scrollTo({ top:pageY, left:0, behavior:'auto' }));
"""
s = replace_once(s, old_replace, new_replace, "watchlist replacement")

old_busy = """    busy = true;
    render();
    try {
"""
new_busy = """    busy = true;
    const refreshButton = document.querySelector('[data-watch-odds-refresh]');
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = 'CHECKING...';
    }
    try {
"""
s = replace_once(s, old_busy, new_busy, "watchlist busy render")
p.write_text(s, encoding="utf-8")

p = Path("racing/app.js")
s = p.read_text(encoding="utf-8")
s = replace_once(s, "const CLIENT_BUILD = '1.11.6';", "const CLIENT_BUILD = '1.11.7';", "app build")
p.write_text(s, encoding="utf-8")

p = Path("racing/version.json")
s = p.read_text(encoding="utf-8")
s = replace_once(s, '"build": "1.11.6"', '"build": "1.11.7"', "version build")
s = replace_once(s, '"minimumClientBuild": "1.11.6"', '"minimumClientBuild": "1.11.7"', "minimum build")
s = s.replace("LIVE WATCHLIST ODDS", "STABLE LIVE WATCHLIST ODDS")
p.write_text(s, encoding="utf-8")

p = Path("racing/index.html")
s = p.read_text(encoding="utf-8")
s = replace_once(s, 'data-build="1.11.6"', 'data-build="1.11.7"', "html build")
s = s.replace("Race-Day v1.11.6 · LIVE WATCHLIST ODDS", "Race-Day v1.11.7 · STABLE LIVE WATCHLIST ODDS")
s = s.replace("./app.js?v=116", "./app.js?v=117")
s = s.replace("./premium-ui.js?v=115", "./premium-ui.js?v=117")
s = s.replace("./watchlist-odds.js?v=1", "./watchlist-odds.js?v=2")
p.write_text(s, encoding="utf-8")

p = Path("racing/sw.js")
s = p.read_text(encoding="utf-8")
s = replace_once(s, "const BUILD = '1.11.6';", "const BUILD = '1.11.7';", "sw build")
s = replace_once(s, "const CACHE = 'mitchell-racing-v1116-watchlist-odds';", "const CACHE = 'mitchell-racing-v1117-stable-live-watchlist-odds';", "sw cache")
s = s.replace("'./premium-ui.js?v=115'", "'./premium-ui.js?v=117'")
s = s.replace("'./watchlist-odds.js?v=1'", "'./watchlist-odds.js?v=2'")
p.write_text(s, encoding="utf-8")
