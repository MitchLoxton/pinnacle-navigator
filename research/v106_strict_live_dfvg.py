#!/usr/bin/env python3
"""Strict live-causal V106 DFVG audit.

Requires the workflow to patch the upstream DFVG generator so every 5m FVG
stores its first knowable timestamp (the close of the right-hand 5m bar), and
1m touch scanning cannot backdate an entry before that timestamp.

08:05 CT is used so the full 04:00-07:59 premarket and the final pre-session
5m swing (including a possible 07:55 pivot confirmed by the 08:00 bar) are
known before any eligible entry.
"""
import json
import pandas as pd
import v106_independent_12m as base

# This audit deliberately prefers live-causality over matching a prettier legacy backtest.
def main():
    base.KZ_START = (8, 5)
    base.KZ_END = (14, 30)
    base.GMCL = 2

    p1 = base.os.environ.get('NQ_2025', '/tmp/Dataset_NQ_1min_2022_2025.csv')
    p2 = base.os.environ.get('NQ_2026', '/tmp/mnq_2026_1min.csv')
    d1 = base.load_csv(p1); d2 = base.load_csv(p2)
    df = pd.concat([d1, d2], ignore_index=True).sort_values('dt')
    df = df.drop_duplicates(subset=['dt'], keep='last')
    max_dt = df.dt.max()
    max_period = max_dt.to_period('M')
    periods = pd.period_range(max_period - 11, max_period, freq='M')
    test_start = periods[0].start_time.tz_localize(base.CT)
    test_end = max_dt
    work = df[(df.dt >= test_start - pd.Timedelta(days=14)) & (df.dt <= test_end)].copy()

    one = work.sort_values('dt')
    five = base.resample_ohlc(one, '5min')
    fifteen = base.resample_ohlc(one, '15min')
    b1, b5, b15 = base.to_bars(one), base.to_bars(five), base.to_bars(fifteen)
    print('STRICT_WINDOW', test_start, test_end, 'KZ=08:05-14:30 CT', 'GMCL=2', flush=True)
    raw, dr15 = base.generate_raw(b1, b5, b15, test_start, test_end)
    print('RAW_TOTAL', len(raw), 'DFVG', sum(r['zt']=='disp_fvg' for r in raw),
          'IFVG', sum(r['zt']=='ifvg' for r in raw), flush=True)

    out = {'window':[str(test_start),str(test_end)],
           'audit':'strict live causal; DFVG tradable only after right-hand 5m bar closes; 08:05 CT start; GMCL=2',
           'runs':{}}
    for slip in (0.5, 1.5):
        sigs = base.build_signals(raw, b1, b5, b15, dr15, slip)
        sigs = [dict(s, rr=1.1) for s in sigs if s['zone']=='disp_fvg']
        trades = base.simulate(sigs, b1)
        overall = base.stats(trades)
        monthly = base.monthly_table(trades, periods)
        out['runs'][str(slip)] = {'overall':overall,'monthly':monthly}
        print('\nSTRICT_DFVG', slip, json.dumps(overall, sort_keys=True))
        print('month,trades,wr,pf,total_r,pnl,maxdd,losing_days,active_days,profitable')
        for r in monthly:
            print(f"{r['month']},{r['trades']},{r['wr']:.1f},{r['pf']:.2f},{r['total_r']:.2f},"
                  f"{r['pnl']:.0f},{r['maxdd']:.0f},{r['losing_days']},{r['active_days']},{int(r['profitable'])}")
    with open('v106_strict_live_dfvg_results.json','w') as f:
        json.dump(out,f,indent=2,default=str)

if __name__ == '__main__':
    main()
