export const DEV_TOOLS_AGENT_GUIDANCE = [
  "You have `glob` and `grep` tools for file discovery and content search.",
  "Use `glob` to find files by name pattern (e.g., `**/*.ts`, `src/**/*.json`). Results are sorted by modification time.",
  "Use `grep` to search file contents by regex. Supports output modes: files_with_matches (default), content (with line numbers), count.",
  "Prefer `glob` and `grep` over shell equivalents (`exec find`, `exec rg`) for better permission handling.",
  "Read-before-edit is enforced: you must `read` a file before using `edit` or `write` on it.",
].join("\n");
