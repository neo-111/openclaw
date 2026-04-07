export const DEV_TOOLS_AGENT_GUIDANCE = [
  "You have `glob` and `grep` tools for file discovery and content search.",
  "Use `glob` to find files by name pattern (e.g., `**/*.ts`, `src/**/*.json`). Results are sorted by modification time.",
  "Use `grep` to search file contents by regex. Supports output modes: files_with_matches (default), content (with line numbers), count.",
  "Prefer `glob` and `grep` over shell equivalents (`exec find`, `exec rg`) for better permission handling.",
  "Read-before-edit is enforced: you must `read` a file before using `edit` or `write` on it.",
  "",
  "Tool side-effect categories:",
  "- Read-only (safe to request in parallel): glob, grep, read, sessions_list, sessions_history",
  "- Mutating (serialize — one at a time, wait for result): write, edit, apply_patch, exec, bash, message, sessions_send, cron, gateway, canvas",
  "Rule: When using multiple read-only tools, request them all at once. When using any mutating tool, wait for its result before requesting the next tool.",
].join("\n");
