# Session 8 — OpenClaw Upgrade: Phase 5 (exec-security Extension)

## Who You Are
You are assisting Nelson Porto, a creative director and designer in Rio de Janeiro, with upgrading his OpenClaw agent "Jaz." Read `~/.claude/CLAUDE.md` and `~/.claude/user-profile.md` for full context.

## What Happened (Sessions 5-7)
We are executing a multi-phase upgrade to bring Jaz to Claude Code-level harness capabilities.

**Phase 1 (Session 5) — Behavioral Architecture: COMPLETE**
- Rewrote SOUL.md (Output Discipline: Chat/Project modes)
- Rewrote AGENTS.md (Operating Rules, Tool Policy, Plan>Act>Verify, Context Budget)
- Config tuned: compaction, tools.deny

**Phase 2 (Session 6) — Dev-Tools Extension: COMPLETE**
- Built `extensions/dev-tools/` — glob, grep tools + read-before-edit hook + prompt guidance
- Zero external dependencies, custom glob matcher
- Gateway: 8 plugins

**Phase 3 (Session 7) — Workflow Skills: COMPLETE**
- `git-workflow/SKILL.md` — branching, conventional commits, 8 safety rules
- `project-scaffold/SKILL.md` — brief → approve → generate → verify
- `dev-orchestrator/SKILL.md` — Master-Clone via sessions_spawn, model routing
- AGENTS.md updated with cross-references
- 13 active skills, 58 Telegram commands

**Phase 4 (Session 7) — Config Awakening: COMPLETE**
- Enabled memory-core dreaming (3 AM daily, 3-phase consolidation)
- Enabled compaction quality guard with retry
- Set identifier policy to strict, recent turns preserve to 3
- Note: `truncateAfterCompaction` not valid in current schema

**Harness Architecture Council (Session 7):**
4 specialist agents analyzed the Claude Code Agentic Harness Research document. Key finding: OpenClaw already has most Claude Code patterns in core — they were disabled or unconfigured. Produced a prioritized roadmap (Phases 4-6).

## What To Do Now — Phase 5: exec-security Extension

**Design spec:** `docs/superpowers/specs/2026-04-07-exec-security-design.md` (reviewed and approved)

Build `extensions/exec-security/` with three modules:

### File Structure
```
extensions/exec-security/
  openclaw.plugin.json          # manifest, enabledByDefault: true, configSchema
  package.json                  # zero deps, workspace-hoisted @sinclair/typebox
  api.ts                        # re-export from openclaw/plugin-sdk/plugin-entry
  index.ts                      # register hooks + prompt guidance
  src/
    protected-files.ts          # blocks writes to sensitive paths
    write-hardening.ts          # file-size gate + write verify
    exec-hardening.ts           # Unicode strip + ANSI-C detect + operand check
    constants.ts                # shared protected paths list, patterns
```

### Module 1: Protected Files (`protected-files.ts`)
- Hook: `before_tool_call` on `write`, `edit`
- Resolves `file_path` to absolute path
- Checks against hardcoded suffix list + configurable extras
- Protected: `.bashrc`, `.bash_profile`, `.profile`, `.zshrc`, `.zprofile`, `.zshenv`, `.gitconfig`, `.git/config`, `.ssh/config`, `.ssh/authorized_keys`, `.ssh/id_rsa`, `.ssh/id_ed25519`, `.npmrc`, `.yarnrc.yml`, `.pnpmrc`, `.env`, `.env.keys`, `.env.local`, `.env.production`, `openclaw.json`
- Blocks with: `{ block: true, blockReason: "..." }`
- `apply_patch` excluded (no `file_path` param)

### Module 2: Write Hardening (`write-hardening.ts`)
- `before_tool_call` on `write`: if file exists and >200 lines, block (force edit)
- `after_tool_call` on `write`: verify file exists post-write (catches silent failures)
- New file creation always allowed
- Config: `maxWriteLines: number` (default 200)

### Module 3: Exec Hardening (`exec-hardening.ts`)
- Hook: `before_tool_call` on `exec` AND `bash` (some providers emit `bash`)
- Single handler, three sequential checks:
  - A. Unicode zero-width strip: `\u200B`, `\u200C`, `\u200D`, `\u2060`, `\uFEFF`, `\u00AD`. Strip + log + pass cleaned command via `{ params: { command: cleaned } }`
  - B. ANSI-C quoting: regex `/\$'[^']*\\[^']*'/` — block any `$'...\...'`
  - C. Protected file operands: tokenize by whitespace, strip quotes, suffix-match against protected list

### Prompt Guidance
Via `before_prompt_build` → `{ prependSystemContext: "..." }`:
```
Security enforcement active:
- Protected files (.bashrc, .gitconfig, .ssh/*, .npmrc, .env*, openclaw.json) cannot be modified
- Files over 200 lines cannot be overwritten with write — use edit for targeted changes
- Exec commands are sanitized for Unicode injection and ANSI-C escape obfuscation
```

### configSchema
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "maxWriteLines": { "type": "number", "default": 200 },
    "additionalProtectedPaths": { "type": "array", "items": { "type": "string" }, "default": [] }
  }
}
```

## Build & Deploy Steps
1. Create extension files (all 8 files above)
2. Update pnpm lockfile: `docker run --rm -v "C:\Users\Nelson\Openclaw:/app" -w /app node:24-bookworm pnpm install --no-frozen-lockfile`
3. Docker rebuild: `docker build -t openclaw:local . --progress=plain 2>&1`
4. Config: add `plugins.entries.exec-security.enabled: true` to `~/.openclaw/openclaw.json`
5. Recreate: `docker compose up -d --force-recreate openclaw-gateway`
6. Verify: gateway logs show "ready (9 plugins, ...)"

## Verification Tests
1. Attempt `write` to `.bashrc` via Telegram → blocked
2. Attempt `write` to a 300-line file → blocked, suggests edit
3. Exec command with zero-width chars → stripped and logged
4. Exec with `$'\x72\x6d'` → blocked
5. Exec referencing `.ssh/config` → blocked
6. Normal write/edit/exec → unaffected
7. New file creation → unaffected

## Key References
- Design spec: `docs/superpowers/specs/2026-04-07-exec-security-design.md`
- Reference extension: `extensions/dev-tools/` (follow this pattern exactly)
- Reference hook: `extensions/dev-tools/src/hooks/read-before-edit.ts`
- Hook types: `src/plugins/types.ts` (search `PluginHookBeforeToolCallResult`)
- Tool mutation: `src/agents/tool-mutation.ts`
- Unicode constants: `src/security/external-content.ts`
- Memory: `~/.claude/projects/C--Users-Nelson-Openclaw/memory/project_harness_roadmap.md`
- Harness research: `C:\Users\Nelson\Desktop\OPenclaw\Claude Code Agentic Harness Research.md`

## After Phase 5
Phase 6 (Harness Intelligence):
- Side-effect prompt guidance in dev-tools extension
- Generator-Evaluator pattern in dev-orchestrator skill
- Topic detection routing extension (before_model_resolve hook)
