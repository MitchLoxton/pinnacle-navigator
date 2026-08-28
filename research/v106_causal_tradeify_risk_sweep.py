#!/usr/bin/env python3
"""V106 causal DFVG-only Tradeify 50K Growth rolling-start audit.

Predeclared risk sweep; no signal/filter tuning on the holdout.
Signal rules: upstream V106, causal 08:00-14:30 CT, DFVG only, flat 1.1R,
2 consecutive losses halt the day, original 3-NQ/$1000 eligibility gate.
Execution: choose NQ/MNQ mix under the requested dollar risk and Tradeify's
4 mini / 40 micro equivalent cap, minimizing fees while using as much risk as possible.
Rules snapshot (2026-08-28): Growth 50K target $3k, DLL $1250 soft breach,
EOD trailing drawdown $2k, lock at $52,100 -> floor $50,100.
"""
import json
from collections import defaultdict
import numpy as np
import pandas as pd
import v106_independent_12m as base

START = 50000.0
TARGET = 53000.0
DD = 2000.0
LOCK_BAL = 52100.0
LOCK_FLOOR = 50100.0
DLL = 1250.0
MAX_EQUIV_MICROS = 40
NQ_PV = 20.0
MNQ_PV = 2.0
NQ_FEE_RT = 5.76
MNQ_FEE_RT = 1.82
HORIZON_DAYS = 20
RISKS = [150, 175, 200, 210, 225, 250, 275, 300]


def arrays(b1):
    return (
        np.array([b['time_ns'] for b in b1], dtype=np.int64),
        np.array([b['high'] for b in b1], dtype=float),
        np.array([b['low'] for b in b1], dtype=float),
    )


def choose_mix(risk_pts, budget):
    """Return NQ/MNQ mix under budget and the 4-mini/40-micro cap."""
    best = None
    for nq in range(0, 5):
        max_mnq = MAX_EQUIV_MICROS - 10 * nq
        for mnq in range(0, max_mnq + 1):
            if nq == 0 and mnq == 0:
                continue
            dpp = nq * NQ_PV + mnq * MNQ_PV
            gross_risk = risk_pts * dpp
            if gross_risk <= 0 or gross_risk > budget + 1e-9:
                continue
            fees = nq * NQ_FEE_RT + mnq * MNQ_FEE_RT
            score = (gross_risk, -fees, nq, -mnq)
            if best is None or score > best[0]:
                best = (score, nq, mnq, gross_risk, fees, dpp)
    if best is None:
        return None
    _, nq, mnq, gross_risk, fees, dpp = best
    return {'nq': nq, 'mnq': mnq, 'risk': gross_risk, 'fees': fees, 'dpp': dpp}


def eod_floor(floor, bal, locked):
    if locked or bal >= LOCK_BAL:
        return LOCK_FLOOR, True
    return max(floor, bal - DD), False


def outcome(sig, bal, floor, day_start, mix, arr):
    times, highs, lows = arr
    ep = float(sig['entry']); sp = float(sig['stop']); risk = float(sig['risk_pts'])
    tp = ep + risk * 1.1 if sig['side'] == 'bull' else ep - risk * 1.1
    dpp = mix['dpp']; fees = mix['fees']
    ens = int(sig['time'].timestamp() * 1e9)
    i0 = int(np.searchsorted(times, ens, side='right'))
    i1 = int(np.searchsorted(times, ens + 8 * 3600 * 1_000_000_000, side='right'))

    fail_delta = floor - bal + fees
    fail_px = ep + fail_delta / dpp if sig['side'] == 'bull' else ep - fail_delta / dpp
    dll_delta = (day_start - DLL) - bal + fees
    dll_px = ep + dll_delta / dpp if sig['side'] == 'bull' else ep - dll_delta / dpp

    for i in range(i0, min(i1, len(times))):
        hi = float(highs[i]); lo = float(lows[i])
        if sig['side'] == 'bull':
            adverse = [('stop', sp), ('floor', fail_px), ('dll', dll_px)]
            hits = [x for x in adverse if x[1] <= ep and lo <= x[1]]
            if hits:
                name, px = max(hits, key=lambda x: x[1])
                return name, (px - ep) * dpp - fees, int(times[i])
            if hi >= tp:
                return 'win', (tp - ep) * dpp - fees, int(times[i])
        else:
            adverse = [('stop', sp), ('floor', fail_px), ('dll', dll_px)]
            hits = [x for x in adverse if x[1] >= ep and hi >= x[1]]
            if hits:
                name, px = min(hits, key=lambda x: x[1])
                return name, (ep - px) * dpp - fees, int(times[i])
            if lo <= tp:
                return 'win', (ep - tp) * dpp - fees, int(times[i])
    return 'open', -fees, ens + 8 * 3600 * 1_000_000_000


def simulate_start(sigs_by_day, trading_days, start_idx, risk_budget, arr, horizon=HORIZON_DAYS):
    bal = START; floor = START - DD; locked = False
    trades = wins = losses = 0
    max_equity = START; max_dd = 0.0
    used_days = 0

    for d in trading_days[start_idx:start_idx + horizon]:
        day_start = bal; day_pnl = 0.0
        pos_exit = cool = 0
        clb = clr = clg = 0
        used = set(); day_done = False; did_trade = False

        for s in sigs_by_day.get(d, []):
            if day_done:
                break
            ens = int(s['time'].timestamp() * 1e9)
            if pos_exit and ens < pos_exit:
                continue
            if cool and ens < cool:
                continue
            zk = (s['side'], s['zone'], round(s['zone_top'], 6), round(s['zone_bot'], 6))
            if zk in used:
                continue
            if s['side'] == 'bull' and clb >= 3:
                continue
            if s['side'] == 'bear' and clr >= 3:
                continue
            if clg >= 2:
                day_done = True
                break

            mix = choose_mix(float(s['risk_pts']), risk_budget)
            if mix is None:
                continue

            out, pnl, exit_ns = outcome(s, bal, floor, day_start, mix, arr)
            did_trade = True; trades += 1; used.add(zk)
            bal += pnl; day_pnl += pnl
            max_equity = max(max_equity, bal)
            max_dd = max(max_dd, max_equity - bal)

            if out == 'floor':
                return {'status': 'fail', 'reason': 'max_drawdown', 'days': used_days + 1,
                        'trades': trades, 'wins': wins, 'losses': losses,
                        'balance': bal, 'max_dd': max_dd}

            pos_exit = exit_ns; cool = exit_ns + 120 * 1_000_000_000
            if out == 'win':
                wins += 1; clg = 0
                if s['side'] == 'bull': clb = 0
                else: clr = 0
            elif out in ('stop', 'dll'):
                losses += 1; clg += 1
                if s['side'] == 'bull': clb += 1
                else: clr += 1
            if out == 'dll' or day_pnl <= -DLL:
                day_done = True

            if bal >= TARGET:
                return {'status': 'pass', 'days': used_days + 1, 'trades': trades,
                        'wins': wins, 'losses': losses, 'balance': bal, 'max_dd': max_dd}

        if did_trade:
            used_days += 1
        floor, locked = eod_floor(floor, bal, locked)
        if bal <= floor + 1e-9:
            return {'status': 'fail', 'reason': 'eod_drawdown', 'days': used_days,
                    'trades': trades, 'wins': wins, 'losses': losses,
                    'balance': bal, 'max_dd': max_dd}

    return {'status': 'incomplete', 'days': used_days, 'trades': trades,
            'wins': wins, 'losses': losses, 'balance': bal, 'max_dd': max_dd}


def summarize(results):
    done = [r for r in results if r['status'] in ('pass', 'fail')]
    ps = [r for r in done if r['status'] == 'pass']
    fs = [r for r in done if r['status'] == 'fail']
    inc = [r for r in results if r['status'] == 'incomplete']
    return {
        'starts': len(results), 'completed': len(done), 'passes': len(ps), 'fails': len(fs),
        'incomplete': len(inc),
        'pass_rate_completed_pct': 100.0 * len(ps) / len(done) if done else 0.0,
        'pass_by_20d_pct': 100.0 * len(ps) / len(results) if results else 0.0,
        'fail_pct': 100.0 * len(fs) / len(results) if results else 0.0,
        'median_days_to_pass': float(np.median([r['days'] for r in ps])) if ps else None,
        'p75_days_to_pass': float(np.percentile([r['days'] for r in ps], 75)) if ps else None,
        'median_max_dd_passes': float(np.median([r['max_dd'] for r in ps])) if ps else None,
        'worst_max_dd_passes': float(max([r['max_dd'] for r in ps])) if ps else None,
    }


def main():
    base.KZ_START = (8, 0); base.KZ_END = (14, 30); base.GMCL = 2
    p1 = base.os.environ.get('NQ_2025', '/tmp/Dataset_NQ_1min_2022_2025.csv')
    p2 = base.os.environ.get('NQ_2026', '/tmp/mnq_2026_1min.csv')
    d1 = base.load_csv(p1); d2 = base.load_csv(p2)
    df = pd.concat([d1, d2], ignore_index=True).sort_values('dt').drop_duplicates(subset=['dt'], keep='last')
    test_start = pd.Timestamp('2025-06-01', tz=base.CT); test_end = df.dt.max()
    work = df[(df.dt >= test_start - pd.Timedelta(days=14)) & (df.dt <= test_end)].copy()
    one = work.sort_values('dt'); five = base.resample_ohlc(one, '5min'); fifteen = base.resample_ohlc(one, '15min')
    b1, b5, b15 = base.to_bars(one), base.to_bars(five), base.to_bars(fifteen)
    raw, dr15 = base.generate_raw(b1, b5, b15, test_start, test_end); arr = arrays(b1)
    all_days = sorted({b['date'] for b in b1 if test_start.date() <= b['date'] <= test_end.date() and b['date'].weekday() < 5})

    output = {'window': [str(test_start), str(test_end)],
              'strategy': 'V106 causal DFVG-only 1.1R, 08:00-14:30 CT, GMCL=2',
              'rules': {'target': 3000, 'eod_trailing_dd': 2000, 'dll': 1250,
                        'lock_balance': 52100, 'locked_floor': 50100, 'max_equiv_micros': 40},
              'fees': {'NQ_RT': NQ_FEE_RT, 'MNQ_RT': MNQ_FEE_RT},
              'horizon_trading_days': HORIZON_DAYS, 'runs': {}}

    for slip in (0.5, 1.5):
        sigs = base.build_signals(raw, b1, b5, b15, dr15, slip)
        sigs = [dict(s, rr=1.1) for s in sigs if s['zone'] == 'disp_fvg']
        by_day = defaultdict(list)
        for s in sigs: by_day[s['date']].append(s)
        for d in by_day: by_day[d].sort(key=lambda x: x['time'])

        output['runs'][str(slip)] = {}
        for budget in RISKS:
            groups = {
                'all': [i for i,d in enumerate(all_days) if d <= test_end.date()],
                'train_2025': [i for i,d in enumerate(all_days) if d.year == 2025],
                'holdout_2026': [i for i,d in enumerate(all_days) if d.year == 2026],
            }
            out_b = {}
            for name, idxs in groups.items():
                idxs = [i for i in idxs if i + HORIZON_DAYS <= len(all_days)]
                rs = [simulate_start(by_day, all_days, i, budget, arr) for i in idxs]
                out_b[name] = summarize(rs)
            output['runs'][str(slip)][str(budget)] = out_b
            print('RESULT', slip, budget, json.dumps(out_b, sort_keys=True), flush=True)

    candidates = []
    for budget in RISKS:
        tr = output['runs']['1.5'][str(budget)]['train_2025']
        candidates.append((tr['pass_by_20d_pct'], -tr['fail_pct'], -budget, budget))
    selected = max(candidates)[3]
    output['selected_risk_from_2025_stress'] = selected
    output['selected_holdout_2026_0.5'] = output['runs']['0.5'][str(selected)]['holdout_2026']
    output['selected_holdout_2026_1.5'] = output['runs']['1.5'][str(selected)]['holdout_2026']
    print('SELECTED_RISK', selected)
    print('HOLDOUT_05', json.dumps(output['selected_holdout_2026_0.5'], sort_keys=True))
    print('HOLDOUT_15', json.dumps(output['selected_holdout_2026_1.5'], sort_keys=True))

    with open('v106_causal_tradeify_risk_sweep_results.json', 'w') as f:
        json.dump(output, f, indent=2, default=str)

if __name__ == '__main__':
    main()
