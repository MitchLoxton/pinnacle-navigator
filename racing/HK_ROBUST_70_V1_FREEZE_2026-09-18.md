# HK ROBUST 70 V1 — FROZEN SHADOW CANDIDATE

Freeze date: 2026-09-18.
Status: SHADOW ONLY. Not approved for real-money execution.

## Objective
Build the simplest defensible Hong Kong WIN system in the requested roughly 60-200 bets/year range while prioritising turnover, calibrated edge, drawdown control, later-period stability and execution realism over headline backtest profit.

## Source and anti-overfit boundary
- Source: HK_BEAT_AUSTRALIA_V1_RESEARCH.xlsx / sheet 06 R3 RAW, sourced from HKJC_R3_COMBO_PROPOSAL_V2.xlsx BET LOG.
- 1,120 simple candidate rules were screened from pre-result fields only.
- Primary development: 2015-2021.
- Reused audit: 2022-2025.
- 2026 through 12-Jul-2026 is shown only as a diagnostic. It is NOT a virgin holdout because 2026 has been inspected in prior HK research.
- From this freeze forward, do not change the selection thresholds because of wins or losses.

## Frozen selection rule
1. Runner must be in the supplied model universe: R2 CORE or satellite.
2. Market rank <= 8.
3. WIN odds >= 2.50 and < 30.00.
4. After damaging the profit portion of the research price by 3%, calibrated model EV must be >= +4.0%.
5. Maximum one runner per race: highest stressed calibrated model EV; tie-break lower odds, then higher original raw model EV.
6. Maximum three selections per HK race day. If more than three races qualify, keep the three highest stressed calibrated model EV selections.
7. Flat 1-unit research risk. No Kelly, no edge-tier stake increases, no loss chasing.
8. Live execution must re-check the actual runner-specific executable WIN quote. If the current quote does not still produce >= +4.0% calibrated EV, PASS.

## Completed-history score — 2015-2025
- 778 bets.
- 70.73 bets/year.
- 70.73 stake-units turnover/year.
- +12.43 units/year historical realized P/L.
- 17.58% historical realized ROI.
- 9.12% calibrated model ROI.
- 34.0-unit chronological max drawdown.
- 2 losing completed calendar years.
- Worst completed year: -30.145u.

At a purely illustrative A$1,000 research unit, that corresponds to about A$70.7k annual turnover, A$12.4k historical annual P/L and A$34k historical chronological drawdown. This is NOT a recommended live stake.

## Chronological stability
Development 2015-2021:
- 80.0 bets/year.
- 18.71% realized ROI.
- 9.22% calibrated model ROI.
- 31.858u max DD.
- 1 losing year.

Reused audit 2022-2025:
- 54.5 bets/year.
- 14.67% realized ROI.
- 8.88% calibrated model ROI.
- 34.0u max DD.
- 1 losing year.

2026 diagnostic through 12-Jul:
- 36 bets.
- +6.114u.
- +16.98% realized ROI.
- 8.57% calibrated model ROI.
- 12u DD.
Again: this is not a virgin holdout.

## Fixed-selection price stress
The selected bets are frozen first; worse prices are then applied without reselecting:
- 5% damage: 15.48% realized ROI; 7.19% model ROI; 34u DD.
- 8% damage: 12.34% realized ROI; 4.29% model ROI; 36.064u DD.
- 10% damage: 10.24% realized ROI; 2.36% model ROI; 38.28u DD.

## Robustness checks
- Nearby rank caps and odds floors around the chosen rule retained similar calibrated model ROI, so the rule is not dependent on one exact rank boundary.
- A max-three-per-day exposure cap is used because it preserves the activity target while limiting same-day concentration.
- A same-day realized-loss stop was tested and did not improve the reused audit; it is excluded rather than kept because it happened to look good in one historical slice.
- 10,000 within-year race-day reorder simulations: median max DD 49.6u, p95 63.41u, p99 70.04u.
- Recent 2019-2025 day-block bootstrap: median annual P/L +9.82u; 5th percentile -27.45u; estimated losing-year frequency ~35.1%.

## Major warning that remains
Historical realized profit is concentrated in a few high-odds winners:
- largest winning position ≈ 19.2% of completed net profit;
- top five winning positions ≈ 79.4%.

This is why the 17.6% historical ROI must NOT be treated as a forward expectation. The calibrated model ROI around 9% is the more conservative anchor, and even that is not guaranteed.

## Production status
NO REAL-MONEY PROMOTION YET.

Promotion requires all of the following on genuinely new meetings after 18-Sep-2026:
- frozen model classifications and probabilities generated before outcomes;
- every signal and every pass logged;
- runner-specific executable WIN quote timestamp <=10 seconds;
- live quote still clears +4% calibrated EV;
- accepted stake/size and slippage logged;
- frequency and calibration remain acceptable;
- realized and model drawdown reviewed without retuning;
- capacity verified at the intended stake.

The objective is not to force 200 bets/year. Current evidence supports roughly the 60-100/year area more defensibly than higher-frequency variants.
