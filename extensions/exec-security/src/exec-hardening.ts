import {
  PROTECTED_SUFFIXES,
  ANSI_C_QUOTE_RE,
  isProtectedPath,
} from "./constants.js";

type BeforeToolCallEvent = {
  toolName: string;
  params: Record<string, unknown>;
  runId?: string;
  toolCallId?: string;
};

type ToolContext = {
  agentId?: string;
  sessionKey?: string;
  sessionId?: string;
  runId?: string;
  toolName: string;
  toolCallId?: string;
};

type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
};

/**
 * Simple command tokenizer that handles single and double quotes.
 * NOT a full shell parser — intentionally conservative (false positives OK).
 */
function tokenizeCommand(cmd: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (
      (ch === " " || ch === "\t" || ch === "|" || ch === ";" || ch === "&" || ch === "`" || ch === "(" || ch === ")") &&
      !inSingle &&
      !inDouble
    ) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current) { tokens.push(current); }
  return tokens;
}

export function createExecHardeningHook(additionalPaths: string[]) {
  const allSuffixes = [...PROTECTED_SUFFIXES, ...additionalPaths];

  async function beforeToolCall(
    event: BeforeToolCallEvent,
    _ctx: ToolContext,
  ): Promise<BeforeToolCallResult | void> {
    if (event.toolName !== "exec" && event.toolName !== "bash") {
      return;
    }

    const command = event.params.command;
    if (typeof command !== "string") {
      return;
    }

    // Check A: Strip zero-width characters
    const cleaned = command.replace(/\u{200B}|\u{200C}|\u{200D}|\u{2060}|\u{FEFF}|\u{00AD}/gu, "");
    const hadZeroWidth = cleaned !== command;

    // Check B: Detect ANSI-C quoting
    if (ANSI_C_QUOTE_RE.test(cleaned)) {
      return {
        block: true,
        blockReason:
          "ANSI-C quoting ($'...\\\\...') detected in command. This quoting style can obfuscate commands and is blocked for security.",
      };
    }

    // Check C: Detect protected file operands
    const tokens = tokenizeCommand(cleaned);
    for (const token of tokens) {
      // Normalize token as a path for suffix matching
      const normalized = token.replace(/\\/g, "/");
      const expanded = normalized.startsWith("~/")
        ? normalized.replace("~/", (process.env.HOME ?? "").replace(/\\/g, "/") + "/")
        : normalized;
      if (isProtectedPath(expanded, allSuffixes)) {
        const matched = allSuffixes.find(
          (s) => expanded.endsWith("/" + s) || expanded === s,
        );
        return {
          block: true,
          blockReason: `Command references protected file '${matched ?? token}'. Protected files cannot be accessed through exec.`,
        };
      }
    }

    // If zero-width chars were stripped, pass cleaned command
    if (hadZeroWidth) {
      return {
        params: { ...event.params, command: cleaned },
      };
    }
  }

  return { beforeToolCall };
}
