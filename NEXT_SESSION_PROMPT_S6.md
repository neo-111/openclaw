# Session 7 — OpenClaw Upgrade: Phase 3 (Workflow Skills)

## Who You Are
You are assisting Nelson Porto, a creative director and designer in Rio de Janeiro, with upgrading his OpenClaw agent "Jaz." Read `~/.claude/CLAUDE.md` and `~/.claude/user-profile.md` for full context.

## What Happened (Sessions 5-6)
We are executing a 3-phase upgrade to bring Jaz to Claude Code-level capabilities, based on a research document (`claude-code-build-spec.md`). Core thesis: "The model is not the product — the harness is."

**Phase 1 (Session 5) — Behavioral Architecture: COMPLETE**
- Rewrote `~/.openclaw/workspace/SOUL.md` (Output Discipline: Chat/Project modes)
- Rewrote `~/.openclaw/workspace/AGENTS.md` (Operating Rules, Tool Policy, Plan>Act>Verify, Context Budget)
- Trimmed `~/.openclaw/workspace/TOOLS.md`, deleted BOOTSTRAP.md + IDENTITY.md
- Config tuned: compaction, postCompactionSections, tools.deny
- Archived comfyui-skill-openclaw

**Phase 2 (Session 6) — Dev-Tools Extension: COMPLETE**
- Built `extensions/dev-tools/` TypeScript extension — 2 tools + 1 hook + prompt guidance
- `glob` tool: file pattern matching, mtime sorted, 500 result cap, path containment to `/home/node/host/`
- `grep` tool: regex content search, 3 output modes (files_with_matches/content/count), 100KB cap
- `read-before-edit` hook: blocks edit/write on files not previously read in the session
- Prompt guidance: injected via `before_prompt_build` hook
- Zero external dependencies — custom glob matcher, Node built-in `fs.readdir({recursive:true})`
- Gateway running with 8 plugins (was 7), dev-tools loaded successfully
- AGENTS.md Tool Policy updated to reference glob/grep

**Gotchas discovered:**
- `openclaw.plugin.json` MUST have `configSchema` — enforced at `src/plugins/manifest.ts:486`, no exceptions
- `channels.telegram.commands.ownerAllowFrom` no longer valid in current schema — removed
- Docker buildx buffers all output until completion — use `--progress=plain` and redirect stderr for visibility
- pnpm `node-linker=hoisted` — workspace packages share flat node_modules

## What To Do Now — Phase 3: Workflow Skills

Create 3 skill files (markdown only, no code):

### 1. `~/.openclaw/workspace/skills/git-workflow/SKILL.md`
Using `exec`, not new tools:
- Feature branch pattern: `exec("git checkout -b feature/...")`, work, commit, push
- Commit conventions: `type(scope): description`
- When to commit: after each logical unit, after verify passes, before switching areas
- Safety: never force push, never commit to main directly, always check status first

### 2. `~/.openclaw/workspace/skills/project-scaffold/SKILL.md`
Using `exec` + `write`:
- Accept a project brief
- Generate directory structure and files via write tool
- Initialize with appropriate config (package.json, tsconfig, etc.)
- Run initial install and build via exec

### 3. `~/.openclaw/workspace/skills/dev-orchestrator/SKILL.md`
Master-Clone pattern, NOT specialist roles:
- Decompose task into independent sub-tasks
- Spawn clones via `sessions_spawn` — same instructions, fresh context, focused task
- Each clone gets: same system prompt, same tools (minus orchestration tools), focused task description
- Collect results, verify, report to user
- Model routing: main session uses Sonnet for planning, clones use local Qwen for execution

## Key References
- Plan file: `~/.claude/plans/lovely-waddling-riddle.md` (full 3-phase plan with verification steps)
- Memory: `~/.claude/projects/C--Users-Nelson-Openclaw/memory/project_behavioral_upgrade.md`
- Build spec research: `C:\Users\Nelson\Desktop\OPenclaw\claude-code-build-spec.md` (Section 7: subagents, Section 14: build order)
- Extension pattern reference: `extensions/dev-tools/` (just built), `extensions/diffs/` (upstream reference)
- Existing skills for format reference: `~/.openclaw/workspace/skills/wan/SKILL.md`

## Verification After Phase 3
- Test `/git-workflow` via Telegram: create a feature branch, make changes, commit
- Test `/project-scaffold`: scaffold a simple project, verify structure
- Test `/dev-orchestrator`: give a multi-file task, verify clone spawning and result collection
