# HK ROBUST 60 ROI30 V1 — FROZEN SHADOW CANDIDATE

Freeze date: 2026-09-18
Status: SHADOW ONLY — NOT REAL-MONEY APPROVED

## Objective
Meet the requested >30% HISTORICAL realized ROI while keeping the system around 60+ bets/year and explicitly prioritising drawdown, chronological stability, price stress and forward-test discipline.

## Data / model boundary
Source: HK_BEAT_AUSTRALIA_V1_RESEARCH.xlsx / sheet 06 R3 RAW, sourced from HKJC_R3_COMBO_PROPOSAL_V2.xlsx BET LOG.

The source provides date, race ID, historical WIN research odds, market rank, result, R2-core flag, satellite flag, original raw model EV and conservative probability. Calibration uses the already-frozen log-odds intercept 0.1679327961221175.

2015-2021 is treated as the primary development block. 2022-2025 is reused audit evidence. 2026 through 12-Jul has already been seen in prior HK research and is therefore a diagnostic, NOT an untouched holdout.

## Frozen rule
### Sleeve A — R2 CORE
- R2 core = true
- market rank <= 8
- odds 4.00-<8.00 OR 20.00-<30.00
- stressed calibrated model EV >= +3%

### Sleeve B — Satellite
- satellite-only = true
- either market rank <= 3 and odds 2.50-<9.00
- OR original raw model EV >= +12%
- stressed calibrated model EV >= +3%

### Sleeve C — Mid-price extension
- R2 core OR satellite-only
- market rank <= 6
- odds 12.00-<20.00
- stressed calibrated model EV >= +5%

### Ranking / risk
- Historical primary score damages the winning profit portion of price by 3%.
- One selection per race: highest stressed calibrated model EV; tie lower odds, then higher original raw model EV.
- Maximum five selections per Hong Kong race day; if more qualify, keep the five highest stressed calibrated model EV races.
- Flat 1-unit research risk. No Kelly, no edge-tier size, no loss chasing.
- A live executable quote must re-clear the same sleeve EV threshold or the bet is a PASS.

## Completed 2015-2025 score
- 667 selections
- 60.64 bets/year
- 35.58% historical realized ROI
- 8.64% calibrated model ROI
- +21.57 units/year historical P/L
- 28.13u chronological max drawdown
- 2 losing completed calendar years
- worst completed year -8.091u

Illustrative A$1,000 research-unit scaling:
- ~A$60.6k turnover/year
- ~A$21.6k historical P/L/year
- ~A$28.1k chronological historical DD
This is not a recommended live stake.

## Chronological slices
Development 2015-2021:
- 498 bets / 71.14 per year
- 30.86% realized ROI
- 8.59% model ROI
- 28.13u DD
- 1 losing year

Reused audit 2022-2025:
- 169 bets / 42.25 per year
- 49.47% realized ROI
- 8.76% model ROI
- 15.0u DD
- 1 losing year

2026 diagnostic through 12-Jul:
- 36 bets
- +11.673u
- +32.43% realized ROI
- 7.73% model ROI
- 10u DD
This is not a virgin holdout.

## Fixed-selection price stress
The exact selected bets are kept fixed and only prices are worsened:
- 3% damage: 35.58% realized ROI / 8.64% model ROI / 28.13u DD
- 5% damage: 33.20% realized ROI / 6.76% model ROI / 28.42u DD
- 8% damage: 29.63% realized ROI / 3.94% model ROI / 28.84u DD
- 10% damage: 27.25% realized ROI / 2.06% model ROI / 29.13u DD

So the >30% historical realized ROI survives 5% adverse price damage but not 8%. This is why live runner-specific quote verification is mandatory.

## Local threshold-neighborhood robustness
729 nearby rule combinations were checked around the frozen family:
- 73.25% retained >=30% completed-history ROI
- 41.02% retained 60-80 bets/year
- 16.05% retained BOTH the frequency and >30% ROI targets
- 12.76% retained frequency + >30% ROI + positive reused-audit ROI + non-negative 2026 diagnostic

This does not make the historical result independent evidence, but it is better than relying on one knife-edge threshold.

## Drawdown / concentration stress
10,000 within-year race-day reorder simulations:
- median max DD 30.47u
- p95 42.78u
- p99 47.27u
- max observed 55.22u

Recent 2019-2025 race-day bootstrap, 20,000 simulations:
- 5th percentile annual P/L -19.68u
- median +16.11u
- 95th percentile +63.62u
- estimated losing-year frequency ~24.9%

Winner concentration:
- top single winner ~11.0% of completed net profit
- top five ~45.8%
- top ten ~78.5%

## Interpretation
The user's >30% request is met on historical realized ROI, not as a future guarantee. The calibrated model ROI is materially lower (~8.6%), which is the more conservative forward anchor.

The rule is frozen now. Do not improve the backtest after this date by changing thresholds. The next useful evidence is genuinely new Hong Kong racing after 18-Sep-2026 with every signal, pass, live quote, accepted size, slippage and result recorded.

## Production gate
Real-money BET NOW remains disabled until:
- genuine post-freeze forward evidence is sufficient;
- live model classification/probability is verified pre-race;
- executable runner quote is <=10 seconds old;
- the quote still clears the frozen +3%/+5% sleeve gate;
- accepted-size and capacity are verified;
- drawdown/calibration are reviewed without retuning.
