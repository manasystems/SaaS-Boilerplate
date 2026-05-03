# Mana Build — AGENTS.md (for Codex)

This file is the entry point for Codex sessions on this repo. The full project context lives in `CLAUDE.md` — read that first.

## Required reading order for every session

1. `CLAUDE.md` — stack, file structure, architecture rules, build history, scope.
2. `docs/specs/Mana_Line_Item_Hierarchy_Spec.md` — the locked data model for estimates (line item → subtask → resource).
3. The specific spec doc referenced in the current task prompt (e.g., `docs/specs/Mana_Beta1.2_Subtask_Production_Spec.md` if working on subtask production).

## How to work in this repo

- **Branch policy:** never push to `main`. Create a feature branch named `codex/<short-task-slug>` (e.g., `codex/tenancy-refactor`). Open a PR against `main` when done.
- **Test first:** before writing code, scan existing tests in `src/**/*.test.ts` to see the conventions. Add tests for any non-trivial change.
- **Type check before pushing:** `SKIP_ENV_VALIDATION=1 npx tsc --noEmit`. Must be clean.
- **Migrations:** new migrations go under `migrations/` with sequential numbers and IF NOT EXISTS / additive patterns. Never drop columns in a migration without a clear backfill plan.
- **Commit messages:** conventional commits — `feat(beta1.X-dayY): short summary`. Match the pattern of recent commits in `git log`.

## What NOT to do

- Do NOT run `npm run build` — it requires production env vars and will fail in the Codex environment. Use `SKIP_ENV_VALIDATION=1 npx tsc --noEmit` for type-check.
- Do NOT modify `CLAUDE.md` or any spec doc in `docs/specs/` unless the task explicitly says to.
- Do NOT add new dependencies casually — if a package is needed, justify it in the PR description.
- Do NOT touch files outside the scope of the task. If the task is "redesign the dashboard," do not also reformat unrelated files.

## When you're stuck

If a task prompt is ambiguous, post a comment in the PR explaining the ambiguity and the options you considered, and pick the simplest one. Claude (the reviewer) will adjust direction in review if needed. Do not paralyze on small decisions.

## After the PR is open

- Set the PR description to: a one-paragraph summary, a list of files changed grouped by area, the testing you performed, and any follow-up TODOs.
- Add a comment on the linked Linear issue (URL in the task prompt) with the PR URL.
