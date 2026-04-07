import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { globMatch } from "../glob-match.js";

const ROOT = "/home/node/host/";
const MAX_RESULTS = 500;

const GlobToolSchema = Type.Object(
  {
    pattern: Type.String({ description: "Glob pattern to match files (e.g., **/*.ts, src/**/*.json)." }),
    path: Type.Optional(
      Type.String({ description: "Directory to search in. Defaults to the host filesystem root." }),
    ),
  },
  { additionalProperties: false },
);

export function createGlobTool() {
  return {
    name: "glob",
    label: "Glob",
    description:
      "Fast file pattern matching. Returns matching file paths sorted by modification time (most recent first).",
    parameters: GlobToolSchema,
    execute: async (_toolCallId: string, rawParams: Record<string, unknown>) => {
      const pattern = String(rawParams.pattern ?? "");
      if (!pattern) {
        return { content: [{ type: "text" as const, text: "Error: pattern is required." }] };
      }

      const cwd = rawParams.path ? String(rawParams.path) : ROOT;
      const resolved = path.resolve(cwd);
      if (!resolved.startsWith(ROOT)) {
        return {
          content: [
            { type: "text" as const, text: `Error: path must be within ${ROOT}. Got: ${resolved}` },
          ],
        };
      }

      try {
        const allFiles = await fs.readdir(resolved, { recursive: true });
        const matched: Array<{ rel: string; mtimeMs: number }> = [];

        for (const entry of allFiles) {
          const rel = (typeof entry === "string" ? entry : entry.toString()).replace(/\\/g, "/");
          if (!globMatch(rel, pattern)) continue;

          const fullPath = path.join(resolved, rel);
          try {
            const stat = await fs.stat(fullPath);
            if (!stat.isFile()) continue;
            matched.push({ rel, mtimeMs: stat.mtimeMs });
          } catch {
            continue;
          }
        }

        matched.sort((a, b) => b.mtimeMs - a.mtimeMs);
        const limited = matched.slice(0, MAX_RESULTS);

        const header = `Found ${matched.length} file${matched.length === 1 ? "" : "s"} matching ${pattern}${matched.length > MAX_RESULTS ? ` (showing first ${MAX_RESULTS})` : ""}:`;
        const text = limited.length > 0
          ? `${header}\n${limited.map((e) => e.rel).join("\n")}`
          : `No files found matching ${pattern}`;

        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }] };
      }
    },
  };
}
