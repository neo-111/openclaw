# Session 10 — Canvas Dashboard Creative Direction

## Who You Are
You are assisting Nelson Porto, a creative director and designer in Rio de Janeiro, with designing the Canvas dashboard for his OpenClaw agent "Jaz." Read `~/.claude/CLAUDE.md` and `~/.claude/user-profile.md` for full context.

## What Happened (Sessions 5-9)

**Sessions 5-8** built the OpenClaw harness upgrade: behavioral architecture, dev-tools extension, workflow skills, config awakening, exec-security extension, harness intelligence.

**Session 9** deployed everything. Gateway runs with 9 plugins, 4 hook handlers, 13 active skills. The infrastructure is solid. Now it's time for the creative layer.

## What To Do Now — Design Jaz's Dashboard

### The Canvas
Canvas is Jaz's visual workspace at `http://localhost:18789/__openclaw__/canvas/`. It serves static HTML/CSS/JS from `/home/node/.openclaw/canvas/`. Currently just a spinning color wheel test page.

Jaz's `canvas` tool can: `present` (show HTML), `navigate`, `eval` (run JS), `snapshot` (screenshot), `a2ui_push` (interactive data push), `hide`, `a2ui_reset`.

### The Task
Design a bespoke dashboard that is the visual face of Jaz — not a generic admin panel.

### Process
1. **Invoke `creative-council` skill** — this is premium visual work
2. Deploy 3-4 research agents to explore: dashboard design precedents, agent interface paradigms, data visualization art, Brazilian/cultural design references
3. Synthesize into 2-3 named compositions, each with:
   - Name, mood, emotional register
   - Color palette with cultural context
   - Typography choices with rationale
   - Layout concept and hierarchy
   - Specific design references and precedents
4. Present to Nelson — he picks the direction
5. Build with full context

### What Nelson Values
- Bespoke, AAA-quality — if it looks like AI generated it, it failed
- Visual hierarchy, typography, personality, rhythm, spacing
- Named compositions with cultural and artistic references
- No generic AI aesthetics (flat solid sections, centered text, card soup)
- Brazilian design DNA when appropriate (Athos Bulcao, Burle Marx, concrete art)
- Push the concept — no safe, expected compositions

### Important Rules
- Paste `~/.claude/CREATIVE-DIRECTOR.md` and `~/.claude/user-profile.md` into every creative agent prompt
- If the project has `.claude/AGENT-CONTEXT.md`, paste that too
- Always Opus for creative agents — never sonnet or haiku
- Present options, then WAIT for Nelson's choice. Do not pick for him.
- Use the `creative-council` skill — it carries the full process

### Technical Constraints
- Static HTML/CSS/JS only (no server-side rendering)
- External libraries via CDN (D3, Three.js, Chart.js, GSAP, etc.)
- Live data via `canvas.eval` (Jaz periodically pushes updates) or A2UI JSONL
- Canvas root: `~/.openclaw/canvas/` on host → `/home/node/.openclaw/canvas/` in container
- Live reload active (75ms debounce)

### Possible Modules (for council to consider, not prescriptive)
- Agent identity/status
- Conversation stream or summary
- Cron job status
- Image gallery (ComfyUI outputs)
- Memory/knowledge visualization
- Quick actions
- Cost/usage metrics
- Channel health

### Key References
- Canvas tool source: `src/agents/tools/canvas-tool.ts`
- A2UI: agent-to-UI interactive protocol (JSONL push, user events flow back)
- Community dashboards: mudrii (ops), ClawUI (glass morphism/3D), tugcantopaloglu (security)
- R&D report: `~/.claude/projects/C--Users-Nelson-Openclaw/memory/reference_rd_report.md`
- Dashboard memory: `~/.claude/projects/C--Users-Nelson-Openclaw/memory/project_jazz_dashboard.md`
