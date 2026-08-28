#!/usr/bin/env python3
import json
from collections import defaultdict
from datetime import datetime

import numpy as np
import pandas as pd

import v106_independent_12m as base
import v106_independent_12m_docrr as docrr

START_BAL = 50_000.0
TARGET_BAL = 53_000.0
MAX_DD = 2_000.0
GROWTH_DLL = 1_250.0
SELECT_CONSISTENCY = 0.40
PV = base.PV
CONTRACTS = base.CONTRACTS
FEES_RT = base.FEES_RT


def arrays(b1):
    return (
        np.array([b['time_ns'] for b in b1], dtype=np.int64),
        np.array([b['high'] for b in b1], dtype=float),
        np.array([b['low'] for b in b1], dtype=float),
    )


def run_trade(s, bal, floor, day_start_bal, plan, times, highs, lows):
    """Conservative 1m execution. Any adverse threshold and target in same bar -> adverse wins."""
    ep = float(s['entry']); sp = float(s['stop']); risk = float(s['risk_pts'])
    tp = ep + risk * s['rr'] if s['side'] == 'bull' else ep - risk * s['rr']
    entry_ns = int(s['time'].timestamp() * 1e9)
    i0 = int(np.searchsorted(times, entry_ns, side='right'))
    i1 = int(np.searchsorted(times, entry_ns + 8 * 3600 * 1_000_000_000, side='right'))

    # Convert account risk thresholds to price levels from entry.
    # Include RT fees conservatively in the adverse threshold.
    floor_pnl = floor - bal + FEES_RT
    mtd_px = ep + floor_pnl / (PV * CONTRACTS) if s['side'] == 'bull' else ep - floor_pnl / (PV * CONTRACTS)
    dll_px = None
    if plan == 'growth':
        dll_bal = day_start_bal - GROWTH_DLL
        dll_pnl = dll_bal - bal + FEES_RT
        dll_px = ep + dll_pnl / (PV * CONTRACTS) if s['side'] == 'bull' else ep - dll_pnl / (PV * CONTRACTS)

    for i in range(i0, min(i1, len(times))):
        hi = highs[i]; lo = lows[i]
        if s['side'] == 'bull':
            # Highest adverse threshold below entry is reached first on a decline.
            adverse = [('stop', sp), ('fail', mtd_px)]
            if dll_px is not None:
                adverse.append(('dll', dll_px))
            hit = [(name, px) for name, px in adverse if lo <= px <= ep]
            if hit:
                name, px = max(hit, key=lambda z: z[1])
                pnl = (px - ep) * PV * CONTRACTS - FEES_RT
                return name, pnl, int(times[i]), px
            if hi >= tp:
                pnl = (tp - ep) * PV * CONTRACTS - FEES_RT
                return 'win', pnl, int(times[i]), tp
        else:
            adverse = [('stop', sp), ('fail', mtd_px)]
            if dll_px is not None:
                adverse.append(('dll', dll_px))
            hit = [(name, px) for name, px in adverse if ep <= px <= hi]
            if hit:
                name, px = min(hit, key=lambda z: z[1])
                pnl = (ep - px) * PV * CONTRACTS - FEES_RT
                return name, pnl, int(times[i]), px
            if lo <= tp:
                pnl = (ep - tp) * PV * CONTRACTS - FEES_RT
                return 'win', pnl, int(times[i]), tp
    return 'open', -FEES_RT, entry_ns + 8 * 3600 * 1_000_000_000, ep


def simulate_one_account(sigs, start_day, plan, b1_arrays):
    times, highs, lows = b1_arrays
    sigs = [s for s in sigs if s['date'] >= start_day]
    if not sigs:
        return {'status':'incomplete','start':str(start_day),'end':None,'days':0,'trades':0,'balance':START_BAL}

    bal = START_BAL
    eod_high = START_BAL
    floor = START_BAL - MAX_DD
    current_day = None
    day_start_bal = START_BAL
    day_pnl = 0.0
    traded_days = 0
    daily_pnls = []
    trades = 0
    wins = losses = 0
    pos_exit_ns = 0
    cool_ns = 0
    cl_bull = cl_bear = cl_global = 0
    used = set()
    day_done = False
    last_day = None

    def finish_day(day):
        nonlocal eod_high, floor, traded_days
        if day is None:
            return None
        if trades_today[0] > 0:
            traded_days += 1
            daily_pnls.append(day_pnl)
        eod_high = max(eod_high, bal)
        floor = max(floor, eod_high - MAX_DD)
        if plan == 'select' and traded_days >= 3:
            total_profit = bal - START_BAL
            max_day = max([x for x in daily_pnls if x > 0], default=0.0)
            if total_profit >= 3000.0 and max_day <= SELECT_CONSISTENCY * total_profit + 1e-9:
                return 'pass'
        return None

    trades_today = [0]
    for s in sigs:
        d = s['date']
        if current_day is None:
            current_day = d
            day_start_bal = bal
            day_pnl = 0.0
            trades_today[0] = 0
        elif d != current_day:
            st = finish_day(current_day)
            if st == 'pass':
                return {'status':'pass','start':str(start_day),'end':str(current_day),'days':traded_days,
                        'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor,
                        'max_day':max(daily_pnls) if daily_pnls else 0.0}
            current_day = d
            day_start_bal = bal
            day_pnl = 0.0
            pos_exit_ns = cool_ns = 0
            cl_bull = cl_bear = cl_global = 0
            used = set()
            day_done = False
            trades_today[0] = 0

        last_day = d
        if day_done:
            continue
        entry_ns = int(s['time'].timestamp() * 1e9)
        if pos_exit_ns and entry_ns < pos_exit_ns:
            continue
        if cool_ns and entry_ns < cool_ns:
            continue
        zk = (s['side'], s['zone'], round(s['zone_top'],6), round(s['zone_bot'],6))
        if zk in used:
            continue
        if s['side']=='bull' and cl_bull >= base.MCL_SIDE:
            continue
        if s['side']=='bear' and cl_bear >= base.MCL_SIDE:
            continue
        if cl_global >= base.GMCL:
            day_done = True
            continue

        outcome, pnl, exit_ns, exit_px = run_trade(s, bal, floor, day_start_bal, plan, times, highs, lows)
        trades += 1
        trades_today[0] += 1
        used.add(zk)

        if outcome == 'fail':
            # Account fails the instant NLV touches the MTD floor.
            bal += pnl
            day_pnl += pnl
            return {'status':'fail','reason':'max_drawdown','start':str(start_day),'end':str(d),
                    'days':traded_days + 1,'trades':trades,'wins':wins,'losses':losses,
                    'balance':bal,'floor':floor}

        bal += pnl
        day_pnl += pnl
        pos_exit_ns = exit_ns
        cool_ns = exit_ns + base.COOLDOWN_S * 1_000_000_000

        if outcome == 'win':
            wins += 1
            if s['side']=='bull': cl_bull = 0
            else: cl_bear = 0
            cl_global = 0
        elif outcome in ('stop','dll'):
            losses += 1
            if s['side']=='bull': cl_bull += 1
            else: cl_bear += 1
            cl_global += 1

        # Growth DLL is a soft breach: pause until next session.
        if outcome == 'dll':
            day_done = True

        # Preserve V106's own $2,000 daily stop on Select; Growth's $1,250 DLL is tighter.
        if plan == 'select' and day_pnl <= base.DLL:
            day_done = True

        if plan == 'growth' and bal >= TARGET_BAL:
            return {'status':'pass','start':str(start_day),'end':str(d),'days':traded_days + 1,
                    'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor}

    if current_day is not None:
        st = finish_day(current_day)
        if st == 'pass':
            return {'status':'pass','start':str(start_day),'end':str(current_day),'days':traded_days,
                    'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor,
                    'max_day':max(daily_pnls) if daily_pnls else 0.0}
    return {'status':'incomplete','start':str(start_day),'end':str(last_day) if last_day else None,
            'days':traded_days,'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor}


def sequential_cycles(sigs, plan, b1_arrays):
    days = sorted(set(s['date'] for s in sigs))
    if not days:
        return []
    results = []
    start_i = 0
    while start_i < len(days):
        r = simulate_one_account(sigs, days[start_i], plan, b1_arrays)
        results.append(r)
        if r['status'] == 'incomplete':
            break
        end_day = pd.Timestamp(r['end']).date()
        next_i = None
        for i in range(start_i + 1, len(days)):
            if days[i] > end_day:
                next_i = i
                break
        if next_i is None:
            break
        start_i = next_i
    return results


def summarize(results):
    done = [r for r in results if r['status'] in ('pass','fail')]
    passes = sum(r['status']=='pass' for r in done)
    fails = sum(r['status']=='fail' for r in done)
    incompletes = sum(r['status']=='incomplete' for r in results)
    pass_days = [r['days'] for r in done if r['status']=='pass']
    return {
        'passes': passes, 'fails': fails, 'completed': len(done), 'incomplete': incompletes,
        'pass_rate_pct': 100*passes/len(done) if done else 0.0,
        'median_days_to_pass': float(np.median(pass_days)) if pass_days else None,
        'mean_days_to_pass': float(np.mean(pass_days)) if pass_days else None,
        'results': results,
    }


def main():
    p1 = base.os.environ.get('NQ_2025','/tmp/Dataset_NQ_1min_2022_2025.csv')
    p2 = base.os.environ.get('NQ_2026','/tmp/mnq_2026_1min.csv')
    d1 = base.load_csv(p1); d2 = base.load_csv(p2)
    df = pd.concat([d1,d2], ignore_index=True).sort_values('dt').drop_duplicates(subset=['dt'],keep='last')
    max_dt = df.dt.max(); max_period = max_dt.to_period('M')
    periods = pd.period_range(max_period - 11, max_period, freq='M')
    test_start = periods[0].start_time.tz_localize(base.CT); test_end = max_dt
    df = df[(df.dt >= test_start - pd.Timedelta(days=14)) & (df.dt <= test_end)].copy()
    one = df.sort_values('dt'); five = base.resample_ohlc(one,'5min'); fifteen = base.resample_ohlc(one,'15min')
    b1,b5,b15 = base.to_bars(one),base.to_bars(five),base.to_bars(fifteen)
    raws,dr15 = base.generate_raw(b1,b5,b15,test_start,test_end)
    arr = arrays(b1)

    out = {'window':[str(test_start),str(test_end)], 'assumptions':{
        'start_balance':START_BAL,'target_balance':TARGET_BAL,'max_dd':MAX_DD,
        'growth_dll':GROWTH_DLL,'select_consistency':SELECT_CONSISTENCY,
        'contracts_nq':CONTRACTS,'new_account_starts':'next trading day after prior pass/fail',
        'same_1m_stop_target':'adverse event wins','rr':'disp_fvg=1.1, ifvg=1.0'}}
    for slip in (0.5,1.5):
        sigs = docrr.build_signals_docrr(raws,b1,b5,b15,dr15,slip)
        out[str(slip)] = {}
        for plan in ('growth','select'):
            res = sequential_cycles(sigs,plan,arr)
            sm = summarize(res)
            out[str(slip)][plan] = sm
            print('\n', '='*70)
            print(f'TRADEIFY 50K {plan.upper()} | slippage={slip}')
            print(json.dumps({k:v for k,v in sm.items() if k!='results'}, indent=2))
            for i,r in enumerate(res,1):
                print(i, json.dumps(r, sort_keys=True))
    with open('v106_tradeify_50k_results.json','w') as f:
        json.dump(out,f,indent=2,default=str)
    print('RESULT_JSON_BEGIN')
    print(json.dumps(out,sort_keys=True))
    print('RESULT_JSON_END')

if __name__=='__main__':
    main()
