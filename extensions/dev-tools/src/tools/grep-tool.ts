import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { globMatch } from "../glob-match.js";

const ROOT = "/home/node/host/";
const MAX_OUTPUT_BYTES = 100 * 1024;
const DEFAULT_MAX_RESULTS = 250;

const GrepToolSchema = Type.Object(
  {
    pattern: Type.String({ description: "Regex pattern to search for in file contents." }),
    path: Type.Optional(
      Type.String({ description: "File or directory to search in. Defaults to the host filesystem root." }),
    ),
    glob: Type.Optional(
      Type.String({ description: "File filter pattern (e.g., *.ts, *.{ts,tsx})." }),
    ),
    output_mode: Type.Optional(
      Type.Unsafe<"files_with_matches" | "content" | "count">({
        type: "string",
        enum: ["files_with_matches", "content", "count"],
        description: 'Output mode: "files_with_matches" (default), "content", or "count".',
      }),
    ),
    context: Type.Optional(
      Type.Number({
        description: "Lines of context around matches (content mode only). Default: 0.",
        minimum: 0,
      }),
    ),
    max_results: Type.Optional(
      Type.Number({
        description: "Maximum results to return. Default: 250.",
        minimum: 1,
      }),
    ),
  },
  { additionalProperties: false },
);

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/**
 * Match a filename (just the basename or the full relative path) against a glob filter.
 * Supports both `*.ts` (basename match) and `src/**\/*.ts` (path match).
 */
function matchesFilter(relativePath: string, filter: string): boolean {
  // If the filter contains /, match against full path; otherwise match basename
  if (filter.includes("/")) {
    return globMatch(relativePath, filter);
  }
  const basename = path.basename(relativePath);
  return globMatch(basename, filter);
}

export function createGrepTool() {
  return {
    name: "grep",
    label: "Grep",
    description:
      "Search file contents by regex. Supports output modes: files_with_matches, content (with line numbers and context), count.",
    parameters: GrepToolSchema,
    execute: async (_toolCallId: string, rawParams: Record<string, unknown>) => {
      const patternStr = String(rawParams.pattern ?? "");
      if (!patternStr) {
        return textResult("Error: pattern is required.");
      }

      let regex: RegExp;
      try {
        regex = new RegExp(patternStr);
      } catch {
        return textResult(`Error: invalid regex pattern: ${patternStr}`);
      }

      const searchPath = rawParams.path ? String(rawParams.path) : ROOT;
      const resolved = path.resolve(searchPath);
      if (!resolved.startsWith(ROOT)) {
        return textResult(`Error: path must be within ${ROOT}. Got: ${resolved}`);
      }

      const globFilter = rawParams.glob ? String(rawParams.glob) : null;
      const outputMode = String(rawParams.output_mode ?? "files_with_matches");
      const contextLines = typeof rawParams.context === "number" ? Math.floor(rawParams.context) : 0;
      const maxResults = typeof rawParams.max_results === "number" ? Math.floor(rawParams.max_results) : DEFAULT_MAX_RESULTS;

      try {
        let filePaths: string[];
        const stat = await fs.stat(resolved).catch(() => null);

        if (stat?.isFile()) {
          filePaths = [resolved];
        } else {
          const entries = await fs.readdir(resolved, { recursive: true });
          filePaths = [];
          for (const entry of entries) {
            const rel = (typeof entry === "string" ? entry : entry.toString()).replace(/\\/g, "/");
            if (globFilter && !matchesFilter(rel, globFilter)) continue;
            const fullPath = path.join(resolved, rel);
            try {
              const s = await fs.stat(fullPath);
              if (s.isFile()) filePaths.push(fullPath);
            } catch {
              continue;
            }
          }
        }

        const results: string[] = [];
        let totalOutput = 0;
        let matchedFiles = 0;
        let truncated = false;

        for (const filePath of filePaths) {
          if (matchedFiles >= maxResults) break;
          if (totalOutput >= MAX_OUTPUT_BYTES) {
            truncated = true;
            break;
          }

          let content: string;
          try {
            content = await fs.readFile(filePath, "utf-8");
          } catch {
            continue;
          }

          if (content.slice(0, 8192).includes("\0")) continue;

          const lines = content.split("\n");
          const relativePath = stat?.isFile()
            ? path.basename(filePath)
            : path.relative(resolved, filePath).replace(/\\/g, "/");

          if (outputMode === "files_with_matches") {
            if (lines.some((line) => regex.test(line))) {
              results.push(relativePath);
              totalOutput += relativePath.length + 1;
              matchedFiles++;
            }
          } else if (outputMode === "count") {
            let count = 0;
            for (const line of lines) {
              if (regex.test(line)) count++;
            }
            if (count > 0) {
              const entry = `${relativePath}:${count}`;
              results.push(entry);
              totalOutput += entry.length + 1;
              matchedFiles++;
            }
          } else {
            // content mode
            const matchingLineNums = new Set<number>();
            for (let i = 0; i < lines.length; i++) {
              if (regex.test(lines[i])) matchingLineNums.add(i);
            }

            if (matchingLineNums.size === 0) continue;
            matchedFiles++;

            const visibleLines = new Set<number>();
            for (const lineNum of matchingLineNums) {
              for (let c = Math.max(0, lineNum - contextLines); c <= Math.min(lines.length - 1, lineNum + contextLines); c++) {
                visibleLines.add(c);
              }
            }

            const sorted = [...visibleLines].sort((a, b) => a - b);
            let lastLine = -2;
            for (const lineNum of sorted) {
              if (totalOutput >= MAX_OUTPUT_BYTES) {
                truncated = true;
                break;
              }
              if (lineNum > lastLine + 1 && lastLine >= 0) {
                results.push("--");
                totalOutput += 3;
              }
              const entry = `${relativePath}:${lineNum + 1}:${lines[lineNum]}`;
              results.push(entry);
              totalOutput += entry.length + 1;
              lastLine = lineNum;
            }
          }
        }

        if (results.length === 0) {
          return textResult(`No matches found for pattern: ${patternStr}`);
        }

        const suffix = truncated ? "\n\n(output truncated — refine pattern or use glob filter)" : "";
        const header = outputMode === "files_with_matches"
          ? `Found ${matchedFiles} file${matchedFiles === 1 ? "" : "s"}`
          : outputMode === "count"
            ? `Match counts (${matchedFiles} file${matchedFiles === 1 ? "" : "s"}):`
            : `Matches (${matchedFiles} file${matchedFiles === 1 ? "" : "s"}):`;

        return textResult(`${header}\n${results.join("\n")}${suffix}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return textResult(`Error: ${msg}`);
      }
    },
  };
}
