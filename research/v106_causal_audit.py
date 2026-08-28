#!/usr/bin/env python3
"""Strictly causal audit of V106 on the independent 1m dataset.

Purpose:
- Remove the 07:30-08:00 CT window so the full 04:00-07:59 premarket
  range used by the upstream V106 liquidity helper is fully known before
  any eligible entry.
- Use the upstream runner's current default global halt of 2 consecutive
  losses per day.
- Compare the upstream combined configuration with DFVG-only and iFVG-only.
- Keep the deliberately conservative 1m outcome rule from the independent
  audit: if TP and SL are both touched in one 1m bar, count the stop first.
"""
import json
import pandas as pd
import v106_independent_12m as base


def run():
    # Causal/session parity changes discovered after the first audit.
    base.KZ_START = (8, 0)
    base.KZ_END = (14, 30)
    base.GMCL = 2

    p1 = base.os.environ.get("NQ_2025", "/tmp/Dataset_NQ_1min_2022_2025.csv")
    p2 = base.os.environ.get("NQ_2026", "/tmp/mnq_2026_1min.csv")
    d1 = base.load_csv(p1)
    d2 = base.load_csv(p2)
    print("SOURCE_RANGE_2025", d1.dt.min(), d1.dt.max(), len(d1), flush=True)
    print("SOURCE_RANGE_2026", d2.dt.min(), d2.dt.max(), len(d2), flush=True)

    df = pd.concat([d1, d2], ignore_index=True).sort_values("dt")
    df = df.drop_duplicates(subset=["dt"], keep="last")
    max_dt = df.dt.max()
    max_period = max_dt.to_period("M")
    periods = pd.period_range(max_period - 11, max_period, freq="M")
    test_start = periods[0].start_time.tz_localize(base.CT)
    test_end = max_dt
    warm_start = test_start - pd.Timedelta(days=14)
    df = df[(df.dt >= warm_start) & (df.dt <= test_end)].copy()
    print("CAUSAL_WINDOW", test_start, test_end, "KZ=08:00-14:30 CT", "GMCL=2", flush=True)

    one = df.sort_values("dt")
    five = base.resample_ohlc(one, "5min")
    fifteen = base.resample_ohlc(one, "15min")
    b1, b5, b15 = base.to_bars(one), base.to_bars(five), base.to_bars(fifteen)
    print("BAR_COUNTS", len(b1), len(b5), len(b15), flush=True)

    raws, dr15 = base.generate_raw(b1, b5, b15, test_start, test_end)
    print("RAW_TOTAL", len(raws), "DFVG", sum(r["zt"] == "disp_fvg" for r in raws),
          "IFVG", sum(r["zt"] == "ifvg" for r in raws), flush=True)

    output = {
        "source_max": str(max_dt),
        "months": [str(x) for x in periods],
        "audit": "strict causal: entries >=08:00 CT; upstream static premarket therefore fully known; GMCL=2",
        "runs": {},
    }

    for slip in [0.5, 1.5]:
        all_sigs = base.build_signals(raws, b1, b5, b15, dr15, slip)
        variants = {
            "combined_flat_1.1": [dict(s, rr=1.1) for s in all_sigs],
            "dfvg_only_1.1": [dict(s, rr=1.1) for s in all_sigs if s["zone"] == "disp_fvg"],
            "ifvg_only_1.1": [dict(s, rr=1.1) for s in all_sigs if s["zone"] == "ifvg"],
        }
        output["runs"][str(slip)] = {}
        for name, sigs in variants.items():
            trades = base.simulate(sigs, b1)
            overall = base.stats(trades)
            monthly = base.monthly_table(trades, periods)
            output["runs"][str(slip)][name] = {"overall": overall, "monthly": monthly}
            print(f"\n=== CAUSAL {name} | SLIP {slip:.1f} ===")
            print("OVERALL", json.dumps(overall, sort_keys=True))
            print("month,trades,wr,pf,total_r,pnl,maxdd,losing_days,active_days,profitable")
            for r in monthly:
                print(f"{r['month']},{r['trades']},{r['wr']:.1f},{r['pf']:.2f},{r['total_r']:.2f},"
                      f"{r['pnl']:.0f},{r['maxdd']:.0f},{r['losing_days']},{r['active_days']},{int(r['profitable'])}")

    with open("v106_causal_audit_results.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    print("RESULT_JSON_BEGIN")
    print(json.dumps(output, sort_keys=True))
    print("RESULT_JSON_END")


if __name__ == "__main__":
    run()
