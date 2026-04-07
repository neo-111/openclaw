# Session 7 Handover — Phase 3 Skills + Harness Architecture Council + Phase 4 Config

## Session Summary

Session 7 completed three major work streams:
1. **Phase 3** of the behavioral upgrade — 3 workflow skills (git-workflow, project-scaffold, dev-orchestrator)
2. **Harness Architecture Council** — 4 specialist agents analyzed the Claude Code Agentic Harness Research document against OpenClaw's codebase, producing a prioritized roadmap
3. **Phase 4** — Config awakening: enabled sleeping harness features (dreaming, quality guard, identifier policy)
4. **Phase 5 design** — exec-security extension fully designed and spec-reviewed, ready for implementation

## What Was Done

### Phase 3: Workflow Skills (3 SKILL.md files)

| Skill | Path | Content |
|-------|------|---------|
| `git-workflow` | `~/.openclaw/workspace/skills/git-workflow/SKILL.md` | Feature branching, conventional commits (`type(scope): desc`), staged review (`git diff --staged`), merge cleanup. 8 hard safety rules (never force push, never commit to main, always status before staging). |
| `project-scaffold` | `~/.openclaw/workspace/skills/project-scaffold/SKILL.md` | Brief → clarify → plan file tree → approve → generate files → git init → install deps → verify build. Stack templates for Node/TS, Python, static HTML. YAGNI enforced. |
| `dev-orchestrator` | `~/.openclaw/workspace/skills/dev-orchestrator/SKILL.md` | Master-Clone delegation via `sessions_spawn`. Assessment gate (3+ independent sub-tasks, >5 tool calls each). Model routing (Sonnet for orchestrator, Qwen for clones). Context injection checklist. Push-based completion (no polling). 2x failure stop. |

AGENTS.md updated with cross-references to all 3 skills in Sub-agent Delegation, Workflow, and Operating Rules sections.

13 active skills total (10 existing + 3 new). Telegram registered 58 commands (up from 54).

### Harness Architecture Council

Analyzed the "Claude Code Agentic Harness Research" document (11 sections, ~300 lines covering the Claude Code source leak architecture). Four specialist agents ran in parallel:

1. **Harness Architect** — Analyzed core loop, tool categorization, orchestration patterns
2. **Security Engineer** — Analyzed bash security, write discipline, sandboxing
3. **Context & Cost Optimizer** — Analyzed caching, compaction, memory consolidation
4. **Integration Strategist** — Mapped implementation paths, feasibility, build order

**Key finding: OpenClaw is much further along than assumed.** Most Claude Code harness patterns already exist in core:

| Pattern | Status in OpenClaw |
|---------|-------------------|
| Tool mutation classification | `src/agents/tool-mutation.ts` — already classifies read vs write |
| Bash security | `src/infra/exec-approvals-analysis.ts` — ~1,000-line shell parser |
| Prompt cache boundary | `src/agents/system-prompt-cache-boundary.ts` — stable/volatile prefix split |
| Compaction | `src/agents/compaction.ts` — multi-mode with safeguard, quality guard |
| Memory dreaming | `extensions/memory-core/src/dreaming.ts` — 3-phase system, was DISABLED |
| Tool output truncation | `src/agents/pi-embedded-runner/tool-result-truncation.ts` — 40KB cap |
| Context pruning | Cache-TTL mode with configurable retention |
| MCP server | `extensions/acpx/` — already built |

### Phase 4: Config Awakening

Enabled the sleeping harness features via `~/.openclaw/openclaw.json`:

| Setting | Value | Impact |
|---------|-------|--------|
| `compaction.qualityGuard.enabled` | `true` | Rejects bad compaction summaries, retries once |
| `compaction.recentTurnsPreserve` | `3` | Last 3 turns kept verbatim through compaction |
| `compaction.identifierPolicy` | `"strict"` | File paths and identifiers preserved in summaries |
| `memory-core.config.dreaming.enabled` | `true` | Background memory consolidation (autoDream equivalent) |
| `memory-core.config.dreaming.frequency` | `"0 3 * * *"` | 3 AM BRT daily — light, REM, deep dreaming phases |

Note: `truncateAfterCompaction` was rejected by schema — not available in current OpenClaw version (2026.4.6).

### Phase 5: exec-security Extension Design

Fully designed and spec-reviewed. Design spec at `docs/superpowers/specs/2026-04-07-exec-security-design.md`.

Three modules:

**Module 1 — Protected Files** (`before_tool_call` on `write`/`edit`):
- Hardcoded protected paths: `.bashrc`, `.gitconfig`, `.ssh/*`, `.npmrc`, `.env*`, `openclaw.json`
- Suffix-based matching (works regardless of mount paths)
- Configurable `additionalProtectedPaths` array
- `apply_patch` excluded (no `file_path` param — would need patch parsing)

**Module 2 — Write Hardening** (`before_tool_call` on `write` + `after_tool_call`):
- File-size gating: blocks `write` on files >200 lines, instructs to use `edit`
- Write verification: `after_tool_call` checks file exists after write

**Module 3 — Exec Hardening** (`before_tool_call` on `exec` AND `bash`):
- Unicode zero-width stripping (same chars as core's `external-content.ts`)
- ANSI-C quoting detection (blocks any `$'...\...'` pattern)
- Protected file operand detection (scans command tokens against protected list)

Spec review found and fixed: `apply_patch` param mismatch, `bash` tool name coverage, single-handler architecture clarification, regex simplification, quote stripping for operand detection, `.env` files added to protected list.

## Issues Encountered & Resolved

1. **`truncateAfterCompaction` rejected by schema**: Not a valid config key in OpenClaw 2026.4.6. Removed from config. Logged as gotcha in CLAUDE.md.
2. **Memory-core dreaming gotcha was outdated**: Previous sessions recorded that dreaming config "rejects frequency/timezone properties." This was wrong — dreaming works via `plugins.entries.memory-core.config.dreaming` with `enabled` + `frequency`. Updated CLAUDE.md gotcha.
3. **Telegram command budget exceeded**: 58 commands now registered, exceeding the 5700-char payload budget. OpenClaw auto-shortens descriptions. Not a blocker.

## Current State

- **Gateway**: running, healthy, 8 plugins, 16.9s startup
- **Telegram**: connected, 58 commands visible
- **WhatsApp**: connected
- **Skills**: 13 active (brainstorm, plan, execute-plan, memory-mgmt, morning-briefing, research, schedule, skill-creator, tasks, wan, git-workflow, project-scaffold, dev-orchestrator)
- **Dreaming**: enabled, scheduled at 03:00 daily
- **Compaction**: safeguard mode with quality guard, strict identifier policy, 3 recent turns preserved
- **Context pruning**: cache-TTL mode, 5m TTL, keep last 5 assistant turns
- **Phases 1-4**: COMPLETE
- **Phase 5**: DESIGNED, spec reviewed, ready for implementation
- **Phase 6**: PLANNED (harness intelligence — side-effect guidance, Generator-Evaluator, topic routing)

## Files Modified This Session

### In Git Repository (`C:\Users\Nelson\Openclaw\`)
- `CLAUDE.md` — updated skills count (10→13), dreaming gotcha corrected, `truncateAfterCompaction` gotcha added
- `HANDOVER-SESSION7.md` — this file (new)
- `NEXT_SESSION_PROMPT_S7.md` — next session prompt (new)
- `docs/superpowers/specs/2026-04-07-exec-security-design.md` — Phase 5 design spec (new)

### In Workspace (`~/.openclaw/workspace/`)
- `skills/git-workflow/SKILL.md` — new
- `skills/project-scaffold/SKILL.md` — new
- `skills/dev-orchestrator/SKILL.md` — new
- `AGENTS.md` — added workflow skill cross-references (3 insertions)

### In Config (`~/.openclaw/openclaw.json`)
- Added `compaction.qualityGuard`, `recentTurnsPreserve`, `identifierPolicy`
- Added `plugins.entries.memory-core.config.dreaming`

### In Claude Memory (`~/.claude/projects/C--Users-Nelson-Openclaw/memory/`)
- `project_behavioral_upgrade.md` — updated Phase 3 to COMPLETE
- `project_harness_roadmap.md` — new (Phases 4-6 roadmap)
- `MEMORY.md` — added harness roadmap entry, updated behavioral upgrade entry

## Roadmap Ahead

### Phase 5: exec-security Extension (next session, 2-3 sessions)
- Build `extensions/exec-security/` following the approved design spec
- Zero external dependencies, same pattern as dev-tools
- Docker rebuild required (`docker build -t openclaw:local .`)
- pnpm lockfile update via Docker container
- Verification: gateway loads 9 plugins, all 7 test cases pass

### Phase 6: Harness Intelligence (2-3 sessions after Phase 5)
- Side-effect prompt guidance in dev-tools (teach model read-only vs write tool categories)
- Generator-Evaluator pattern added to dev-orchestrator skill
- Topic detection routing extension (`before_model_resolve` hook)

### Beyond Phase 6
- Jazz dashboard bespoke design (Canvas)
- Voice pipeline: local Whisper FastAPI server
- Upstream sync: `git fetch upstream && git rebase upstream/main`
