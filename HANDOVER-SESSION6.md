# Session 6 Handover — Dev-Tools Extension (Phase 2)

## Session Summary
Built and deployed the `dev-tools` OpenClaw extension — Phase 2 of the 3-phase behavioral upgrade plan.

## What Was Done

### Extension: `extensions/dev-tools/`
| File | Purpose |
|------|---------|
| `openclaw.plugin.json` | Manifest with `enabledByDefault: true`, `configSchema`, contracts for glob/grep |
| `package.json` | Only dep: `@sinclair/typebox` (workspace-hoisted) |
| `api.ts` | Re-exports from `openclaw/plugin-sdk/plugin-entry` |
| `index.ts` | Entry point: registers 2 tools, 2 hooks (before/after_tool_call, before_prompt_build) |
| `src/glob-match.ts` | Custom glob-to-regex matcher (replaced `fast-glob` to avoid lockfile issues) |
| `src/tools/glob-tool.ts` | File pattern matching, mtime sort, 500 cap, path containment |
| `src/tools/grep-tool.ts` | Regex search, 3 output modes, context lines, 100KB cap, binary skip |
| `src/hooks/read-before-edit.ts` | Per-session tracking, blocks edit/write on unread files |
| `src/prompt-guidance.ts` | 5-line system context injected via `before_prompt_build` |

### Config Changes
- `~/.openclaw/openclaw.json`: Added `plugins.entries.dev-tools.enabled: true`
- `~/.openclaw/openclaw.json`: Removed `channels.telegram.commands.ownerAllowFrom` (schema rejected)
- `~/.openclaw/workspace/AGENTS.md`: Tool Policy updated — glob/grep as primary, read-before-edit noted

### Build & Deploy
- pnpm lockfile updated via Docker container (pnpm not available on Windows host)
- Docker image rebuilt (`docker build -t openclaw:local .`)
- Gateway healthy: "ready (8 plugins, 84.2s)" — up from 7

## Issues Encountered & Resolved
1. **Missing `configSchema`**: Plugin manifest validation at `src/plugins/manifest.ts:486` requires `configSchema` for ALL plugins. Initial manifest omitted it. Fixed by adding empty schema object.
2. **`ownerAllowFrom` rejection**: `channels.telegram.commands.ownerAllowFrom` no longer in schema. Removed.
3. **`fast-glob` dependency**: Adding it would require lockfile update. Replaced with zero-dep solution: custom glob matcher + Node `fs.readdir({recursive:true})`.
4. **Docker buildx output buffering**: `docker build` with buildx shows no output until completion. Use `--progress=plain` and pipe stderr.
5. **pnpm not on Windows host**: Used `docker run node:24-bookworm` to run `pnpm install --no-frozen-lockfile`.

## Current State
- Gateway: running, healthy, 8 plugins
- Telegram: connected
- WhatsApp: connected
- Phase 1: COMPLETE
- Phase 2: COMPLETE
- Phase 3: NOT STARTED (3 skill files: git-workflow, project-scaffold, dev-orchestrator)

## Files Modified This Session
- `extensions/dev-tools/` (9 files — new)
- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/workspace/AGENTS.md` (tool policy update)
- `pnpm-lock.yaml` (lockfile update for workspace package)
