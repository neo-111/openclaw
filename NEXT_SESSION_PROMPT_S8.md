# Session 9 — Deploy exec-security + Verify

## Who You Are
You are assisting Nelson Porto, a creative director and designer in Rio de Janeiro, with upgrading his OpenClaw agent "Jaz." Read `~/.claude/CLAUDE.md` and `~/.claude/user-profile.md` for full context.

## What Happened (Sessions 5-8)

**Phase 1 (Session 5) — Behavioral Architecture: COMPLETE**
- Rewrote SOUL.md, AGENTS.md, config tuning

**Phase 2 (Session 6) — Dev-Tools Extension: COMPLETE**
- `extensions/dev-tools/` — glob, grep, read-before-edit hook

**Phase 3 (Session 7) — Workflow Skills: COMPLETE**
- git-workflow, project-scaffold, dev-orchestrator. 13 active skills.

**Phase 4 (Session 7) — Config Awakening: COMPLETE**
- Dreaming, quality guard, identifier policy enabled.

**Phase 5 (Session 8) — exec-security Extension: BUILT, DEPLOY PENDING**
- `extensions/exec-security/` — 8 files, 426 lines, hooks-only
- 3 modules: protected files, write hardening, exec hardening
- Code-reviewed (4 fixes), oxlint clean (11 fixes)
- Commits on branch `claude/amazing-spence`: `97285361`, `d9d20030`

**Phase 6 (Session 8) — Harness Intelligence: 2/3 COMPLETE**
- Item 1: Side-effect prompt guidance in dev-tools
- Item 2: Generator-Evaluator pattern in dev-orchestrator skill
- Item 3: Topic routing deferred (needs usage data)

## What To Do Now — Deploy & Verify

### Step 1: Merge the branch
```bash
git checkout main
git merge claude/amazing-spence
```

### Step 2: Update lockfile
```bash
docker run --rm -v "C:\Users\Nelson\Openclaw:/app" -w /app node:24-bookworm pnpm install --no-frozen-lockfile
```

### Step 3: Docker rebuild
```bash
docker build -t openclaw:local . --progress=plain 2>&1
```

### Step 4: Config update
Add to `~/.openclaw/openclaw.json`:
```json
{
  "plugins": {
    "entries": {
      "exec-security": {
        "enabled": true
      }
    }
  }
}
```

### Step 5: Recreate container
```bash
docker compose up -d --force-recreate openclaw-gateway
```

### Step 6: Verify
Check gateway logs for "ready (9 plugins)". Then run all 9 verification tests:
1. Write to `.bashrc` → blocked
2. Edit `.ssh/config` → blocked
3. Write 300-line file → blocked
4. Write new file → allowed
5. Exec with zero-width chars → stripped
6. Exec with `$'\x72\x6d'` → blocked
7. Exec `cat ~/.ssh/config` → blocked
8. Normal operations → unaffected
9. Plugin count → 9

## After Deploy

### Phase 6 Completion (if Docker available)
- Analyze Jaz's logs for usage patterns
- Decide whether topic routing extension is worth building
- If yes: build `extensions/topic-routing/` (6 files, opt-in, disabled by default)

### Creative Work (if Nelson directs)
- Canvas dashboard bespoke design session
- Multi-agent architecture planning

### Integration
- Composio MCP (Gmail, Calendar, Drive)

## Key References
- Extension: `extensions/exec-security/` (8 files)
- Dev-tools guidance: `extensions/dev-tools/src/prompt-guidance.ts`
- Skill: `~/.openclaw/workspace/skills/dev-orchestrator/SKILL.md`
- Memory: `~/.claude/projects/C--Users-Nelson-Openclaw/memory/project_harness_roadmap.md`
- Topic routing design: `~/.claude/projects/C--Users-Nelson-Openclaw/memory/project_topic_routing_design.md`
