#!/usr/bin/env python3
import os
import sys
import json
from collections import defaultdict
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

CT = ZoneInfo("America/Chicago")
ET = ZoneInfo("America/New_York")
NS_MIN = 60_000_000_000
PV = 20
CONTRACTS = 3
FEES_RT = 8.40
MAX_RISK = 1000.0
COOLDOWN_S = 120
MCL_SIDE = 3
GMCL = 5
DLL = -2000.0
KZ_START = (7, 30)
KZ_END = (14, 30)

V106_DIR = os.environ.get("V106_DIR", "/tmp/v106")
sys.path.insert(0, V106_DIR)

from v106_dynamic_rr_zone_entry import get_liquidity_levels  # noqa: E402
import backtest_entry_modes as bem  # noqa: E402


def load_csv(path):
    df = pd.read_csv(path)
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    if "datetime" in df.columns:
        col = "datetime"
    elif "timestamp_et" in df.columns:
        col = "timestamp_et"
    elif "timestamp" in df.columns:
        col = "timestamp"
    elif "date" in df.columns and "time" in df.columns:
        df["datetime"] = df["date"].astype(str) + " " + df["time"].astype(str)
        col = "datetime"
    else:
        col = df.columns[0]
    dt = pd.to_datetime(df[col], errors="coerce")
    if getattr(dt.dt, "tz", None) is None:
        # The source repositories document their naive intraday files as US Eastern.
        dt = dt.dt.tz_localize("America/New_York", ambiguous="infer", nonexistent="shift_forward")
    else:
        dt = dt.dt.tz_convert("America/New_York")
    df["dt"] = dt.dt.tz_convert("America/Chicago")
    for c in ["open", "high", "low", "close"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    if "volume" not in df.columns:
        df["volume"] = 0
    df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0)
    df = df.dropna(subset=["dt", "open", "high", "low", "close"])
    return df[["dt", "open", "high", "low", "close", "volume"]]


def resample_ohlc(df, rule):
    x = df.set_index("dt").sort_index()
    out = x.resample(rule, label="left", closed="left").agg(
        {"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"}
    ).dropna(subset=["open", "high", "low", "close"])
    return out.reset_index()


def to_bars(df):
    out = []
    for r in df.itertuples(index=False):
        t = r.dt.to_pydatetime()
        out.append({
            "time_ns": int(t.timestamp() * 1e9),
            "open": float(r.open), "high": float(r.high),
            "low": float(r.low), "close": float(r.close),
            "date": t.date(), "hour": t.hour, "minute": t.minute,
        })
    return out


def build_dr(bars):
    dr = {}
    for i, b in enumerate(bars):
        d = b["date"]
        if d not in dr:
            dr[d] = (i, i + 1)
        else:
            dr[d] = (dr[d][0], i + 1)
    return dr


def generate_raw(b1, b5, b15, test_start, test_end):
    dr5 = build_dr(b5)
    dr15 = build_dr(b15)
    all_dates = sorted(dr5)
    trade_dates = [d for d in all_dates if test_start.date() <= d <= test_end.date() and d.weekday() < 5]
    b1_times = np.array([b["time_ns"] for b in b1], dtype=np.int64)
    all_raw = []
    sim_kz = [(KZ_START, KZ_END)]

    for di, d in enumerate(trade_dates):
        ds5, de5 = dr5[d]
        liq = get_liquidity_levels(b5, dr5, d, all_dates)
        sess_ns = b5[ds5]["time_ns"]
        b1_day_start = int(np.searchsorted(b1_times, sess_ns - 3_600_000_000_000, side="left"))
        seen_ns = set()
        b1_cutoff = b1_day_start
        for cursor in range(ds5 + 1, de5):
            next_ns = b5[cursor]["time_ns"] + 5 * NS_MIN
            while b1_cutoff < len(b1) and b1[b1_cutoff]["time_ns"] < next_ns:
                b1_cutoff += 1
            ents = bem.gen_sweep_entries_enriched(
                b5[:cursor + 1], b1[b1_day_start:b1_cutoff], ds5, cursor, d, liq, kz=sim_kz
            )
            for e in sorted(ents, key=lambda x: (x["ns"], -{"ifvg": 2, "disp_fvg": 1}.get(x["zt"], 0))):
                if e["ns"] in seen_ns:
                    continue
                et = datetime.fromtimestamp(e["ns"] / 1e9, tz=CT)
                tm = et.hour * 60 + et.minute
                if tm < KZ_START[0] * 60 + KZ_START[1] or tm >= KZ_END[0] * 60 + KZ_END[1]:
                    continue
                seen_ns.add(e["ns"])
                e["_date"] = d
                e["_ds5"] = ds5
                e["_liq"] = liq
                all_raw.append(e)
        if (di + 1) % 25 == 0:
            print(f"signal generation {di+1}/{len(trade_dates)} days; raw={len(all_raw)}", flush=True)
    return all_raw, dr15


def build_signals(raws, b1, b5, b15, dr15, slip):
    bem.SLIP = float(slip)
    bem.PV = PV
    bem.CONTRACTS = CONTRACTS
    bem.MAX_RISK = MAX_RISK
    sigs = []
    for raw in raws:
        sig = bem.apply_entry_mode(
            raw, bem.MODE_CLOSE_ENTRY, b1, b5, raw["_ds5"], raw["_liq"],
            dr15, b15, raw["_date"]
        )
        if not sig or sig["zone"] not in ("disp_fvg", "ifvg"):
            continue
        # This is the current backtest_run default: delayed iFVG + flat 1.1R.
        if sig["zone"] == "ifvg" and sig["time"].hour < 9:
            continue
        sig["rr"] = 1.1
        sigs.append(sig)
    return sorted(sigs, key=lambda x: x["time"])


def simulate(sigs, b1):
    times = np.array([b["time_ns"] for b in b1], dtype=np.int64)
    highs = np.array([b["high"] for b in b1], dtype=float)
    lows = np.array([b["low"] for b in b1], dtype=float)
    closes = np.array([b["close"] for b in b1], dtype=float)

    trades = []
    cur_day = None
    pos_exit_ns = 0
    cool_ns = 0
    cl_bull = cl_bear = cl_global = 0
    day_pnl = 0.0
    day_done = False
    used = set()

    for s in sigs:
        if s["date"] != cur_day:
            cur_day = s["date"]
            pos_exit_ns = cool_ns = 0
            cl_bull = cl_bear = cl_global = 0
            day_pnl = 0.0
            day_done = False
            used = set()
        if day_done:
            continue
        entry_ns = int(s["time"].timestamp() * 1e9)
        if pos_exit_ns and entry_ns < pos_exit_ns:
            continue
        if cool_ns and entry_ns < cool_ns:
            continue
        zk = (s["side"], s["zone"], round(s["zone_top"], 6), round(s["zone_bot"], 6))
        if zk in used:
            continue
        if s["side"] == "bull" and cl_bull >= MCL_SIDE:
            continue
        if s["side"] == "bear" and cl_bear >= MCL_SIDE:
            continue
        if cl_global >= GMCL:
            day_done = True
            continue

        ep, sp, risk = float(s["entry"]), float(s["stop"]), float(s["risk_pts"])
        tp = ep + risk * s["rr"] if s["side"] == "bull" else ep - risk * s["rr"]
        i0 = int(np.searchsorted(times, entry_ns, side="right"))
        i1 = int(np.searchsorted(times, entry_ns + 8 * 3600 * 1_000_000_000, side="right"))
        result = "OPEN"
        exit_ns = 0
        exit_px = ep
        for i in range(i0, min(i1, len(times))):
            # Conservative sequencing: if both occur inside the same 1m candle, STOP wins.
            if s["side"] == "bull":
                if lows[i] <= sp:
                    result, exit_ns, exit_px = "LOSS", int(times[i]), sp
                    break
                if highs[i] >= tp:
                    result, exit_ns, exit_px = "WIN", int(times[i]), tp
                    break
            else:
                if highs[i] >= sp:
                    result, exit_ns, exit_px = "LOSS", int(times[i]), sp
                    break
                if lows[i] <= tp:
                    result, exit_ns, exit_px = "WIN", int(times[i]), tp
                    break
        if result == "OPEN":
            # Match the author's tick runner closely: unresolved = fees only and no more same-day entries.
            pnl = -FEES_RT
            if i1 > i0:
                exit_px = float(closes[min(i1 - 1, len(closes) - 1)])
            pos_exit_ns = entry_ns + 8 * 3600 * 1_000_000_000
        else:
            points = (exit_px - ep) if s["side"] == "bull" else (ep - exit_px)
            pnl = points * PV * CONTRACTS - FEES_RT
            pos_exit_ns = exit_ns
        cool_ns = pos_exit_ns + COOLDOWN_S * 1_000_000_000
        used.add(zk)

        if result == "LOSS":
            if s["side"] == "bull": cl_bull += 1
            else: cl_bear += 1
            cl_global += 1
        elif result == "WIN":
            if s["side"] == "bull": cl_bull = 0
            else: cl_bear = 0
            cl_global = 0

        day_pnl += pnl
        r_net = pnl / s["risk_$"] if s["risk_$"] else 0.0
        trades.append({**s, "result": result, "pnl": pnl, "r_net": r_net,
                       "exit_ns": exit_ns, "target": tp})
        if day_pnl <= DLL:
            day_done = True
    return trades


def stats(trades):
    n = len(trades)
    wins = [t for t in trades if t["result"] == "WIN"]
    losses = [t for t in trades if t["result"] == "LOSS"]
    opens = [t for t in trades if t["result"] == "OPEN"]
    gw = sum(t["pnl"] for t in wins)
    gl = abs(sum(t["pnl"] for t in losses))
    pnl = sum(t["pnl"] for t in trades)
    eq = 0.0
    peak = 0.0
    maxdd = 0.0
    for t in trades:
        eq += t["pnl"]
        peak = max(peak, eq)
        maxdd = max(maxdd, peak - eq)
    dp = defaultdict(float)
    for t in trades:
        dp[t["date"]] += t["pnl"]
    return {
        "trades": n, "wins": len(wins), "losses": len(losses), "open": len(opens),
        "wr": (100 * len(wins) / (len(wins) + len(losses))) if (wins or losses) else 0.0,
        "pf": (gw / gl) if gl > 0 else (999.0 if gw > 0 else 0.0),
        "pnl": pnl, "avg_r": (sum(t["r_net"] for t in trades) / n) if n else 0.0,
        "total_r": sum(t["r_net"] for t in trades), "maxdd": maxdd,
        "losing_days": sum(1 for v in dp.values() if v < 0), "active_days": len(dp),
        "profitable": pnl > 0,
    }


def monthly_table(trades, periods):
    rows = []
    for p in periods:
        ts = [t for t in trades if pd.Period(t["date"], freq="M") == p]
        row = {"month": str(p)}
        row.update(stats(ts))
        rows.append(row)
    return rows


def main():
    p1 = os.environ.get("NQ_2025", "/tmp/Dataset_NQ_1min_2022_2025.csv")
    p2 = os.environ.get("NQ_2026", "/tmp/mnq_2026_1min.csv")
    d1 = load_csv(p1)
    d2 = load_csv(p2)
    print("SOURCE_RANGE_2025", d1.dt.min(), d1.dt.max(), len(d1), flush=True)
    print("SOURCE_RANGE_2026", d2.dt.min(), d2.dt.max(), len(d2), flush=True)
    df = pd.concat([d1, d2], ignore_index=True).sort_values("dt")
    df = df.drop_duplicates(subset=["dt"], keep="last")
    max_dt = df.dt.max()
    max_period = max_dt.to_period("M")
    periods = pd.period_range(max_period - 11, max_period, freq="M")
    test_start = periods[0].start_time.tz_localize(CT)
    test_end = max_dt
    warm_start = test_start - pd.Timedelta(days=14)
    df = df[(df.dt >= warm_start) & (df.dt <= test_end)].copy()
    print("INDEPENDENT_WINDOW", test_start, test_end, "months", [str(x) for x in periods], flush=True)

    one = df.sort_values("dt")
    five = resample_ohlc(one, "5min")
    fifteen = resample_ohlc(one, "15min")
    print("BAR_COUNTS", len(one), len(five), len(fifteen), flush=True)
    b1, b5, b15 = to_bars(one), to_bars(five), to_bars(fifteen)

    raws, dr15 = generate_raw(b1, b5, b15, test_start, test_end)
    print("RAW_TOTAL", len(raws), "DFVG", sum(r["zt"] == "disp_fvg" for r in raws),
          "IFVG", sum(r["zt"] == "ifvg" for r in raws), flush=True)

    output = {"source_max": str(max_dt), "months": [str(x) for x in periods], "runs": {}}
    for slip in [0.5, 1.5]:
        sigs = build_signals(raws, b1, b5, b15, dr15, slip)
        trades = simulate(sigs, b1)
        rows = monthly_table(trades, periods)
        overall = stats(trades)
        output["runs"][str(slip)] = {"overall": overall, "monthly": rows}
        print(f"\n=== SLIPPAGE {slip:.1f} POINTS ===")
        print("month,trades,wr,pf,total_r,avg_r,pnl,maxdd,losing_days,active_days,profitable")
        for r in rows:
            print(f"{r['month']},{r['trades']},{r['wr']:.1f},{r['pf']:.2f},{r['total_r']:.2f},"
                  f"{r['avg_r']:.3f},{r['pnl']:.0f},{r['maxdd']:.0f},{r['losing_days']},"
                  f"{r['active_days']},{int(r['profitable'])}")
        print("OVERALL", json.dumps(overall, sort_keys=True))

    with open("v106_independent_results.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    print("RESULT_JSON_BEGIN")
    print(json.dumps(output, sort_keys=True))
    print("RESULT_JSON_END")


if __name__ == "__main__":
    main()
