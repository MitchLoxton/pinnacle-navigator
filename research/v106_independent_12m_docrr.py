#!/usr/bin/env python3
import json
import pandas as pd
import v106_independent_12m as base


def build_signals_docrr(raws, b1, b5, b15, dr15, slip):
    sigs = base.build_signals(raws, b1, b5, b15, dr15, slip)
    for s in sigs:
        s["rr"] = 1.0 if s["zone"] == "ifvg" else 1.1
    return sigs


def main():
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
    print("INDEPENDENT_WINDOW", test_start, test_end, "months", [str(x) for x in periods], flush=True)

    one = df.sort_values("dt")
    five = base.resample_ohlc(one, "5min")
    fifteen = base.resample_ohlc(one, "15min")
    b1, b5, b15 = base.to_bars(one), base.to_bars(five), base.to_bars(fifteen)
    print("BAR_COUNTS", len(b1), len(b5), len(b15), flush=True)

    raws, dr15 = base.generate_raw(b1, b5, b15, test_start, test_end)
    print("RAW_TOTAL", len(raws), "DFVG", sum(r["zt"] == "disp_fvg" for r in raws),
          "IFVG", sum(r["zt"] == "ifvg" for r in raws), flush=True)

    output = {"source_max": str(max_dt), "months": [str(x) for x in periods],
              "rr_mode": "disp_fvg=1.1R, ifvg=1.0R", "runs": {}}
    for slip in [0.5, 1.5]:
        sigs = build_signals_docrr(raws, b1, b5, b15, dr15, slip)
        trades = base.simulate(sigs, b1)
        rows = base.monthly_table(trades, periods)
        overall = base.stats(trades)
        output["runs"][str(slip)] = {"overall": overall, "monthly": rows}
        print(f"\n=== DOCUMENTED RR | SLIPPAGE {slip:.1f} POINTS ===")
        print("month,trades,wr,pf,total_r,avg_r,pnl,maxdd,losing_days,active_days,profitable")
        for r in rows:
            print(f"{r['month']},{r['trades']},{r['wr']:.1f},{r['pf']:.2f},{r['total_r']:.2f},"
                  f"{r['avg_r']:.3f},{r['pnl']:.0f},{r['maxdd']:.0f},{r['losing_days']},"
                  f"{r['active_days']},{int(r['profitable'])}")
        print("OVERALL", json.dumps(overall, sort_keys=True))

    with open("v106_independent_results_docrr.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    print("RESULT_JSON_BEGIN")
    print(json.dumps(output, sort_keys=True))
    print("RESULT_JSON_END")


if __name__ == "__main__":
    main()
