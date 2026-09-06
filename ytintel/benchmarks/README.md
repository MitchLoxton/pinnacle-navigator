# YTIntel Benchmarks

These fixtures are internal acceptance standards for YTIntel analysis quality. They are not customer-facing UI and should not add navigation clutter.

## Core rule

A premium Analyse result should feel like a smart researcher genuinely watched the full video, took notes, checked the claims, understood the creator's business intent, compared the video with the channel and market, and then turned that into useful creator action.

A result fails this benchmark if it merely paraphrases captions, repeats the same early transcript lines, fabricates unavailable metrics, or dresses generic templates up as intelligence.

## Benchmark 13 — Blake Ryan, 6 Sep 2026

- Source video: `https://www.youtube.com/watch?v=GzhT10i4vag`
- Human benchmark: `13-blake-ryan-2026-09-06.md`
- Machine-readable facts/acceptance targets: `blake-ryan-expected.json`

### Premium output contract

For a video with sufficient public evidence, YTIntel should attempt to produce these layers:

1. **Short version** — what the video really is, what it argues, how it is built, how it is performing, and what matters to the user.
2. **Facts** — title, channel, subscribers, views with pull time, upload time, runtime, word count/WPM, baseline, outlier state, replay availability and other source facts.
3. **Opening analysis** — first 30–60 seconds with timestamps and what each beat is doing, not just transcript repetition.
4. **Structure map** — major beats across the whole runtime, including what is on screen where possible.
5. **Retention/attention devices** — re-hooks, proof, receipts, objections, arithmetic, pattern interrupts and other mechanisms, each tied to evidence.
6. **Claims ledger** — each important factual/revenue/platform claim classified as verified, wrong, stale, unsupported, estimate, conflict-of-interest, etc. Never silently treat creator claims as facts.
7. **Pacing** — de-duplicated caption word count/WPM, beat lengths, silence/dead-air observations where measurable, time to first receipt/payoff/sell.
8. **Packaging** — title variants/title-test detection when observable, thumbnail read, promise-vs-delivery gap.
9. **Visuals + audio** — real video/frame evidence when available; storyboard/seek-sheet fallback when full video access is blocked; clearly state the limitation.
10. **Channel context** — recent upload baseline, median, age-aware outlier status, recent winners and what the audience seems to respond to.
11. **Cross-channel validation** — compare the topic/claim with independent examples; distinguish a real market vein from one creator's framing.
12. **Business/funnel read** — selling share, CTA timing, product placement, lead-gen intent and incentives/conflicts.
13. **What to steal / what not to copy** — transferable mechanics versus unsupported claims, brand-incompatible tactics or literal imitation.
14. **Remake blueprint** — original user-specific directions built from the evidence, not preset packages.
15. **Measurement plan** — what to measure after publishing to learn whether the remake hypothesis was right.

### No-fake-data rules

- If Most Replayed is unavailable, say why and fall back to transcript-derived attention hypotheses labelled as hypotheses.
- If a channel baseline cannot be computed, show the missing source/constraint instead of an empty score that looks authoritative.
- Stamp time-sensitive facts with pull time/age.
- Never infer private retention, impressions, CTR or revenue unless the source explicitly provides them.
- If conflicting titles are observed on watch/channel/search surfaces, treat that as possible title testing rather than a parsing error.

The benchmark is deliberately demanding. YTIntel does not need every section for every video, but it should never regress into transcript echo and pretend that is premium intelligence.
