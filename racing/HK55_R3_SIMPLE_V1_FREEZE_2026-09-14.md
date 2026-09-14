# HK55 R3 SIMPLE V1 — FROZEN BEFORE 2026 DIAGNOSTIC

Freeze date: 2026-09-14.

Status: research / shadow candidate only until later-data and live-execution gates are checked.

## Why this candidate
The user target is roughly 60 Hong Kong bets per year, but risk quality takes priority over forcing the count to exactly 60. A simple 2015-2025 search showed that pushing the same family to ~60-61 bets/year introduced materially more losing years and worse drawdown. This candidate stops at ~53 bets/year because it was the cleaner risk/return point.

The rule below was selected using 2015-2021 development plus the already-reused 2022-2025 audit. No 2026 row was used to choose the rule below. After this freeze, 2026 source-cutoff rows may be inspected once as a diagnostic but may not be used to change HK55 R3 SIMPLE V1.

## Frozen rule
Source universe: `HKJC_R3_COMBO_PROPOSAL_V2.xlsx` BET LOG.

Historical scoring: WIN only; no rebate; 3% adverse deterioration of the winning profit portion of price; one horse maximum per race; fixed A$5,000 research-scale stake only for comparable dollar/risk metrics.

A runner may qualify when stressed calibrated model EV is >= 0 and either:

1. **Main band**
   - market rank <= 4; and
   - WIN odds 4.00 to <8.00.

2. **R2 long sleeve**
   - R2 core = true;
   - market rank <= 8;
   - WIN odds 18.00 to <30.00;
   - stressed calibrated model EV >= 0.

If multiple runners qualify in one race, take one only: highest stressed calibrated model EV; tie-break lower WIN odds, then higher original raw model EV.

No rebate, Kelly, martingale, multiple horses in a race, hidden discretionary choice, or threshold change after seeing 2026/future results.

## 2015-2021 development
- 426 bets; 60.86 bets/year.
- Stressed realized ROI ~31.1%.
- Calibrated model ROI ~7.8%.
- Annual stressed historical P/L ~A$94,538 at the A$5k research scale.
- Chronological max DD ~A$100,000.
- 0 losing development years.
- Worst development year ~+A$30,975.

## Reused 2022-2025 audit
- 160 bets; 40.0 bets/year.
- Stressed realized ROI ~41.1%.
- Calibrated model ROI ~7.8%.
- Annual stressed historical P/L ~A$82,249 at the A$5k research scale.
- Chronological max DD ~A$63,660.
- 0 losing audit years.
- Worst audit year ~+A$30,420.

## Completed 2015-2025
- 586 bets; **53.27 bets/year**.
- Annual turnover ~A$266,364.
- Annual stressed historical P/L ~A$90,069.
- Stressed realized ROI ~33.8%.
- Calibrated model ROI ~7.8%.
- Chronological max DD ~A$114,465.
- 0 losing completed years.
- Worst completed year ~+A$30,420.

## Predeclared decision rule for the 2026 diagnostic
Reject this candidate for real-money promotion if the 2026 source-cutoff sample shows a severe realized collapse inconsistent with the historical risk picture, negative calibrated model ROI, or materially excessive drawdown. A good 2026 diagnostic still does not make it guaranteed or production-proven; genuine post-freeze forward selections and executable-price/capacity evidence remain required.
