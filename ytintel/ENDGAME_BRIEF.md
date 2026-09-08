# YTIntel — Endgame Product Brief

Status: canonical product direction
Locked from Mitchell's brief: 2026-09-08

## One-line product

Find a winning video in your niche, understand why it popped off without having to watch the whole thing, inspect the important content/packaging mechanics, and turn the useful mechanics into a video blueprint tailored to your own channel and brand rules.

The end state is a compounding vault of winning videos across niches/subniches: script styles, edit styles, hook/title keywords, motion-graphics patterns, thumbnail compositions, summaries, key takeaways, and visual/audio evidence.

## Who it is for

The wealth circle: creators and channel teams who currently burn a day on competitor research or pay for tools that critique only a narrow slice of the problem.

## Product rules

1. The output is the video to make. The data exists to justify and improve that output.
2. The user should be able to understand a source video without watching the whole video.
3. Every prescriptive recommendation must be tailored to the user's niche, subniche, channel, audience, brand rules and relevant competitors.
4. Source evidence and interpretation must remain separate. Never present a transcript line as if it were the analysis.
5. Never invent Most Replayed data, frames, audio events, motion graphics, A/B tests, subscriber growth or any other source that was not actually available.
6. The analysis should finish as fast as the real work allows. Ten minutes is a quality benchmark, not an artificial timer.
7. The progress UI can show task delegation, evidence status, agents/workstreams and cross-check outcomes. It must not expose hidden model chain-of-thought.
8. Until the single-video analysis is excellent, do not expand the active product surface with Watchtower or other feature sprawl.

## Four differentiators

### 1. Most Replayed intelligence

On competitor videos: surface the public Most Replayed curve when it is actually exposed, with the exact sentence under every peak/trough and what is on screen at that second. If the curve is unavailable, state why and show transcript-based hypotheses clearly labelled as hypotheses.

### 2. Group video analysis

Compare winning videos side by side: packages, titles, thumbnails, similarities, stats, hook lines and common mechanics in one table/analysis surface.

### 3. Prescriptive output

The final output is a remake blueprint written to the user's own brand rules: title directions, hook variants, beat sheet, thumbnail composition, what to steal mechanically, what not to copy, and what to measure after publishing.

### 4. Watchtower

Track key competitors/enemies: uploads, traction and channel-relative movement. This is intentionally after the single-video core.

## First-use creator setup

The tool should ask for and persist:

- Niche
- Subniche
- User's channel
- Audience
- Brand rules / things never to copy
- Key competitors to model and grow against

This profile should feed the prescriptive sections of every future analysis.

# The locked 17-section Monday Brief contract

This order is the heart of YTIntel and should not drift.

## 1. The strip

One-line metadata strip: title, channel, subs, views, likes, comments, upload date and age, length, outlier multiple against the channel median with age flag, niche, subniche and pull time.

## 2. The summary — so you never watch it

10–15 concise lines from the transcript: what the video is, what it argues/shows, beat by beat with timestamps, plus a one-sentence verdict on why it popped off. Include relevant pacing context such as WPM. The full transcript stays at the bottom.

Model synthesis preferred. Deterministic evidence mode is allowed only when clearly labelled.

## 3. Key takeaways

5–8 actionable takeaways with timestamp + exact supporting quote. If the source is a numbered/facts video, preserve the actual declared items when the evidence supports them.

Model synthesis preferred. Deterministic evidence mode is allowed only when clearly labelled.

## 4. Hook breakdown

First 60 seconds line by line: what each line is doing, hook type, exact opening line to model, seconds to first promise and why it works. Hooks should be banked for later side-by-side comparison.

## 5. Re-hooks

Every attention reset with timestamp, quote, reason it resets attention and median spacing.

## 6. Payoffs

Where the promise gets paid: results, receipts, reveals or evidence. Seconds to first payoff, payoffs per minute and whether the title promise was delivered.

## 7. Most Replayed

Public curve when available. Peaks and troughs with exact transcript line and on-screen state. If unavailable, explain why and use labelled hypotheses only.

## 8. Things to steal / what not to copy

Transcript-backed mechanics to model and specific source wording/unsupported claims not to copy.

## 9. Visuals — key frame by key frame

Production mode, cuts per minute, visual rhythm by beat, frames at replay peaks and thumbnail composition. Only claim what was actually inspected.

## 10. Motion graphics

Every text overlay, zoom, transition, pop-up and b-roll insert with timestamp, plus which sit on replay peaks. Include useful script/edit-style inference when evidence supports it.

## 11. Audio

WPM overall and by minute, longest silence, music start/shift points, sound effects with timestamps and audio under replay peaks. Do not invent acoustic events when raw audio is unavailable.

## 12. Packaging

Title, public title test when actually observed, thumbnail read, title/hook keywords, promise versus delivery, and deep thumbnail composition analysis. Store packages for later side-by-side comparison.

## 13. Channel context

Channel median, this video versus median, real channel hits and repetition of the same angle across the channel.

## 14. Make it yours

2–3 remake directions using the user's own profile/brand rules. Each direction: title variants, hook line, beat sheet, thumbnail composition, steal-this, do-not-copy-that and post-publish measurements.

Model call / genuine model synthesis required for the full-quality version.

## 15. Vault entry

File by niche/subniche. Store script style, edit style, motion graphics, hook keywords, title keywords, thumbnail composition tags and the source report.

## 16. Export + cross-check

Whole report as Markdown and PDF plus a final cross-check for unsupported claims, missing evidence and promise/delivery mismatch.

Model cross-check required for the full-quality version.

## 17. Full transcript

Timestamped transcript at the bottom with Markdown/copy support so the user can independently cross-check it with another AI if desired.

# Analysis execution model

## Real workstreams

Run independent workstreams whenever the required source exists:

- Source + metadata
- Transcript cleanup / structure
- Hook / re-hook / payoff
- Most Replayed
- Visual/frame analysis
- Motion graphics
- Audio/pacing
- Packaging + channel context
- Creator-tailored remake
- Cross-check
- Vault/export

Parallelise where doing so actually reduces latency. Do not create fake agents merely for UI theatre.

## Progress UI

After the user presses Analyse, show:

- Global completion percentage
- Current evidence/task stage
- 17-section roadmap
- Research workstream/agent lanes
- Concise activity log such as “transcript normalized”, “hook pass started”, “channel median loaded”, “frame source unavailable”
- Explicit blocked/limited states instead of silent omissions

Do not display hidden reasoning or chain-of-thought. Show actions, evidence and outcomes.

# Product sequencing

## P0 — Heart of the tool (NOW)

Single-video 17-section analysis, creator DNA, prescriptive tailoring, evidence honesty, progress/workstream UI, export, and vault banking.

## P1 — Vault depth

Hook bank, package bank, thumbnail composition bank, style frequency summaries and comparison surfaces across saved winners.

## P2 — Group video analysis

Side-by-side winners with package/hook/stats/mechanics comparison.

## P3 — Watchtower

Competitor/enemy tracking and traction alerts.

# Current evidence limitations that must remain visible

The current zero-credit web build can fetch transcript/metadata/channel evidence and use a ready on-device language model for the model-dependent sections. It cannot claim full frame-by-frame video inspection, acoustic audio analysis or frontier cloud-model reasoning unless those sources/capabilities are genuinely available.

The build should improve toward those endgame capabilities without pretending they already exist.