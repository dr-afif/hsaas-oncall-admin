# Worktree Notes

This repository is sometimes used with local IDE/app tooling. Do not clean or delete local files just because they are untracked or modified.

## Current Local-Only Candidates

These files/directories may be local tooling or IDE state and should be reviewed before committing:

- `.agents/`
- `.codex`
- `skills-lock.json`
- `ONCALL APP.code-workspace`

## Current Modified Files To Review Separately

These tracked files had local changes outside the recent focused commits:

- `.gitignore`
- `public/index.html`
- `public/js/auth.js`
- `public/js/config.example.js`
- `public/js/supabase-client.js`
- `public/login.html`
- `public/style.css`
- `sql/07_seed_holidays_2026.sql`

## Suggested Triage

- Commit only files that are intentionally part of the app or shared project tooling.
- Keep machine-specific editor state uncommitted.
- Add ignore rules only after confirming a file is not needed by collaborators or deployment.
