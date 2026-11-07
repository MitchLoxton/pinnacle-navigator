# Agent instructions

For any task touching the racing application, read `racing/AI_CONTEXT.md` completely before making changes.

Non-negotiable:
- Preserve immutable BET NOW history.
- Never fabricate race data, odds, results, signals or execution.
- Never change frozen Australia V11 or Hong Kong V2 predictive rules without explicit user permission.
- Query canonical Supabase evidence for current racing state.
- Validate changed JSON/JS before committing.
- Never commit credentials or secrets.
- Prefer a branch/pull request for material code changes.

The live racing application is under `racing/`.
