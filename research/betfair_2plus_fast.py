from __future__ import annotations

import io, json, re, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests

BASE='https://promo.betfair.com/betfairsp/prices/'
START=date(2012,9,22); END=date(2026,8,22)
TRAIN_END=date(2017,12,31); VALID_END=date(2020,12,31); AUDIT_END=date(2023,12,31)
COMM=0.05; STRESS=0.03
CACHE=Path('research/cache_2plus'); OUT=Path('research/output_2plus_fast')
CACHE.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
VENUES={
'PR':{'ascot','belmont','belmont park','pinjarra','pinjarra scarpside'},
'SR':{'randwick','royal randwick','rosehill','rosehill gardens','canterbury','canterbury park','warwick farm','kembla grange','newcastle','hawkesbury','gosford'},
'MR':{'flemington','caulfield','moonee valley','sandown','sandown hillside','sandown lakeside','mornington','pakenham','cranbourne','ballarat'},}

def sat_dates():
 d=START
 while d.weekday()!=5:d+=timedelta(days=1)
 while d<=END:
  yield d; d+=timedelta(days=7)

def fn(d): return f'dwbfpricesauswin{d:%d%m%Y}.csv'

def download_one(d):
 p=CACHE/fn(d)
 if p.exists() and p.stat().st_size>100:return str(p)
 u=BASE+fn(d)
 for a in range(3):
  try:
   r=requests.get(u,timeout=30,headers={'User-Agent':'Mozilla/5.0','Referer':'https://promo.betfair.com/'})
   if r.status_code==404:return None
   r.raise_for_status(); p.write_bytes(r.content); return str(p)
  except Exception:
   if a==2:return None
   time.sleep(.4*(a+1))

def preload():
 ds=set()
 for d in sat_dates(): ds.add(d); ds.add(d+timedelta(days=1))
 with ThreadPoolExecutor(max_workers=32) as ex:
  fut=[ex.submit(download_one,d) for d in sorted(ds)]
  done=0
  for f in as_completed(fut):
   done+=1
   if done%100==0:print('DOWNLOAD',done,'/',len(fut),flush=True)

def norm(x): return re.sub(r'\s+',' ',str(x or '').strip().lower())
def venue(h):
 s=str(h or '').strip(); s=re.split(r'\s*\(AUS\)',s,maxsplit=1,flags=re.I)[0]; s=re.sub(r'^AUS\s*/\s*','',s,flags=re.I); return norm(s)
def rno(x):
 m=re.search(r'\bR\s*(\d{1,2})\b',str(x or ''),re.I); return int(m.group(1)) if m else None
def region(v):
 for k,n in VENUES.items():
  if norm(v) in n:return k
 return None
def thoroughbred(x): return not any(z in norm(x) for z in ['pace','trot','harness'])

def load_file(d):
 p=CACHE/fn(d)
 if not p.exists():return pd.DataFrame()
 try:df=pd.read_csv(p,on_bad_lines='skip',low_memory=False)
 except Exception:return pd.DataFrame()
 df.columns=[norm(c).replace(' ','_') for c in df.columns]
 req=['event_id','menu_hint','event_name','event_dt','selection_name','win_lose','bsp']
 if any(c not in df.columns for c in req):return pd.DataFrame()
 df['event_dt']=pd.to_datetime(df['event_dt'],dayfirst=True,errors='coerce')
 df['bsp']=pd.to_numeric(df['bsp'],errors='coerce')
 df['win_lose']=pd.to_numeric(df['win_lose'],errors='coerce').fillna(0).astype(int)
 df['pptradedvol']=pd.to_numeric(df.get('pptradedvol',0),errors='coerce').fillna(0) if 'pptradedvol' in df else 0.0
 return df

def panel():
 rows=[]; missing=[]
 for j,d in enumerate(sat_dates(),1):
  fs=[]
  for dd in [d,d+timedelta(days=1)]:
   x=load_file(dd)
   if len(x):fs.append(x)
  if not fs:missing.append(str(d));continue
  x=pd.concat(fs,ignore_index=True); x=x[x.event_dt.dt.date==d].copy()
  if x.empty:missing.append(str(d));continue
  x['venue']=x.menu_hint.map(venue); x['race_no']=x.event_name.map(rno); x['region']=x.venue.map(region)
  x=x[x.region.notna() & x.race_no.between(1,7,inclusive='both') & x.event_name.map(thoroughbred) & x.bsp.between(1.01,999.99)]
  for rg,g in x.groupby('region'):
   vv=g.groupby('venue').pptradedvol.sum().sort_values(ascending=False)
   if vv.empty:continue
   cv=vv.index[0]; m=g[g.venue==cv]
   for rn,r in m.groupby('race_no'):
    r=r.sort_values(['bsp','selection_name'],kind='mergesort'); f=r.iloc[0]
    rows.append({'date':pd.Timestamp(d),'region':rg,'stream':f'{rg}{int(rn)}','race_no':int(rn),'venue':cv,'favorite':str(f.selection_name),'bsp':float(f.bsp),'won':int(f.win_lose==1),'race_volume':float(r.pptradedvol.sum())})
  if j%50==0:print('PANEL',j,len(rows),flush=True)
 p=pd.DataFrame(rows).sort_values(['stream','date']).reset_index(drop=True)
 st=np.zeros(len(p),dtype=int)
 for s,ix in p.groupby('stream').groups.items():
  q=0
  for i in sorted(ix,key=lambda z:p.at[z,'date']):st[i]=q;q=0 if p.at[i,'won']==1 else min(q+1,30)
 p['state']=st
 p['pnl']=np.where(p.won.eq(1),(p.bsp-1)*(1-COMM)*(1-STRESS),-1.0)
 p['fy']=np.where(p.date.dt.month>=7,p.date.dt.year.astype(str)+'/'+((p.date.dt.year+1)%100).astype(str).str.zfill(2),(p.date.dt.year-1).astype(str)+'/'+(p.date.dt.year%100).astype(str).str.zfill(2))
 p.attrs['missing']=missing
 return p

def period(p,name):
 d=p.date.dt.date
 if name=='train':return d<=TRAIN_END
 if name=='valid':return (d>TRAIN_END)&(d<=VALID_END)
 if name=='audit':return (d>VALID_END)&(d<=AUDIT_END)
 return d>AUDIT_END

def dd(vals):
 e=pk=m=0.0
 for v in vals:e+=v;pk=max(pk,e);m=max(m,pk-e)
 return m

def stats(x):
 if x.empty:return {'bets':0,'roi':None,'profit_u':0,'bets_yr':0,'profit_u_yr':0,'dd_u':None,'pos_fy':0,'fys':0,'worst_fy':None}
 x=x.sort_values(['date','region','race_no']); n=len(x); pr=float(x.pnl.sum()); yrs=max((x.date.max()-x.date.min()).days/365.2425,1); f=x.groupby('fy').pnl.sum()
 return {'bets':n,'roi':pr/n,'profit_u':pr,'bets_yr':n/yrs,'profit_u_yr':pr/yrs,'dd_u':dd(x.pnl),'pos_fy':int((f>0).sum()),'fys':len(f),'worst_fy':float(f.min()),'best_fy':float(f.max())}

def mask_rule(p,r):
 m=pd.Series(True,index=p.index)
 if r.get('region','ALL')!='ALL':m&=p.region.eq(r['region'])
 if 'lo'in r:m&=p.bsp.ge(r['lo'])
 if r.get('hi') is not None:m&=p.bsp.lt(r['hi'])
 if 'state'in r:m&=p.state.eq(r['state'])
 if 'state_min'in r:m&=p.state.ge(r['state_min'])
 if 'race_no'in r:m&=p.race_no.eq(r['race_no'])
 return m

def evalr(p,r):
 m=mask_rule(p,r); z={'rule':r}
 for q in ['train','valid','audit','final']:z[q]=stats(p[m&period(p,q)])
 z['full']=stats(p[m]);return z

def rules():
 out=[]; regs=['ALL','PR','SR','MR']; floors=[2,2.25,2.5,2.75,3,3.25,3.5,4];bands=[(2,2.5),(2.25,2.75),(2.5,3),(2.75,3.25),(3,3.5),(3.5,4),(4,5),(5,7),(7,None)]
 for rg in regs:
  for lo in floors:
   out.append({'family':'floor','region':rg,'lo':lo})
   for sm in range(1,7):out.append({'family':'floor_state_min','region':rg,'lo':lo,'state_min':sm})
   for s in range(0,9):out.append({'family':'floor_state','region':rg,'lo':lo,'state':s})
  for lo,hi in bands:
   out.append({'family':'band','region':rg,'lo':lo,'hi':hi})
   for sm in range(1,7):out.append({'family':'band_state_min','region':rg,'lo':lo,'hi':hi,'state_min':sm})
   for s in range(0,9):out.append({'family':'band_state','region':rg,'lo':lo,'hi':hi,'state':s})
 # simple race-number interactions, still low dimensional
 for rg in regs:
  for rn in range(1,8):
   for lo,hi in [(2,3),(2.5,3),(3,4),(4,None)]:out.append({'family':'race_band','region':rg,'race_no':rn,'lo':lo,'hi':hi})
 return out

def main():
 preload(); p=panel(); p.to_csv(OUT/'panel.csv',index=False)
 print('ROWS',len(p),'dates',p.date.nunique(),'missing',len(p.attrs['missing']),flush=True)
 allr=[evalr(p,r) for r in rules()]
 # Candidate formation uses train+validation only. Do NOT rank on audit/final.
 eligible=[]
 for z in allr:
  tr,va=z['train'],z['valid']
  if tr['bets']<70 or va['bets']<35:continue
  if (tr['roi'] or -9)<=.01 or (va['roi'] or -9)<=0:continue
  if va['pos_fy']<max(2,va['fys']-1):continue
  z['dev_score']=va['profit_u_yr']+.25*tr['profit_u_yr']-.15*(va['dd_u'] or 0);eligible.append(z)
 eligible.sort(key=lambda z:z['dev_score'],reverse=True)
 survivors=[]
 for z in eligible:
  a,f=z['audit'],z['final']
  if a['bets']<35 or f['bets']<25:continue
  if (a['roi'] or -9)<=0 or (f['roi'] or -9)<=0:continue
  if a['pos_fy']<max(2,a['fys']-1):continue
  z['holdout_floor']=min(a['roi'],f['roi']);survivors.append(z)
 survivors.sort(key=lambda z:(z['holdout_floor'],z['full']['profit_u_yr']),reverse=True)
 base=[evalr(p,{'family':'baseline','region':'ALL','lo':x}) for x in [2,2.25,2.5,2.75,3,3.5,4]]
 res={'contract':{'source':'Betfair BSP AUS WIN archive','commission':COMM,'extra_profit_stress':STRESS,'train_end':str(TRAIN_END),'valid_end':str(VALID_END),'audit_end':str(AUDIT_END),'final':'2024-01-01 onward','favorite':'lowest BSP','meeting':'eligible region venue with highest R1-R7 pre-play volume'},'panel':{'rows':len(p),'dates':p.date.nunique(),'streams':p.stream.nunique(),'missing_dates':p.attrs['missing']},'baselines':base,'eligible':len(eligible),'survivors':survivors[:50]}
 (OUT/'summary.json').write_text(json.dumps(res,indent=2,default=str))
 print('ELIGIBLE',len(eligible),'SURVIVORS',len(survivors),flush=True)
 for i,z in enumerate(survivors[:15],1):print('SURV',i,z['rule'],'train',z['train'],'valid',z['valid'],'audit',z['audit'],'final',z['final'],'full',z['full'],flush=True)

if __name__=='__main__':main()
