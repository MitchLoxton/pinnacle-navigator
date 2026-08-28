#!/usr/bin/env python3
import json
import numpy as np
import pandas as pd
import v106_independent_12m as base
import v106_independent_12m_docrr as docrr

START=50000.0
TARGET=53000.0
DD=2000.0
LOCK_BAL=52100.0
LOCK_FLOOR=50100.0
GROWTH_DLL=1250.0
SELECT_CONS=0.40
PV=base.PV
N=base.CONTRACTS
FEES=base.FEES_RT


def bar_arrays(b1):
    return (np.array([b['time_ns'] for b in b1],dtype=np.int64),
            np.array([b['high'] for b in b1],dtype=float),
            np.array([b['low'] for b in b1],dtype=float))


def eod_floor_update(floor, bal, locked):
    if locked or bal >= LOCK_BAL:
        return LOCK_FLOOR, True
    return max(floor, bal-DD), False


def trade_outcome(s, bal, floor, day_start, plan, arr):
    times, highs, lows = arr
    ep=float(s['entry']); sp=float(s['stop']); risk=float(s['risk_pts'])
    tp=ep+risk*s['rr'] if s['side']=='bull' else ep-risk*s['rr']
    ens=int(s['time'].timestamp()*1e9)
    i0=int(np.searchsorted(times,ens,side='right'))
    i1=int(np.searchsorted(times,ens+8*3600*1_000_000_000,side='right'))

    fail_delta=floor-bal+FEES
    fail_px=ep+fail_delta/(PV*N) if s['side']=='bull' else ep-fail_delta/(PV*N)
    dll_px=None
    if plan=='growth':
        dll_delta=(day_start-GROWTH_DLL)-bal+FEES
        dll_px=ep+dll_delta/(PV*N) if s['side']=='bull' else ep-dll_delta/(PV*N)

    for i in range(i0,min(i1,len(times))):
        hi=float(highs[i]); lo=float(lows[i])
        if s['side']=='bull':
            adverse=[]
            if sp <= ep: adverse.append(('stop',sp))
            if fail_px <= ep: adverse.append(('fail',fail_px))
            if dll_px is not None and dll_px <= ep: adverse.append(('dll',dll_px))
            hits=[x for x in adverse if lo <= x[1]]
            if hits:
                name,px=max(hits,key=lambda x:x[1])
                return name,(px-ep)*PV*N-FEES,int(times[i])
            if hi>=tp:
                return 'win',(tp-ep)*PV*N-FEES,int(times[i])
        else:
            adverse=[]
            if sp >= ep: adverse.append(('stop',sp))
            if fail_px >= ep: adverse.append(('fail',fail_px))
            if dll_px is not None and dll_px >= ep: adverse.append(('dll',dll_px))
            hits=[x for x in adverse if hi >= x[1]]
            if hits:
                name,px=min(hits,key=lambda x:x[1])
                return name,(ep-px)*PV*N-FEES,int(times[i])
            if lo<=tp:
                return 'win',(ep-tp)*PV*N-FEES,int(times[i])
    return 'open',-FEES,ens+8*3600*1_000_000_000


def one_account(sigs,start_day,plan,arr):
    seq=[s for s in sigs if s['date']>=start_day]
    if not seq:
        return {'status':'incomplete','start':str(start_day),'end':None,'days':0,'trades':0,'balance':START}

    bal=START; floor=START-DD; locked=False
    cur=None; day_start=START; day_pnl=0.0; trades_today=0
    traded_days=0; daily=[]; trades=0; wins=0; losses=0
    pos_exit=0; cool=0; clb=0; clr=0; clg=0; used=set(); day_done=False
    last_day=None

    def close_day():
        nonlocal floor,locked,traded_days
        if trades_today>0:
            traded_days+=1
            daily.append(day_pnl)
        floor,locked=eod_floor_update(floor,bal,locked)
        if plan=='select' and traded_days>=3:
            profit=bal-START
            biggest=max([x for x in daily if x>0],default=0.0)
            if profit>=3000.0 and biggest <= SELECT_CONS*profit+1e-9:
                return True
        return False

    for s in seq:
        d=s['date']
        if cur is None:
            cur=d; day_start=bal; day_pnl=0.0; trades_today=0
        elif d!=cur:
            if close_day():
                return {'status':'pass','start':str(start_day),'end':str(cur),'days':traded_days,'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor,'max_day':max(daily) if daily else 0.0}
            cur=d; day_start=bal; day_pnl=0.0; trades_today=0
            pos_exit=0; cool=0; clb=0; clr=0; clg=0; used=set(); day_done=False

        last_day=d
        if day_done: continue
        ens=int(s['time'].timestamp()*1e9)
        if pos_exit and ens<pos_exit: continue
        if cool and ens<cool: continue
        zk=(s['side'],s['zone'],round(s['zone_top'],6),round(s['zone_bot'],6))
        if zk in used: continue
        if s['side']=='bull' and clb>=base.MCL_SIDE: continue
        if s['side']=='bear' and clr>=base.MCL_SIDE: continue
        if clg>=base.GMCL:
            day_done=True; continue

        out,pnl,exit_ns=trade_outcome(s,bal,floor,day_start,plan,arr)
        trades+=1; trades_today+=1; used.add(zk)
        bal+=pnl; day_pnl+=pnl

        if out=='fail':
            return {'status':'fail','reason':'max_drawdown','start':str(start_day),'end':str(d),'days':traded_days+1,'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor}

        pos_exit=exit_ns; cool=exit_ns+base.COOLDOWN_S*1_000_000_000
        if out=='win':
            wins+=1
            if s['side']=='bull': clb=0
            else: clr=0
            clg=0
        elif out in ('stop','dll'):
            losses+=1
            if s['side']=='bull': clb+=1
            else: clr+=1
            clg+=1

        if out=='dll': day_done=True
        if plan=='select' and day_pnl<=base.DLL: day_done=True

        if plan=='growth' and bal>=TARGET:
            return {'status':'pass','start':str(start_day),'end':str(d),'days':traded_days+1,'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor}

    if cur is not None and close_day():
        return {'status':'pass','start':str(start_day),'end':str(cur),'days':traded_days,'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor,'max_day':max(daily) if daily else 0.0}
    return {'status':'incomplete','start':str(start_day),'end':str(last_day) if last_day else None,'days':traded_days,'trades':trades,'wins':wins,'losses':losses,'balance':bal,'floor':floor}


def cycles(sigs,plan,arr):
    days=sorted(set(s['date'] for s in sigs))
    res=[]; i=0
    while i<len(days):
        r=one_account(sigs,days[i],plan,arr); res.append(r)
        if r['status']=='incomplete': break
        end=pd.Timestamp(r['end']).date()
        j=i+1
        while j<len(days) and days[j]<=end: j+=1
        if j>=len(days): break
        i=j
    return res


def summary(res):
    done=[r for r in res if r['status'] in ('pass','fail')]
    ps=[r for r in done if r['status']=='pass']
    fs=[r for r in done if r['status']=='fail']
    return {'passes':len(ps),'fails':len(fs),'completed':len(done),'incomplete':sum(r['status']=='incomplete' for r in res),'pass_rate_pct':100*len(ps)/len(done) if done else 0.0,'median_days_to_pass':float(np.median([r['days'] for r in ps])) if ps else None,'mean_days_to_pass':float(np.mean([r['days'] for r in ps])) if ps else None,'results':res}


def main():
    p1=base.os.environ.get('NQ_2025','/tmp/Dataset_NQ_1min_2022_2025.csv')
    p2=base.os.environ.get('NQ_2026','/tmp/mnq_2026_1min.csv')
    d1=base.load_csv(p1); d2=base.load_csv(p2)
    df=pd.concat([d1,d2],ignore_index=True).sort_values('dt').drop_duplicates(subset=['dt'],keep='last')
    max_dt=df.dt.max(); mp=max_dt.to_period('M'); periods=pd.period_range(mp-11,mp,freq='M')
    start=periods[0].start_time.tz_localize(base.CT); end=max_dt
    df=df[(df.dt>=start-pd.Timedelta(days=14))&(df.dt<=end)].copy()
    one=df.sort_values('dt'); five=base.resample_ohlc(one,'5min'); fifteen=base.resample_ohlc(one,'15min')
    b1,b5,b15=base.to_bars(one),base.to_bars(five),base.to_bars(fifteen)
    raw,dr15=base.generate_raw(b1,b5,b15,start,end); arr=bar_arrays(b1)
    output={'window':[str(start),str(end)],'rules':{'target':3000,'eod_trailing_dd':2000,'lock_balance':52100,'locked_floor':50100,'growth_dll':1250,'select_consistency':0.40,'select_min_days':3,'max_contracts':4},'strategy':{'contracts_nq':N,'rr':'disp_fvg 1.1R; ifvg 1.0R','same_bar_ambiguity':'adverse first'}}
    for slip in (0.5,1.5):
        sigs=docrr.build_signals_docrr(raw,b1,b5,b15,dr15,slip)
        output[str(slip)]={}
        for plan in ('growth','select'):
            sm=summary(cycles(sigs,plan,arr)); output[str(slip)][plan]=sm
            print('\n===',plan.upper(),'slip',slip,'===')
            print(json.dumps({k:v for k,v in sm.items() if k!='results'},indent=2))
            for idx,r in enumerate(sm['results'],1): print(idx,json.dumps(r,sort_keys=True))
    print('RESULT_JSON_BEGIN')
    print(json.dumps(output,sort_keys=True))
    print('RESULT_JSON_END')
    with open('v106_tradeify_50k_v2_results.json','w') as f: json.dump(output,f,indent=2,default=str)

if __name__=='__main__': main()
