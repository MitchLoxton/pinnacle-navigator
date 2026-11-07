# MITCHELL Racing — Master AI Context

Last handoff refresh: 7 November 2026 (Australia/Perth)

This file is the durable handoff for ChatGPT/Codex, Claude/Claude Code, and future coding agents. Read this file before changing anything under `racing/`.

## 1. What this project is

Primary live racing app:
- Repository: `MitchLoxton/pinnacle-navigator`
- App directory: `racing/`
- Live site: `https://mitchloxton.github.io/pinnacle-navigator/racing/`
- Timezone: `Australia/Perth`
- Supabase project: `dkmacktcfhubsumwrydw`

The repository contains other projects. Do not assume unrelated root-level files belong to the racing system.

## 2. Highest-priority rule: never invent evidence

This project is extremely sensitive to stale or fabricated race information.

Never invent or backfill:
- runners
- favourites
- odds
- race times
- results
- BET NOW signals
- accepted executions
- system P/L
- model classifications
- Hong Kong pre-race qualification
- historical statistics

If a source is unavailable, say it is unavailable. Do not manufacture a substitute.

## 3. Australia V11 — immutable operating truth

The production strategy is the frozen Australia V11 CORE system.

Streams:
- Perth: PR1–PR7
- Sydney: SR1–SR7
- Melbourne: MR1–MR7
- Saturday-only stream tracking

State progression:
- favourite WIN => state resets to 0
- favourite LOSS => state increases by 1

A state only becomes a watch race if the exact `race_code|state` exists in the frozen V11 CORE evidence map.

A CORE match is NOT an early bet.

A bet exists only when the live engine passes every frozen live gate and creates an immutable `BET_LOCKED` event and/or sent `BET_NOW` instruction.

### Immutable BET NOW rule

Every canonical `BET_LOCKED` event or sent `BET_NOW` instruction permanently counts as one system bet, deduplicated by race.

Once a BET NOW exists:
- a later NO BET cannot erase it
- whether Mitchell personally placed the wager is irrelevant to system statistics
- system P/L uses the instructed stake and recorded instruction price
- real bookmaker cash execution is a separate audit

The user wants EVERY system-generated BET NOW signal recorded, whether personally wagered or not.

## 4. Australia V11 frozen historical benchmark

Do not change these numbers unless the underlying frozen historical research is intentionally re-audited.

- Bets/year: 38.83
- Annual turnover: A$315,752.78
- Average completed-FY historical profit: A$178,084.86
- Historical ROI: 56.40%
- Maximum stake: A$10,000
- Losing completed FYs: 0
- Worst completed FY: +A$5,615
- Recorded max drawdown: A$79,850
- Reorder-stress max drawdown: A$108,800

The current preferred production policy is V11 CORE with the fixed A$100K safe-floor policy described in `racing/stats.json`. It does NOT change predictive selection rules before that threshold.

The ~65-bet Australian expansion is shadow-only. Do not promote it without explicit user authorization and a fresh chronological audit.

## 5. Australia current snapshot — 7 November 2026

This section is a dated snapshot, not a permanent rule. Always re-read `racing/current.json` and Supabase before acting.

After the 31 October 2026 card:
- 21/21 stream states reconciled
- 31 Oct had two immutable BET NOW signals:
  - SR7 JIMMYSSTAR (NZ), A$10,000 @ 3.70 — LOSS
  - MR7 STORMY MARCO, A$10,000 @ 4.80 — WIN
- 31 Oct system week: +A$28,000
- 2026 system ledger after 31 Oct: 10 bets, 3W/7L, A$82,750 turnover, +A$26,350 system P/L
- actual accepted bookmaker cash remains a separate record

For Saturday 7 November 2026 the frozen CORE watch races are:
- MR1 Flemington — state 4 — historical base reference A$4,000
- SR7 Rosehill Gardens — state 5 — historical base reference A$6,000

These are watch races only. They become system bets only if the live engine actually emits BET NOW.

Always treat `racing/current.json` and the live database as fresher than this dated snapshot.

## 6. Canonical Australia files

Important files:
- `racing/current.json` — current weekly card, watchlist, current states and app-facing status
- `racing/stats.json` — frozen historical benchmark and live system audit
- `racing/version.json` — race-day app label/version metadata
- `racing/history/YYYY-MM-DD.json` — completed weekly audits
- `racing/history/2026-bet-now-signals.json` — durable canonical system-signal ledger
- `racing/live-tab.js` — live V11 market/decision UI integration
- `racing/app.js` — base app bootstrapping
- `racing/weekly-history.js` — weekly history UI
- `racing/bet-history.js` — BET NOW history UI
- `racing/sw.js` — service worker/cache/push handling

Do not assume `current.json` alone is enough to reconstruct historical BET NOW truth. Audit the database event/push records and the durable signal ledger.

## 7. Supabase sources

Supabase project:
`dkmacktcfhubsumwrydw`

Important racing tables include:
- `racing_v11_state_history`
- `racing_v11_events`
- `racing_push_alerts`
- `racing_v11_race_state`
- `racing_v11_core_evidence`
- `racing_autobet_orders`

Source roles:
- `racing_v11_state_history`: stream state transitions and archived favourite/result evidence
- `racing_v11_events`: immutable BET_LOCKED, BET_SIGNAL_PRESERVED, RESULT and related events
- `racing_push_alerts`: sent notification evidence including BET_NOW
- `racing_v11_race_state`: live decision state and frozen decision snapshots
- `racing_v11_core_evidence`: frozen exact CORE state map / historical reference evidence
- `racing_autobet_orders`: execution/order evidence where available

Do not expose Supabase service-role secrets or other credentials in commits, chat messages, logs or documentation.

## 8. Weekly Australia update workflow

When Mitchell says "update Australia for this week":

1. Determine the upcoming Saturday in Australia/Perth.
2. Query the latest completed Saturday from Supabase.
3. Reconcile all 21 PR/SR/MR stream state transitions.
4. Audit `racing_v11_events`, `racing_push_alerts` and execution records for every genuine BET NOW.
5. Deduplicate system bets by race.
6. Permanently settle each signal using its instructed stake and instruction price.
7. Keep real accepted bookmaker cash separate from model/system P/L.
8. Compare every resulting `race_code|state` to the frozen `racing_v11_core_evidence` map.
9. Only exact CORE matches enter the upcoming watchlist.
10. Verify upcoming venues and race dates from authoritative/current sources.
11. Verify exact race times where possible; if not verified, do not guess.
12. Update:
   - `racing/history/<completed Saturday>.json`
   - `racing/history/2026-bet-now-signals.json`
   - `racing/current.json`
   - `racing/stats.json`
   - `racing/version.json`
13. Validate JSON and internal totals.
14. Re-fetch changed files and verify the published state.

Never tune the selection system based on the latest result merely to create more bets.

## 9. Hong Kong parity research

Hong Kong is research/shadow, not certified equivalent to Australia.

Frozen leader: HK PARITY V2.

Frozen V2 rules:
- R2-core odds 5.00–<8.00 OR 20.00–<30.00
- satellite-only odds 4.00–<7.00
- satellite-only market rank <=2
- satellite-only original raw model EV >=12%
- no rebate
- historical stress = 3% adverse deterioration of the PROFIT PORTION of price
- LONG CORE stake A$10,000
- other stake approximately A$7,892
- max stake A$10,000

Frozen completed 2015–2025 headline:
- 423 bets
- 38.45 bets/year
- A$315,752.78 annual turnover
- ~A$182,955 annual historical profit
- ~57.94% historical ROI
- 0 losing completed years
- worst completed year ~+A$27,843
- development ROI ~58.05%
- audit 2022–2025 ROI ~57.68%
- calibrated model ROI ~13.51%
- race-level max drawdown ~A$217,492

Primary blocker:
HK drawdown/execution risk is materially worse than Australia.

Research objective:
Find a simpler challenger that retains roughly:
- 35–45 bets/year
- A$285k–A$350k annual turnover
- >=A$178k historical annual profit
- >=~56% historical stressed ROI
- <=A$10k max stake
- max drawdown materially toward <=A$110k
- positive calibrated model EV
- chronological robustness

Hard Hong Kong integrity rules:
- Do NOT retune V2 using 2026+ outcomes.
- Freeze any challenger BEFORE examining forward outcomes.
- Prefer actual HKJC WIN-price evidence.
- Reject synthetic execution.
- Reject aggressive Kelly/concentrated staking.
- Archived final dividend alone is NOT proof of a pre-race signal or executable pre-race price.
- Genuine forward evidence requires timestamped pre-race qualification plus actual price evidence.
- If evidence is missing, report NO VERIFIED NEW PROMOTION.

Important files:
- `racing/hong-kong.json`
- `racing/hong-kong-stats.json`
- `racing/hk-main-tab.js`
- `racing/hong-kong-tab.js`

## 10. Source hierarchy

For claims that affect a bet, signal, result, state or P/L, prefer:

1. Immutable database events / sent push evidence / accepted execution evidence
2. Official race or authoritative market evidence
3. Stored weekly history files
4. App-facing JSON
5. Secondary summaries

Do not treat a previously written assistant summary as evidence if the canonical files/database disagree.

## 11. Change safety

Before modifying predictive logic:
- get explicit user permission
- identify whether the rule is frozen production or shadow research
- preserve historical immutability
- create a reproducible audit
- never backfit from current/future outcomes

Before modifying ordinary app/UI/data files:
- read the relevant current files
- preserve immutable signal history
- validate JSON/JS
- inspect the diff
- preferably work on a branch/PR
- never commit credentials

If uncertain whether a change could alter live betting decisions, treat it as predictive/production logic and do not change it casually.

## 12. New-agent startup checklist

Before answering a racing task, a new agent should:

1. Read this file completely.
2. Read `racing/current.json`.
3. Read `racing/stats.json`.
4. Read `racing/version.json`.
5. Read the newest relevant `racing/history/*.json`.
6. If the task concerns current signals/results/states, query Supabase rather than trusting stale summaries.
7. If the task concerns current race schedules/meetings/markets, verify fresh external evidence.
8. State clearly when evidence is incomplete.

## 13. What Mitchell expects

Mitchell wants:
- simple, decisive answers
- exact system-generated BET NOW signals
- no missed weekly signals
- no hindsight leakage
- no fabricated evidence
- clear distinction between potential/watch race, BET NOW system signal, and confirmed bookmaker cash execution
- Australia kept fully updated each week
- Hong Kong only promoted when it genuinely clears the research gates

The safest answer is sometimes "no bet", "unverified", or "no promotion". Never create activity just to make the system look busy.
