# YTIntel Weekly Reviews

This directory is the permanent operating log for YTIntel.

Every Sunday, the YTIntel Sunday Review automation creates one dated Markdown file using Australia/Perth time:

`YYYY-MM-DD.md`

Each review uses the same operating structure:

- STATUS
- SHIPPED
- VERIFIED
- PROBLEMS
- LESSONS
- BACKLOG
- NEXT WEEK
- TOP 3
- SUNDAY CHECKPOINT

A GitHub Actions workflow posts each newly created dated review automatically to the dedicated Discord weekly-review channel. The Discord webhook itself is stored only as a GitHub Actions secret and must never be committed to this repository.
