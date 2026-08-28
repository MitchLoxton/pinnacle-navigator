#!/usr/bin/env python3
"""PROP-5D v0.2: independent NQ Quant V4 chronology replay.

This does NOT reuse NQ Quant's unpublished 10-year parquet/cache files.
It applies the public V4 hybrid rules to the independently available
s-k-28 NQ 1-minute history, computes required features causally from that
history, and exports a dated trade ledger for the PROP-5D lifecycle test.

The purpose is to replace the synthetic NQ Quant sleeve in PROP-5D v0.1
with real chronology on an independent dataset.  It is not a claim of
byte-for-byte parity with the author's unpublished Barchart data.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

NQQ = Path(os.environ.get("NQ_QUANT_DIR", "/tmp/nq-quant"))
NQ_CSV = Path(os.environ.get("NQ_CSV", "/tmp/Dataset_NQ_1min_2022_2025.csv"))
OUT = Path(os.environ.get("PROP5D_OUT", "prop5d_nqquant_results"))
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(NQQ))


def load_independent_nq(path: Path) -> pd.DataFrame:
    raw = pd.read_csv(path)
    raw.columns = [str(c).strip().lower().replace(" ", "_") for c in raw.columns]
    if "datetime" in raw.columns:
        ts = pd.to_datetime(raw["datetime"], errors="coerce")
    elif "timestamp_et" in raw.columns:
        ts = pd.to_datetime(raw["timestamp_et"], errors="coerce")
    elif "timestamp" in raw.columns:
        ts = pd.to_datetime(raw["timestamp"], errors="coerce")
    elif "date" in raw.columns and "time" in raw.columns:
        ts = pd.to_datetime(raw["date"].astype(str) + " " + raw["time"].astype(str), errors="coerce")
    else:
        ts = pd.to_datetime(raw.iloc[:, 0], errors="coerce")

    for c in ["open", "high", "low", "close", "volume"]:
        if c not in raw.columns:
            raise ValueError(f"missing required column {c}; columns={list(raw.columns)}")

    df = raw.assign(_ts=ts).dropna(subset=["_ts", "open", "high", "low", "close"]).copy()
    df = df.sort_values("_ts")
    idx = pd.DatetimeIndex(df["_ts"])
    if idx.tz is None:
        # The s-k-28 loader treats these timestamps as US/Eastern clock time.
        try:
            idx = idx.tz_localize("America/New_York", ambiguous="infer", nonexistent="shift_forward")
        except Exception:
            # Fail soft around duplicated DST timestamps only; never forward-fill prices.
            idx = idx.tz_localize("America/New_York", ambiguous="NaT", nonexistent="shift_forward")
    else:
        idx = idx.tz_convert("America/New_York")
    keep = ~idx.isna()
    df = df.loc[keep].copy()
    idx = idx[keep].tz_convert("UTC")
    out = pd.DataFrame(index=idx)
    for c in ["open", "high", "low", "close", "volume"]:
        out[c] = pd.to_numeric(df[c], errors="coerce").to_numpy()
    out["volume"] = out["volume"].fillna(0.0)
    out = out[~out.index.duplicated(keep="last")].sort_index()
    out = out.dropna(subset=["open", "high", "low", "close"])
    out["is_roll_date"] = False
    return out


def resample(df: pd.DataFrame, rule: str) -> pd.DataFrame:
    agg = {"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"}
    x = df[["open", "high", "low", "close", "volume"]].resample(rule, label="left", closed="left").agg(agg)
    x = x.dropna(subset=["open", "high", "low", "close"])
    x["is_roll_date"] = False
    return x


def stats(trades: pd.DataFrame) -> dict:
    if len(trades) == 0:
        return {"trades": 0, "total_r": 0.0, "expectancy_r": 0.0, "wr": 0.0, "pf": 0.0, "max_dd_r": 0.0}
    r = pd.to_numeric(trades["r"], errors="coerce").fillna(0.0).to_numpy(float)
    eq = np.cumsum(r)
    peak = np.maximum.accumulate(np.r_[0.0, eq])
    dd = np.r_[0.0, eq] - peak
    wins = r[r > 0].sum()
    losses = -r[r < 0].sum()
    return {
        "trades": int(len(r)),
        "total_r": float(r.sum()),
        "expectancy_r": float(r.mean()),
        "wr": float((r > 0).mean()),
        "pf": float(wins / losses) if losses > 0 else None,
        "max_dd_r": float(-dd.min()),
    }


def main() -> None:
    from features.displacement import compute_atr
    from features.fvg import detect_fvg
    from features.swing import compute_swing_levels
    from features.sessions import compute_session_levels, compute_orm
    from features.bias import compute_daily_bias, compute_regime
    from experiments.unified_engine_1m import run_hybrid_1m

    with open(NQQ / "config" / "params.yaml", encoding="utf-8") as f:
        params = yaml.safe_load(f)

    # Upstream's current params.yaml accidentally omits the three legacy regime
    # keys still consumed by features/bias.py. The audited 1:1 NinjaTrader port
    # pins ChopRangePoints=25 and ChopWindowBars=50 on 5m bars. compute_regime()
    # documents its window input in 1m bars and divides by bar frequency, so 250
    # reconstructs the same 50x5m lookback. Reduced/choppy risk is 0.5.
    regime_params = params.setdefault("regime", {})
    regime_params.setdefault("chop_range_points", 25.0)
    regime_params.setdefault("chop_range_window_bars", 250)
    regime_params.setdefault("choppy_risk_mult", 0.5)

    nq1 = load_independent_nq(NQ_CSV)
    nq5 = resample(nq1, "5min")
    nq1h = resample(nq1, "1h")
    nq4h = resample(nq1, "4h")

    print("DATA", len(nq1), nq1.index.min(), nq1.index.max(), flush=True)
    print("5M", len(nq5), "1H", len(nq1h), "4H", len(nq4h), flush=True)

    session_levels = compute_session_levels(nq5, params)
    orm = compute_orm(nq5, params)
    bias = compute_daily_bias(nq5, session_levels, orm, nq4h, nq1h, params)
    regime = compute_regime(nq5, nq4h, bias, params)
    atr = compute_atr(nq5, period=14)
    fvg = detect_fvg(nq5)

    swing_params = {"left_bars": params["swing"]["left_bars"], "right_bars": params["swing"]["right_bars"]}
    swings = compute_swing_levels(nq5, swing_params)
    rb = swing_params["right_bars"]
    raw_sh = swings["swing_high"].fillna(False).to_numpy(bool)
    raw_sl = swings["swing_low"].fillna(False).to_numpy(bool)
    sh_mask = pd.Series(raw_sh, index=nq5.index).shift(rb, fill_value=False).to_numpy(bool)
    sl_mask = pd.Series(raw_sl, index=nq5.index).shift(rb, fill_value=False).to_numpy(bool)
    sh_price = np.full(len(nq5), np.nan)
    sl_price = np.full(len(nq5), np.nan)
    h = nq5["high"].to_numpy(float)
    l = nq5["low"].to_numpy(float)
    for j in np.flatnonzero(raw_sh):
        if j + rb < len(nq5):
            sh_price[j + rb] = h[j]
    for j in np.flatnonzero(raw_sl):
        if j + rb < len(nq5):
            sl_price[j + rb] = l[j]

    et = nq5.index.tz_convert("America/New_York")
    dates = np.array([(t + pd.Timedelta(days=1)).date() if t.hour >= 18 else t.date() for t in et])
    dow = np.array(et.dayofweek)
    et_frac = np.array(et.hour + et.minute / 60.0, dtype=float)

    if isinstance(regime, pd.DataFrame):
        reg_series = regime["regime"] if "regime" in regime.columns else regime.iloc[:, 0]
    else:
        reg_series = regime
    bias_series = bias["bias_direction"] if isinstance(bias, pd.DataFrame) and "bias_direction" in bias.columns else bias

    d5 = {
        "nq": nq5,
        "params": params,
        "n": len(nq5),
        "o": nq5["open"].to_numpy(float),
        "h": h,
        "l": l,
        "c": nq5["close"].to_numpy(float),
        "atr_arr": atr.to_numpy(float),
        "bias_dir_arr": pd.Series(bias_series, index=nq5.index).reindex(nq5.index).fillna(0.0).to_numpy(float),
        "regime_arr": pd.Series(reg_series, index=nq5.index).reindex(nq5.index).fillna(0.0).to_numpy(float),
        "swing_high_mask": sh_mask,
        "swing_low_mask": sl_mask,
        "swing_high_price_at_mask": sh_price,
        "swing_low_price_at_mask": sl_price,
        "news_blackout_arr": None,
        "fvg_df": fvg,
        "on_hi": session_levels["overnight_high"].to_numpy(float),
        "on_lo": session_levels["overnight_low"].to_numpy(float),
        "asia_hi": session_levels["asia_high"].to_numpy(float),
        "asia_lo": session_levels["asia_low"].to_numpy(float),
        "london_hi": session_levels["london_high"].to_numpy(float),
        "london_lo": session_levels["london_low"].to_numpy(float),
        "dates": dates,
        "dow_arr": dow,
        "et_frac_arr": et_frac,
    }

    trades, meta = run_hybrid_1m(
        d5, nq1,
        trim_pct=0.0,
        fixed_tp_r=1.0,
        nth_swing=5,
        eod_close=True,
        big_sweep_threshold=1.3,
        big_sweep_mult=1.5,
        am_short_mult=0.5,
        trend_r_mult=0.5,
        max_positions=2,
        use_be=False,
        tier_filter=0,
    )
    tdf = pd.DataFrame(trades)
    if len(tdf):
        tdf["entry_time"] = pd.to_datetime(tdf["entry_time"], utc=True)
        tdf["exit_time"] = pd.to_datetime(tdf["exit_time"], utc=True)
        tdf = tdf.sort_values("entry_time").reset_index(drop=True)
        tdf["trade_date_et"] = tdf["entry_time"].dt.tz_convert("America/New_York").dt.date.astype(str)
        tdf.to_csv(OUT / "nqquant_v4_independent_trades.csv", index=False)

    summary = {
        "method": "NQ Quant V4 public hybrid rules on independent s-k-28 NQ 1m history; features rebuilt causally; no unpublished author caches/data",
        "source_rows_1m": int(len(nq1)),
        "source_start": str(nq1.index.min()),
        "source_end": str(nq1.index.max()),
        "overall": stats(tdf),
        "years": {},
        "meta": meta,
    }
    if len(tdf):
        years = tdf["entry_time"].dt.year
        for y in sorted(years.unique()):
            summary["years"][str(int(y))] = stats(tdf.loc[years == y])
        # Freeze 2023-24 as development context; 2025 is later untouched-by-PROP5D-risk-selection check.
        summary["validation_2025"] = stats(tdf.loc[years == 2025])

    with open(OUT / "nqquant_v4_independent_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)
    print("SUMMARY_JSON", json.dumps(summary, default=str), flush=True)


if __name__ == "__main__":
    main()