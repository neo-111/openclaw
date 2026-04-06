# OpenClaw — Project Instructions

## Repository
Fork of `openclaw/openclaw` at `neo-111/openclaw`. Upstream tracked via `upstream` remote.

## Local Deployment
- **Docker Compose**: `docker-compose.yml` in project root
- **Config**: `~/.openclaw/openclaw.json`
- **Workspace**: `~/.openclaw/workspace/` (SOUL.md, AGENTS.md, USER.md, HEARTBEAT.md, skills/)
- **Skills**: `~/.openclaw/workspace/skills/` (60 custom skills translated from Claude Code)
- **API Keys**: `.env.keys` (gitignored — NEVER commit)
- **Gateway**: http://localhost:18789 (Control UI)
- **Host filesystem**: Mounted at `/home/node/host/` inside container

## Agent Identity
- **Name**: Jazz
- **Primary model**: `ollama/qwen3.5:35b` (local, free)
- **Fallback chain**: gemma4 → mistral-small3.2 → devstral (all local)
- **Cloud on demand**: `/model opus`, `/model sonnet` (never auto-fallback)
- **Image generation**: `google/gemini-3.1-flash-image-preview`

## Key Config Gotchas
- `gateway.bind`: "auto"|"lan"|"loopback"|"custom"|"tailnet" — NOT raw IPs
- `session.reset`: uses `mode` + `atHour` — NOT `daily` + `dailyTime`
- `groupPolicy`: "open"|"disabled"|"allowlist" — NOT "denylist"
- `memory-core` dreaming config: schema rejects frequency/timezone properties
- `imageGenerationModel` vs `imageModel`: different models, different purposes
- DeepSeek R1: does NOT support tool calling — cannot be in fallback chain
- Volume changes need `docker compose up -d --force-recreate`, not just restart

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

# Pull upstream updates
git fetch upstream && git rebase upstream/main
```

## Security
- WhatsApp: allowlist mode, only Nelson's number
- Gateway: loopback binding, device auth disabled for localhost convenience
- Gateway token: pinned in .env.keys for browser persistence
- Tools: full profile, elevated enabled — safe because access is locked down
- Skills: only workspace skills + bundled. Audit before installing from ClawHub.
