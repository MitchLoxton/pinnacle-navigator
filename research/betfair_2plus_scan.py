from __future__ import annotations

import io
import json
import math
import re
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import requests

BASE = "https://promo.betfair.com/betfairsp/prices/"
START = date(2012, 9, 22)
END = date(2026, 8, 22)
OUT = Path("research/output_2plus")
OUT.mkdir(parents=True, exist_ok=True)

# Broad enough to catch the main Saturday city/stand-alone feature meeting,
# but narrow enough to avoid ordinary provincial cards. The chosen meeting is
# the eligible venue with the largest total pre-play traded volume for R1-R7.
REGION_VENUES = {
    "PR": {
        "ascot", "belmont", "belmont park", "pinjarra", "pinjarra scarpside"
    },
    "SR": {
        "randwick", "royal randwick", "rosehill", "rosehill gardens",
        "canterbury", "canterbury park", "warwick farm", "kembla grange",
        "newcastle", "hawkesbury", "gosford"
    },
    "MR": {
        "flemington", "caulfield", "moonee valley", "sandown",
        "sandown hillside", "sandown lakeside", "mornington", "pakenham",
        "cranbourne", "ballarat"
    },
}

COMMISSION = 0.05
PRICE_STRESS = 0.03
TRAIN_END = date(2018, 12, 31)
VALID_END = date(2021, 12, 31)
AUDIT_END = date(2024, 12, 31)


def norm(s: object) -> str:
    s = str(s or "").lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s


def venue_from_hint(hint: object) -> str:
    s = str(hint or "").strip()
    # Common form: 'Randwick (AUS) 31st Jan'
    s = re.split(r"\s*\(AUS\)", s, maxsplit=1, flags=re.I)[0]
    s = re.sub(r"^AUS\s*/\s*", "", s, flags=re.I)
    return norm(s)


def race_no(event_name: object) -> int | None:
    m = re.search(r"\bR\s*(\d{1,2})\b", str(event_name or ""), re.I)
    return int(m.group(1)) if m else None


def is_thoroughbred(event_name: object) -> bool:
    s = norm(event_name)
    return not any(x in s for x in ("pace", "trot", "harness"))


def saturday_dates(start: date, end: date) -> list[date]:
    d = start
    while d.weekday() != 5:
        d += timedelta(days=1)
    out = []
    while d <= end:
        out.append(d)
        d += timedelta(days=7)
    return out


session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; MitchellRacingResearch/1.0)",
    "Referer": "https://promo.betfair.com/",
})


def fetch_day(d: date) -> pd.DataFrame:
    filename = f"dwbfpricesauswin{d:%d%m%Y}.csv"
    url = BASE + filename
    for attempt in range(3):
        try:
            r = session.get(url, timeout=35)
            if r.status_code == 404:
                return pd.DataFrame()
            r.raise_for_status()
            text = r.content.decode("utf-8", errors="replace")
            df = pd.read_csv(io.StringIO(text), on_bad_lines="skip", low_memory=False)
            df.columns = [norm(c).replace(" ", "_") for c in df.columns]
            aliases = {
                "event_id": "event_id", "menu_hint": "menu_hint", "event_name": "event_name",
                "event_dt": "event_dt", "selection_id": "selection_id", "selection_name": "selection_name",
                "win_lose": "win_lose", "bsp": "bsp", "ppwap": "ppwap", "pptradedvol": "pptradedvol"
            }
            # Older files use capitals; normalization above handles that.
            missing = [c for c in ("event_id", "menu_hint", "event_name", "event_dt", "selection_name", "win_lose", "bsp") if c not in df.columns]
            if missing:
                return pd.DataFrame()
            df["event_dt"] = pd.to_datetime(df["event_dt"], dayfirst=True, errors="coerce")
            df["bsp"] = pd.to_numeric(df["bsp"], errors="coerce")
            df["win_lose"] = pd.to_numeric(df["win_lose"], errors="coerce").fillna(0).astype(int)
            if "ppwap" in df.columns:
                df["ppwap"] = pd.to_numeric(df["ppwap"], errors="coerce")
            else:
                df["ppwap"] = np.nan
            if "pptradedvol" in df.columns:
                df["pptradedvol"] = pd.to_numeric(df["pptradedvol"], errors="coerce").fillna(0)
            else:
                df["pptradedvol"] = 0.0
            return df
        except Exception as e:
            if attempt == 2:
                print("FETCH_FAIL", d, type(e).__name__, e)
                return pd.DataFrame()
            time.sleep(1.5 * (attempt + 1))
    return pd.DataFrame()


def classify_region(venue: str) -> str | None:
    v = norm(venue)
    for region, names in REGION_VENUES.items():
        if v in names:
            return region
    return None


def build_panel() -> pd.DataFrame:
    rows: list[dict] = []
    missing_days = []
    for idx, d in enumerate(saturday_dates(START, END), 1):
        # Betfair's daily archive can contain neighbouring Australian local dates.
        # Pull the nominal day first; use next day's archive only if necessary.
        df = fetch_day(d)
        frames = [df] if not df.empty else []
        if df.empty or not (df["event_dt"].dt.date == d).any():
            df2 = fetch_day(d + timedelta(days=1))
            if not df2.empty:
                frames.append(df2)
        if not frames:
            missing_days.append(d.isoformat())
            continue
        day = pd.concat(frames, ignore_index=True)
        day = day[day["event_dt"].dt.date == d].copy()
        if day.empty:
            missing_days.append(d.isoformat())
            continue
        day["venue"] = day["menu_hint"].map(venue_from_hint)
        day["race_no"] = day["event_name"].map(race_no)
        day["region"] = day["venue"].map(classify_region)
        day = day[day["region"].notna() & day["race_no"].between(1, 7, inclusive="both")]
        day = day[day["event_name"].map(is_thoroughbred)]
        day = day[day["bsp"].ge(1.01) & day["bsp"].lt(1000)]
        if day.empty:
            continue

        # One Saturday meeting per region: select the eligible venue with the
        # greatest R1-R7 pre-play traded volume. This is frozen and outcome-blind.
        for region, rdf in day.groupby("region"):
            venue_volume = rdf.groupby("venue")["pptradedvol"].sum().sort_values(ascending=False)
            if venue_volume.empty:
                continue
            chosen_venue = venue_volume.index[0]
            meet = rdf[rdf["venue"] == chosen_venue]
            for rn, race in meet.groupby("race_no"):
                # Minimum BSP defines the Betfair SP favourite. Ties are broken
                # deterministically by selection name, never by result.
                race = race.sort_values(["bsp", "selection_name"], kind="mergesort")
                fav = race.iloc[0]
                rows.append({
                    "date": d.isoformat(),
                    "region": region,
                    "stream": f"{region}{int(rn)}",
                    "race_no": int(rn),
                    "venue": chosen_venue,
                    "favorite": str(fav["selection_name"]),
                    "bsp": float(fav["bsp"]),
                    "ppwap": float(fav["ppwap"]) if pd.notna(fav["ppwap"]) else np.nan,
                    "won": int(fav["win_lose"] == 1),
                    "race_pp_volume": float(race["pptradedvol"].sum()),
                    "meeting_pp_volume": float(venue_volume.iloc[0]),
                })
        if idx % 50 == 0:
            print(f"PANEL {idx} Saturdays -> {len(rows)} race rows")

    panel = pd.DataFrame(rows)
    if panel.empty:
        raise RuntimeError("No Australian metro panel could be reconstructed")
    panel["date"] = pd.to_datetime(panel["date"])
    panel = panel.sort_values(["stream", "date"]).reset_index(drop=True)

    states = np.zeros(len(panel), dtype=int)
    for stream, ix in panel.groupby("stream").groups.items():
        state = 0
        for i in sorted(ix, key=lambda x: panel.at[x, "date"]):
            states[i] = state
            state = 0 if int(panel.at[i, "won"]) == 1 else min(state + 1, 30)
    panel["state"] = states
    panel["gross_pnl_u"] = np.where(panel["won"].eq(1), panel["bsp"] - 1.0, -1.0)
    panel["net_pnl_u"] = np.where(panel["won"].eq(1), (panel["bsp"] - 1.0) * (1.0 - COMMISSION), -1.0)
    panel["stress_pnl_u"] = np.where(panel["won"].eq(1), (panel["bsp"] - 1.0) * (1.0 - COMMISSION) * (1.0 - PRICE_STRESS), -1.0)
    panel["fy"] = np.where(panel["date"].dt.month >= 7, panel["date"].dt.year.astype(str) + "/" + (panel["date"].dt.year.add(1) % 100).astype(str).str.zfill(2), (panel["date"].dt.year.sub(1)).astype(str) + "/" + (panel["date"].dt.year % 100).astype(str).str.zfill(2))
    panel.attrs["missing_days"] = missing_days
    return panel


def max_drawdown(values: Iterable[float]) -> float:
    equity = 0.0
    peak = 0.0
    dd = 0.0
    for x in values:
        equity += float(x)
        peak = max(peak, equity)
        dd = max(dd, peak - equity)
    return dd


def stats(df: pd.DataFrame, pnl_col: str = "stress_pnl_u") -> dict:
    if df.empty:
        return {"bets": 0, "profit_u": 0.0, "roi": None, "max_dd_u": None, "bets_per_year": 0.0, "profit_u_per_year": 0.0, "positive_fys": 0, "fys": 0, "worst_fy_u": None}
    x = df.sort_values(["date", "region", "race_no"])
    n = len(x)
    p = float(x[pnl_col].sum())
    years = max((x["date"].max() - x["date"].min()).days / 365.2425, 1.0)
    fy = x.groupby("fy")[pnl_col].sum()
    return {
        "bets": int(n),
        "profit_u": p,
        "roi": p / n,
        "max_dd_u": max_drawdown(x[pnl_col].tolist()),
        "bets_per_year": n / years,
        "profit_u_per_year": p / years,
        "positive_fys": int((fy > 0).sum()),
        "fys": int(len(fy)),
        "worst_fy_u": float(fy.min()) if len(fy) else None,
        "best_fy_u": float(fy.max()) if len(fy) else None,
    }


def period_mask(panel: pd.DataFrame, period: str) -> pd.Series:
    d = panel["date"].dt.date
    if period == "train":
        return d <= TRAIN_END
    if period == "valid":
        return (d > TRAIN_END) & (d <= VALID_END)
    if period == "audit":
        return (d > VALID_END) & (d <= AUDIT_END)
    if period == "final":
        return d > AUDIT_END
    raise KeyError(period)


def apply_rule(panel: pd.DataFrame, rule: dict) -> pd.Series:
    m = pd.Series(True, index=panel.index)
    if rule.get("region") and rule["region"] != "ALL":
        m &= panel["region"].eq(rule["region"])
    if rule.get("stream"):
        m &= panel["stream"].eq(rule["stream"])
    lo = rule.get("price_lo")
    hi = rule.get("price_hi")
    if lo is not None:
        m &= panel["bsp"].ge(float(lo))
    if hi is not None:
        m &= panel["bsp"].lt(float(hi))
    if rule.get("state_exact") is not None:
        m &= panel["state"].eq(int(rule["state_exact"]))
    if rule.get("state_min") is not None:
        m &= panel["state"].ge(int(rule["state_min"]))
    if rule.get("cells") is not None:
        keys = panel[rule["cell_columns"]].astype(str).agg("|".join, axis=1)
        m &= keys.isin(set(rule["cells"]))
    return m


def evaluate_rule(panel: pd.DataFrame, rule: dict) -> dict:
    mask = apply_rule(panel, rule)
    out = {"rule": rule}
    for p in ("train", "valid", "audit", "final"):
        out[p] = stats(panel[mask & period_mask(panel, p)])
    out["full"] = stats(panel[mask])
    return out


def static_rule_search(panel: pd.DataFrame) -> list[dict]:
    rules = []
    floors = [2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 4.0]
    regions = ["ALL", "PR", "SR", "MR"]
    for region in regions:
        for lo in floors:
            rules.append({"family": "floor", "region": region, "price_lo": lo})
            for sm in range(1, 7):
                rules.append({"family": "state_min_floor", "region": region, "price_lo": lo, "state_min": sm})
            for se in range(0, 9):
                rules.append({"family": "state_exact_floor", "region": region, "price_lo": lo, "state_exact": se})
    bands = [(2.0, 2.5), (2.25, 2.75), (2.5, 3.0), (2.75, 3.25), (3.0, 3.5), (3.5, 4.0), (4.0, 5.0), (5.0, 7.0), (7.0, None)]
    for region in regions:
        for lo, hi in bands:
            rules.append({"family": "band", "region": region, "price_lo": lo, "price_hi": hi})
            for sm in range(1, 7):
                rules.append({"family": "state_min_band", "region": region, "price_lo": lo, "price_hi": hi, "state_min": sm})
            for se in range(0, 9):
                rules.append({"family": "state_exact_band", "region": region, "price_lo": lo, "price_hi": hi, "state_exact": se})
    results = [evaluate_rule(panel, r) for r in rules]
    return results


def cell_union_candidates(panel: pd.DataFrame) -> list[dict]:
    # Cells are learned only on train, gated on validation, then frozen before audit/final.
    tmp = panel.copy()
    bins = [-np.inf, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 7.0, np.inf]
    labels = ["lt2", "2-2.5", "2.5-3", "3-3.5", "3.5-4", "4-5", "5-7", "7+"]
    tmp["price_band"] = pd.cut(tmp["bsp"], bins=bins, labels=labels, right=False).astype(str)
    candidates = []
    configs = [
        ("pooled", ["state", "price_band"], [80, 120, 180], [0.03, 0.05, 0.08, 0.10]),
        ("region", ["region", "state", "price_band"], [35, 50, 75], [0.05, 0.08, 0.10, 0.15]),
        ("stream", ["stream", "state", "price_band"], [15, 20, 30], [0.08, 0.12, 0.15, 0.20]),
    ]
    tr = tmp[period_mask(tmp, "train")]
    va = tmp[period_mask(tmp, "valid")]
    for family, cols, ns, rois in configs:
        tr_g = tr.groupby(cols, observed=False)["stress_pnl_u"].agg(["count", "sum"])
        tr_g["roi"] = tr_g["sum"] / tr_g["count"]
        va_g = va.groupby(cols, observed=False)["stress_pnl_u"].agg(["count", "sum"])
        va_g["roi"] = va_g["sum"] / va_g["count"]
        for min_n in ns:
            for min_roi in rois:
                good = tr_g[(tr_g["count"] >= min_n) & (tr_g["roi"] > min_roi)]
                if good.empty:
                    continue
                # Validation gate: positive validation P/L and at least a modest sample per learned cell.
                keys = []
                for idx in good.index:
                    vrow = va_g.loc[idx] if idx in va_g.index else None
                    if vrow is not None and float(vrow["count"]) >= max(8, min_n * 0.20) and float(vrow["roi"]) > 0:
                        if not isinstance(idx, tuple):
                            idx = (idx,)
                        keys.append("|".join(str(x) for x in idx))
                if not keys:
                    continue
                rule = {
                    "family": f"learned_{family}_cells",
                    "cell_columns": cols,
                    "cells": keys,
                    "train_min_n": min_n,
                    "train_min_roi": min_roi,
                }
                # evaluate on tmp because price_band is required by apply_rule
                candidates.append(evaluate_rule(tmp, rule))
    return candidates


def rank_pre_audit(results: list[dict]) -> list[dict]:
    eligible = []
    for r in results:
        tr, va = r["train"], r["valid"]
        if tr["bets"] < 80 or va["bets"] < 35:
            continue
        if tr["roi"] is None or va["roi"] is None:
            continue
        if tr["roi"] <= 0.02 or va["roi"] <= 0:
            continue
        # Penalize rules that only worked in a single validation FY or have extreme DD per unit profit.
        if va["positive_fys"] < max(2, va["fys"] - 1):
            continue
        score = va["profit_u_per_year"] - 0.20 * va["max_dd_u"] + 0.25 * tr["profit_u_per_year"]
        r = dict(r)
        r["pre_audit_score"] = float(score)
        eligible.append(r)
    return sorted(eligible, key=lambda x: x["pre_audit_score"], reverse=True)


def pretty_rule(rule: dict) -> str:
    if rule.get("cells") is not None:
        return f"{rule['family']} n>={rule['train_min_n']} trainROI>{rule['train_min_roi']:.0%} ({len(rule['cells'])} frozen cells)"
    bits = [rule.get("family", "rule"), rule.get("region", "ALL")]
    if rule.get("price_lo") is not None:
        hi = rule.get("price_hi")
        bits.append(f"BSP {rule['price_lo']:.2f}+" if hi is None else f"BSP {rule['price_lo']:.2f}-{hi:.2f}")
    if rule.get("state_exact") is not None:
        bits.append(f"state={rule['state_exact']}")
    if rule.get("state_min") is not None:
        bits.append(f"state>={rule['state_min']}")
    return " | ".join(str(x) for x in bits)


def main():
    panel = build_panel()
    panel.to_csv(OUT / "betfair_metro_panel.csv", index=False)
    print("PANEL_ROWS", len(panel), "DATES", panel["date"].min(), panel["date"].max())
    print("REGIONS", panel.groupby("region").size().to_dict())

    static = static_rule_search(panel)
    learned = cell_union_candidates(panel)
    all_results = static + learned
    ranked = rank_pre_audit(all_results)

    # Final holdout is NEVER used for ranking. We expose it only after ranking is frozen.
    top = ranked[:30]
    serial = []
    for i, r in enumerate(top, 1):
        serial.append({
            "rank_pre_audit": i,
            "description": pretty_rule(r["rule"]),
            "rule": r["rule"],
            "pre_audit_score": r["pre_audit_score"],
            "train": r["train"], "valid": r["valid"], "audit": r["audit"], "final": r["final"], "full": r["full"],
        })
    (OUT / "top_candidates.json").write_text(json.dumps(serial, indent=2, default=str))

    # A rule earns 'survivor' status only if both untouched audit blocks remain positive.
    survivors = []
    for r in ranked:
        au, fi = r["audit"], r["final"]
        if au["bets"] < 35 or fi["bets"] < 15:
            continue
        if (au["roi"] or -9) <= 0 or (fi["roi"] or -9) <= 0:
            continue
        if au["profit_u_per_year"] <= 0 or fi["profit_u_per_year"] <= 0:
            continue
        rr = dict(r)
        rr["holdout_score"] = min(au["profit_u_per_year"], fi["profit_u_per_year"]) - 0.15 * max(au["max_dd_u"], fi["max_dd_u"])
        survivors.append(rr)
    survivors.sort(key=lambda x: x["holdout_score"], reverse=True)

    # Baselines for every favorite at common price floors.
    baseline = []
    for floor in [2.0, 2.25, 2.5, 2.75, 3.0, 3.5, 4.0]:
        r = evaluate_rule(panel, {"family": "baseline_floor", "region": "ALL", "price_lo": floor})
        baseline.append({"floor": floor, **{p: r[p] for p in ("train", "valid", "audit", "final", "full")}})

    summary = {
        "data_contract": {
            "source": "Betfair public Starting Price Australian WIN CSV archive",
            "start": START.isoformat(), "end": END.isoformat(),
            "favorite_definition": "lowest BSP runner within chosen meeting/race",
            "meeting_rule": "eligible metro/stand-alone venue with largest R1-R7 pre-play traded volume",
            "commission_on_winning_profit": COMMISSION,
            "additional_winner_profit_stress": PRICE_STRESS,
            "state_rule": "every favourite result updates consecutive-loss state; win resets 0, loss increments",
            "selection_warning": "BSP favourite is a historical market-close definition; live execution translation requires forward validation",
            "missing_archive_days": panel.attrs.get("missing_days", []),
        },
        "panel": {
            "rows": int(len(panel)),
            "dates": int(panel["date"].nunique()),
            "streams": int(panel["stream"].nunique()),
            "regions": panel.groupby("region").size().astype(int).to_dict(),
            "venues": {k: sorted(v) for k, v in panel.groupby("region")["venue"].unique().to_dict().items()},
        },
        "baselines": baseline,
        "pre_audit_eligible_rules": len(ranked),
        "holdout_survivors": len(survivors),
        "best_survivors": [
            {
                "description": pretty_rule(r["rule"]), "rule": r["rule"], "holdout_score": r["holdout_score"],
                "train": r["train"], "valid": r["valid"], "audit": r["audit"], "final": r["final"], "full": r["full"]
            } for r in survivors[:20]
        ],
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2, default=str))

    lines = [
        "# Betfair $2+ Australian favourite research sweep",
        "",
        f"Panel: {len(panel):,} race rows, {panel['date'].nunique():,} Saturdays/dates represented, {panel['stream'].nunique()} streams.",
        "All scoring below uses 5% commission on winning profit plus an additional 3% adverse winner-profit stress.",
        "Rules are ranked using training + validation only; 2022-24 audit and 2025-26 final holdout are not used to rank.",
        "",
        "## Baseline price floors",
        "",
        "| Floor | Full bets/yr | Full ROI | Audit ROI | Final ROI | Full profit u/yr | Full max DD u |",
        "|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for b in baseline:
        f = b["full"]; a = b["audit"]; z = b["final"]
        lines.append(f"| {b['floor']:.2f}+ | {f['bets_per_year']:.1f} | {(f['roi'] or 0):.1%} | {(a['roi'] or 0):.1%} | {(z['roi'] or 0):.1%} | {f['profit_u_per_year']:.2f} | {f['max_dd_u']:.1f} |")
    lines += ["", "## Holdout survivors", ""]
    if not survivors:
        lines.append("No tested rule survived both untouched audit blocks with positive stressed ROI. Do not promote a $2+ sleeve from this sweep.")
    else:
        lines += [
            "| Rule | Bets/yr | Audit ROI | Final ROI | Full profit u/yr | Full max DD u |",
            "|---|---:|---:|---:|---:|---:|",
        ]
        for r in survivors[:15]:
            f, a, z = r["full"], r["audit"], r["final"]
            lines.append(f"| {pretty_rule(r['rule'])} | {f['bets_per_year']:.1f} | {(a['roi'] or 0):.1%} | {(z['roi'] or 0):.1%} | {f['profit_u_per_year']:.2f} | {f['max_dd_u']:.1f} |")
    (OUT / "REPORT.md").write_text("\n".join(lines))
    print("SURVIVORS", len(survivors))
    if survivors:
        b = survivors[0]
        print("BEST", pretty_rule(b["rule"]), b["audit"], b["final"], b["full"])


if __name__ == "__main__":
    main()
