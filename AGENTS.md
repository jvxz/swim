# Codebase Overview for AI Agents

This document gives AI agents context about the project so they can work effectively in the codebase.

> **This repo is the agent-driven fork.** `origin` is `jvxz/swim` — push here freely.
> `upstream` (`jvxz/music-test`) is the owner's hand-written original: **fetch-only, never
> push** (its push URL is deliberately broken). Do not open PRs against upstream.

## What This Application Is

**Swim** is a desktop music player for archivists. It manages local music libraries, playlists, and playback with a focus on metadata, scrobbling, and long-term library management.

**Core features:**
- Playback (play, pause, seek, volume, loop)
- Library (add folders, scan tracks, browse)
- Playlists (create, rename, delete, add/remove/reorder tracks)
- Last.fm scrobbling with offline cache
- ID3 metadata read/write and cover art
- Waveform visualization with caching
- Customizable UI (resizable panels, layouts, track list columns)

**Tech stack:** Nuxt 4 (SPA) + Vue 3 + Tauri 2. Frontend: UnoCSS (presetWind4), Reka UI, VueUse, Pinia, Kysely, Zod, Fuse.js. Backend: Rust with Kira/Symphonia (audio), SQLite, id3, Stronghold, keyring.

---

## Top Priorities

1. **Performance** — Caching (DashMap in Rust, Pinia + `useState` in frontend), virtualization for large track lists (`useVirtualList`), `v-memo` on rows, `shallowRef`/`readonly` where appropriate, debounced persistence and API calls.
2. **Efficiency** — Minimize IPC, batch operations, lazy-load heavy components, use `computed` instead of methods in templates.
3. **Security** — Tauri capabilities are scoped (fs, SQL, HTTP for Last.fm only). Last.fm session keys in Stronghold; master password in OS keychain (Keychain/Credential Manager/Secret Service). API keys from env at build time.

---

## Native-Feel Preference

Native-feel is desired. Prefer native or platform-appropriate solutions when feasible and readable. This is a guideline, not a hard rule—web-based or cross-platform approaches are used when they make more sense.

---

## Tauri Webview Differences Across Platforms

The webview setup differs per OS. Be aware of this when debugging, testing, or adding features that depend on the webview.

| Platform | Engine | Notes |
|----------|--------|-------|
| **macOS** | WKWebView (WebKit) | Preinstalled, version tied to macOS. Safari-like rendering. `dataStoreIdentifier` on 14.0+. Theme support from 10.14+. Transparent windows need `macos-private-api` (blocks App Store). |
| **Windows** | WebView2 (Chromium/Edge) | Auto-updates independently. Preinstalled on Windows 11. Edge DevTools. Scrollbar styles and extensions are Windows-specific. |
| **Linux** | WebKitGTK | Version depends on distro. Requires system deps (e.g. `libwebkit2gtk-4.1-dev`). Limited scrollbar customization, app-wide theme. |

**Implications:**
- Test on target platforms early; WebKit/Chromium versions differ.
- Use feature detection instead of assuming cross-platform parity.
- DevTools differ: Safari Inspector (macOS), Edge DevTools (Windows), WebKitGTK WebInspector (Linux).
- Some features are platform-specific (e.g. `browserExtensionsEnabled` only on Windows; `dataStoreIdentifier` only on macOS 14+).

---

## Architecture Hints

- **Composables** in `app/composables/` for domain logic; `createSharedComposable` for playback.
- **Pinia** for shared state (e.g. track data cache).
- **Rust** in `src-tauri/src/`: `audio.rs`, `playback.rs`, `read.rs`, `id3.rs`, `lastfm.rs`, `waveform.rs`, `stronghold.rs`.
- **Tauri APIs** are auto-imported with `useTauri` prefix; check `import.meta.env.TAURI_PLATFORM` before use.
- See `.cursorrules` for conventions (Nuxt, Vue, UnoCSS, Reka UI, etc.).


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
