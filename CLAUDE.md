# OpenClaw — Project Instructions

## Repository
Fork of `openclaw/openclaw` at `neo-111/openclaw`. Upstream tracked via `upstream` remote.

## Local Deployment
- **Docker Compose**: `docker-compose.yml` in project root
- **Config**: `~/.openclaw/openclaw.json`
- **Workspace**: `~/.openclaw/workspace/` (SOUL.md, AGENTS.md, USER.md, HEARTBEAT.md, skills/)
- **Skills**: `~/.openclaw/workspace/skills/` (11 active — 50+ archived in `skills-archive/`)
- **API Keys**: `.env.keys` (gitignored — NEVER commit)
- **Gateway**: http://localhost:18789 (Control UI)
- **Canvas**: http://localhost:18789/__openclaw__/canvas/ (agent-driven visual workspace)
- **Host filesystem**: Mounted at `/home/node/host/` inside container
- **Workspace git**: `~/.openclaw/workspace/.git` (local version control, nightly auto-commit at 23:00 BRT)

## Agent Identity
- **Name**: Jaz
- **Gender**: Female, Black
- **Primary model**: `anthropic/claude-sonnet-4-6` (cloud primary for critical work; local Qwen3.5-27B confirmed best for sequential tool chains)
- **Fallback chain**: ollama/qwen3.5:27b → ollama/glm-4.7-flash → ollama/qwen3.5:35b → ollama/devstral
- **Best local model**: Qwen3.5-27B (dense, 262K context, 15/15 on sequential tool chaining benchmarks)
- **Aliases**: `/model coding` (qwen3.5:27b), `/model fast` (qwen3.5:35b MoE), `/model fast-agent` (glm-4.7-flash), `/model power` (llama3.3:70b), `/model sonnet`, `/model opus`
- **Image generation**: ComfyUI via `/wan` skill (WAN 2.2 T2I Advanced dual-pass workflow) — fallback: `google/gemini-3.1-flash-image-preview`
- **ComfyUI**: `http://host.docker.internal:8000` — WAN 2.2 T2I Advanced dual-pass workflow (20 steps, dpmpp_2m, 1920x1280, FusionX + FaceNaturalizer LoRAs, film grain). Reference at `workspace/comfyui-workflows/wan22-t2i-reference.json`. Skill: `/wan`
- **Audio transcription**: Gemini (built-in provider, uses existing Google API key)

## Channels
- **Telegram**: Primary mobile channel (`@jazz_regen_bot` or similar). Zero ban risk. Proactive messaging supported.
- **WhatsApp**: Secondary (allowlist: Nelson's number only). Ban risk with Baileys — monitor.
- **Canvas**: Agent-driven visual workspace. Jaz pushes HTML via `canvas.present` tool. Live reload enabled.

## Cron Jobs
- **morning-briefing**: Daily at 08:00 BRT. Weather, news, tasks. Delivered to Telegram. Isolated session, local model.
- **workspace-backup**: Daily at 23:00 BRT. Auto-commits workspace changes to git. Isolated session, no delivery.

## Skills
- `/wan`: ComfyUI image generation — WAN 2.2 T2I Advanced dual-pass workflow. Takes a prompt, generates 1920x1280 image, delivers to Telegram.
- 11 active skills total (10 from session 2 + /wan)

## Key Config Gotchas
- `gateway.bind`: "auto"|"lan"|"loopback"|"custom"|"tailnet" — NOT raw IPs
- `session.reset`: uses `mode` + `atHour` — NOT `daily` + `dailyTime`
- `groupPolicy`: "open"|"disabled"|"allowlist" — NOT "denylist"
- `memory-core` dreaming config: schema rejects frequency/timezone properties
- `imageGenerationModel` vs `imageModel`: different models, different purposes
- DeepSeek R1: does NOT support tool calling — cannot be in fallback chain
- Volume changes need `docker compose up -d --force-recreate`, not just restart
- `tools.approval`: NOT a valid config key — approval gates managed via AGENTS.md behavioral rules
- Canvas serves from gateway subpath `/__openclaw__/canvas/`, NOT a separate port
- Telegram plugin needs both `plugins.entries.telegram` AND `plugins.load.paths` with `/app/extensions/telegram`
- `tools.elevated.allowFrom`: Required for Telegram/WhatsApp to use elevated shell commands. Format: `{"telegram": ["user_id"], "whatsapp": ["phone"]}`
- `comfy plugin config`: Cannot go in `plugins.entries.comfy.config` — schema merges it into `models.providers.comfy` which uses `.strict()` and rejects custom keys. Known architectural gap. Use shell/curl via `/wan` skill instead.
- `ModelProviderSchema`: Uses `.strict()` in `src/config/zod-schema.core.ts` — no custom provider keys allowed under `models.providers`
- Ollama model swapping: Only one model loaded at a time. `/model` switch causes cascade timeouts. Preload with keep_alive after switching.
- `comfy` extension: Bundled at `/app/dist/extensions/comfy/`, loads automatically (`enabledByDefault: true`). Do NOT add to `plugins.load.paths`.
- `OpenClaw num_ctx injection`: OpenClaw sends `contextWindow` as `num_ctx` to Ollama automatically (`extensions/ollama/src/stream.ts:610`). Models MUST have explicit entries in `models.providers.ollama.models[]` with correct `contextWindow`.
- `Ollama context_length`: Check a model's actual trained context with `curl http://localhost:11434/api/show -d '{"name":"model"}'` and look at `*.context_length` in `model_info`.
- `OLLAMA_FLASH_ATTENTION`: Set to `1` as user env var on Windows for ~50% KV cache VRAM reduction. Requires Ollama restart.

## Operations
```bash
# Restart after config changes
docker restart openclaw-openclaw-gateway-1

# Recreate after volume/compose changes
docker compose up -d --force-recreate openclaw-gateway

# Check logs
docker logs openclaw-openclaw-gateway-1 --tail 30

# Get gateway token
docker exec openclaw-openclaw-gateway-1 sh -c 'echo $OPENCLAW_GATEWAY_TOKEN'

# List cron jobs
docker exec openclaw-openclaw-gateway-1 sh -c 'node dist/index.js cron list'

# List channels
docker exec openclaw-openclaw-gateway-1 sh -c 'node dist/index.js channels list'

# Pull upstream updates
git fetch upstream && git rebase upstream/main
```

## Security
- Telegram: DM allowlist (Nelson's user ID: 8651876963)
- WhatsApp: allowlist mode, only Nelson's number
- Gateway: loopback binding, device auth disabled for localhost convenience
- Gateway token: pinned in .env.keys for browser persistence
- Tools: full profile, elevated enabled — safe because access is locked down
- `tools.elevated.allowFrom`: telegram and whatsapp configured for Nelson only
- Skills: only workspace skills + bundled. Audit before installing from ClawHub.
- AGENTS.md: Security policy section with skill audit, action gates, credential rules
- HEARTBEAT.md: Weekly security check (Mondays)
- Workspace: git-backed for audit trail and rollback

## Voice (Local STT)
- `faster-whisper` installed on host with CUDA (2x RTX 4090 detected)
- Transcription script: `~/.openclaw/scripts/whisper-transcribe.py`
- Currently NOT wired to Docker container (needs local Whisper HTTP server or use Gemini)
- Gemini handles audio transcription via built-in provider (Google API key)
- Future: local Whisper FastAPI server on host, container calls via HTTP
