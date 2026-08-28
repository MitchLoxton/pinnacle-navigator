#!/usr/bin/env python3
"""Strict-causal wrapper around PROP5D NQ Quant replay.
All aggregated bars are timestamped at the END of their interval so no 5m/1h/4h information
can be consumed by the 1m engine before that source bar has fully closed.
"""
import importlib.util, os
from pathlib import Path
import pandas as pd

HERE=Path(__file__).resolve().parent
BASE=HERE/'prop5d_nqquant_partial_replay.py'
spec=importlib.util.spec_from_file_location('prop5d_base',BASE)
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

def causal_resample(df,rule):
    agg={'open':'first','high':'max','low':'min','close':'last','volume':'sum'}
    # Intervals remain [t,t+rule), but are labelled at t+rule. A 09:30-09:35 bar
    # therefore becomes visible at 09:35, never at 09:30.
    x=df[['open','high','low','close','volume']].resample(rule,label='right',closed='left').agg(agg)
    x=x.dropna(subset=['open','high','low','close']);x['is_roll_date']=False
    return x

mod.resample=causal_resample
# Separate output folder is supplied by workflow through PROP5D_OUT.
mod.main()
