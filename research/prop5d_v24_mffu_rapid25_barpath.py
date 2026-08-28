#!/usr/bin/env python3
import argparse, json
from pathlib import Path
import pandas as pd, numpy as np
from pandas.tseries.holiday import USFederalHolidayCalendar
from dateutil.easter import easter

NY='America/New_York'
FEE_RT_PER_MICRO=1.22

def load_bars(path):
    df=pd.read_csv(path)
    df.columns=[str(c).strip().lower().replace(' ','_') for c in df.columns]
    if 'datetime' in df: ts=pd.to_datetime(df['datetime'],errors='coerce')
    elif 'timestamp_et' in df: ts=pd.to_datetime(df['timestamp_et'],errors='coerce')
    elif 'timestamp' in df: ts=pd.to_datetime(df['timestamp'],errors='coerce')
    elif 'date' in df and 'time' in df: ts=pd.to_datetime(df['date'].astype(str)+' '+df['time'].astype(str),errors='coerce')
    else: raise ValueError(f'No timestamp column in {list(df.columns)}')
    if getattr(ts.dt,'tz',None) is None: ts=ts.dt.tz_localize(NY,ambiguous='NaT',nonexistent='shift_forward')
    else: ts=ts.dt.tz_convert(NY)
    df.index=ts; df=df[~df.index.isna()].sort_index()
    rename={}
    for want in ['open','high','low','close']:
        if want not in df:
            cand=[c for c in df.columns if c.endswith(want)]
            if cand: rename[cand[0]]=want
    df=df.rename(columns=rename)
    return df[['open','high','low','close']].astype(float)

def load_trades(path):
    t=pd.read_csv(path)
    for c in ['entry_time','exit_time']:
        x=pd.to_datetime(t[c],errors='coerce')
        if getattr(x.dt,'tz',None) is None: x=x.dt.tz_localize(NY,ambiguous='NaT',nonexistent='shift_forward')
        else: x=x.dt.tz_convert(NY)
        t[c]=x
    t=t.dropna(subset=['entry_time','exit_time']).copy()
    t['R']=pd.to_numeric(t['total_r'],errors='coerce'); t['rpm']=pd.to_numeric(t['risk_ticks'],errors='coerce')*.50
    return t.dropna(subset=['R','rpm']).sort_values('entry_time')

def buckets(hist):
    dev=hist[hist.entry_time.dt.year.isin([2023,2024])]; means=dev.groupby('model').R.mean()
    return set(means[means>=.25].index),set(means[(means>=.14)&(means<.25)].index)

def add_bucket(t,hi,med):
    t=t.copy(); t['bucket']=t.model.map(lambda m:'hi' if m in hi else ('med' if m in med else 'lo')); return t

def market_calendar(start,end,last):
    hol=set(pd.to_datetime(USFederalHolidayCalendar().holidays(start=start,end=end)).date)
    for y in range(start.year,end.year+1): hol.add((pd.Timestamp(easter(y))-pd.Timedelta(days=2)).date())
    return [x.date() for x in pd.date_range(start,end,freq='B') if x.date() not in hol and x.date()<=last]

def risk_for(bucket,c): return c[{'hi':0,'med':1,'lo':2}[bucket]]

def trade_qty(r,c,balance,floor,realized_today,max_micro):
    budget=risk_for(r.bucket,c)
    if r.rpm<=0:return 0
    room=max(0.0,balance+realized_today-floor)
    return max(0,min(max_micro,int(budget//r.rpm),int((room/1.10)//r.rpm)))

def conservative_intraday_breach(r,bars,q,balance,floor,realized_today):
    if q<=0:return False,floor
    seg=bars.loc[(bars.index>=r.entry_time)&(bars.index<=r.exit_time)]
    if seg.empty:return False,floor
    entry=float(r.entry); direction=str(r.direction).lower(); hwm=balance+realized_today; fl=floor
    for b in seg.itertuples():
        if direction=='long': fav_u=(float(b.high)-entry)*2*q; adv_u=(float(b.low)-entry)*2*q
        else: fav_u=(entry-float(b.low))*2*q; adv_u=(entry-float(b.high))*2*q
        hwm=max(hwm,balance+realized_today+fav_u); fl=max(fl,hwm-1000.0); fl=min(100.0,fl)
        if balance+realized_today+adv_u <= fl+1e-9:return True,fl
    return False,fl

def day_eval(trades,c,balance,floor,stress=0.0):
    pnl=0.; n=0
    for r in trades.itertuples(index=False):
        if pnl<=-c[3] or pnl>=c[4]:break
        q=trade_qty(r,c,balance,floor,pnl,30)
        if q<1:continue
        pnl+=(float(r.R)-stress)*float(r.rpm)*q-FEE_RT_PER_MICRO*q; n+=1
        if balance+pnl<=floor:return pnl,n,True
    return pnl,n,False

def day_funded(trades,bars,c,balance,floor,stress=0.0):
    pnl=0.;n=0;fl=floor
    for r in trades.itertuples(index=False):
        if pnl<=-c[3] or pnl>=c[4]:break
        q=trade_qty(r,c,balance,fl,pnl,30)
        if q<1:continue
        breach,fl=conservative_intraday_breach(r,bars,q,balance,fl,pnl);n+=1
        if breach:return pnl,n,fl,True
        pnl+=(float(r.R)-stress)*float(r.rpm)*q-FEE_RT_PER_MICRO*q
        if balance+pnl<=fl:return pnl,n,fl,True
    return pnl,n,fl,False

def build_days(t,cal):
    idx={d:i for i,d in enumerate(cal)}; D=[[] for _ in cal]; t=t.copy();t['date']=t.entry_time.dt.date
    for d,g in t.groupby('date'):
        j=idx.get(d)
        if j is not None:D[j]=g.sort_values('entry_time')
    return D

def eval_run(si,D,cal,c,stress=0.0,maxdays=12):
    bal=0.;peak=0.;floor=-1000.;best=0.;traded=0
    for k in range(maxdays):
        i=si+k
        if i>=len(cal):return('END',k+1,None)
        g=D[i] if isinstance(D[i],pd.DataFrame) else pd.DataFrame(); p,n,fail=day_eval(g,c,bal,floor,stress) if len(g) else (0.,0,False)
        bal+=p;traded+=int(n>0);best=max(best,p)
        if fail or bal<=floor:return('FAIL',k+1,None)
        peak=max(peak,bal);floor=min(100.,max(floor,peak-1000.));required=max(1500.,2*max(0.,best))
        if traded>=2 and bal>=required-1e-9:return('PASS',k+1,i)
    return('OPEN',maxdays,None)

def funded_run(fi,D,cal,bars,c,stress=0.0,maxdays=16):
    bal=0.;floor=-1000.;first_trade_time=None
    for j in range(maxdays):
        i=fi+j
        if i>=len(cal):return('END',j+1)
        g=D[i] if isinstance(D[i],pd.DataFrame) else pd.DataFrame(); p,n,floor,fail=day_funded(g,bars,c,bal,floor,stress) if len(g) else (0.,0,floor,False)
        if n and first_trade_time is None:first_trade_time=g.iloc[0].entry_time
        bal+=p
        if fail or bal<=floor:return('FAIL',j+1)
        now=g.iloc[-1].exit_time if len(g) else pd.Timestamp(cal[i]).tz_localize(NY)+pd.Timedelta(hours=16)
        if first_trade_time is not None and (now-first_trade_time)>=pd.Timedelta(hours=24) and bal>=1100.-1e-9:return('PAYOUT',j+1)
    return('OPEN',maxdays)

def starts_for(cal,year,last):return [i for i,d in enumerate(cal) if d.year==year and d<=last and i+20<len(cal)]

def pair_metrics(year,D,cal,bars,ec,fc,last,stress=0.0):
    S=starts_for(cal,year,last); n=len(S);p5=p10=pay10=ef=ff=0;pdys=[];od=[]
    for si in S:
        st,ed,ei=eval_run(si,D,cal,ec,stress)
        if st=='PASS':
            p5+=ed<=5;p10+=ed<=10;pdys.append(ed);fst,fd=funded_run(ei+1,D,cal,bars,fc,stress);td=ed+fd
            if fst=='PAYOUT':pay10+=td<=10;od.append(td)
            elif fst=='FAIL':ff+=td<=10
        elif st=='FAIL':ef+=ed<=10
    return dict(starts=n,pass5=p5/n if n else 0,pass10=p10/n if n else 0,payout10=pay10/n if n else 0,eval_fail10=ef/n if n else 0,funded_fail10=ff/n if n else 0,median_pass=float(np.median(pdys)) if pdys else None,median_payout=float(np.median(od)) if od else None,p75_payout=float(np.percentile(od,75)) if od else None)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--hist-trades',required=True);ap.add_argument('--hist-bars',required=True);ap.add_argument('--fresh-trades');ap.add_argument('--fresh-bars');ap.add_argument('--out',default='rapid25_barpath.json');args=ap.parse_args()
    hist=load_trades(args.hist_trades);hi,med=buckets(hist);hist=add_bucket(hist,hi,med);bars_hist=load_bars(args.hist_bars);all_t=[hist];all_b=[bars_hist]
    if args.fresh_trades and args.fresh_bars:
        all_t.append(add_bucket(load_trades(args.fresh_trades),hi,med));all_b.append(load_bars(args.fresh_bars))
    t=pd.concat(all_t).sort_values('entry_time');bars=pd.concat(all_b).sort_index();bars=bars[~bars.index.duplicated(keep='last')]
    last=t.entry_time.max().date();cal=market_calendar(pd.Timestamp('2023-01-01'),pd.Timestamp(str(last)),last);D=build_days(t,cal)
    EC=[(325,375,225,950,500),(400,450,200,950,650),(475,600,250,950,950),(475,675,250,950,1100),(550,550,200,900,900),(650,650,200,950,1100)]
    FC=[(225,275,150,650,350),(300,350,200,800,500),(350,425,150,800,600),(400,450,150,850,650),(450,475,150,850,700),(500,500,150,900,750)]
    ranked=[]
    for ec in EC:
      for fc in FC:
        a23=pair_metrics(2023,D,cal,bars,ec,fc,last,0);a24=pair_metrics(2024,D,cal,bars,ec,fc,last,0);fail=max(a23['eval_fail10']+a23['funded_fail10'],a24['eval_fail10']+a24['funded_fail10']);score=10*min(a23['payout10'],a24['payout10'])+2*min(a23['pass5'],a24['pass5'])-6*fail;ranked.append((score,ec,fc,a23,a24))
    ranked.sort(reverse=True,key=lambda x:x[0]);score,ec,fc,a23,a24=ranked[0]
    out={'method':'MPO exact ledger + conservative 1m favorable-first intraday-HWM replay; selection 2023-24 only','eval_config':ec,'funded_config':fc,'dev2023':a23,'dev2024':a24,'score':score}
    for y in [2025,2026]:
      if any(x.year==y for x in t.entry_time):
        ly=max(x.date() for x in t.entry_time if x.year==y);out[f'val{y}']=pair_metrics(y,D,cal,bars,ec,fc,ly,0);out[f'stress{y}']=pair_metrics(y,D,cal,bars,ec,fc,ly,.15)
    Path(args.out).write_text(json.dumps(out,indent=2,default=str));print('SUMMARY_JSON',json.dumps(out,default=str),flush=True)
if __name__=='__main__':main()
