# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->

## Build & Test

Toolchain is **Vite+** (`vp`), package manager is **pnpm** — `preinstall` runs
`only-allow pnpm`, so npm/yarn/bun will fail. `vp` also owns Node (`.node-version`)
and the pnpm version (`package.json#packageManager`); install it once from
<https://viteplus.dev> and let it bootstrap the rest.

```bash
vp install        # deps (postinstall runs `nuxt prepare`)
vp run dev        # tauri dev (Nuxt + Rust)
vp check          # oxfmt + oxlint + type check
vp run lint       # eslint, **/*.vue only
vp test           # vitest, one-shot (`vp test watch` to watch)
vp run test:e2e   # wdio (needs a built binary)
vp run build      # scripts/build.sh
vp run db:types   # regenerate app/types/db.ts via kysely-codegen
```

Quality gate before closing an issue: `vp check && vp run lint`.

`vp dev`, `vp build` and `vp test` are built-ins and **cannot** be shadowed by
same-named scripts — use `vp run <script>` for `dev`, `build`, `generate` etc., which
are Tauri/Nuxt commands, not Vite ones.

Linting is split deliberately:

- `vite.config.ts` — oxfmt + oxlint config. oxfmt formats **every** file type,
  `.vue` included; oxlint + tsgolint lint and type-check JS/TS.
- `eslint.config.mjs` — ESLint, scoped to `**/*.vue` only, because oxlint has no SFC
  parser. Do not widen the `lint` script back to `eslint .` or it starts duplicating
  oxlint on every TS file.

## Architecture Overview

See [AGENTS.md](AGENTS.md) — stack, per-platform webview differences, module map, and
the performance/security priorities. Read it before your first edit.
