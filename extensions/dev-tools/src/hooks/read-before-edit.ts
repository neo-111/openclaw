import fs from "node:fs/promises";
import path from "node:path";

type BeforeToolCallEvent = {
  toolName: string;
  params: Record<string, unknown>;
  runId?: string;
  toolCallId?: string;
};

type AfterToolCallEvent = {
  toolName: string;
  params: Record<string, unknown>;
  runId?: string;
  toolCallId?: string;
  result?: unknown;
  error?: string;
  durationMs?: number;
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

const MAX_SESSIONS = 100;

function normalizePath(filePath: string): string {
  return path.resolve(filePath);
}

export function createReadBeforeEditHooks() {
  // Map<sessionId, Set<normalizedFilePath>>
  const readFiles = new Map<string, Set<string>>();

  function getSessionSet(sessionId: string): Set<string> {
    let set = readFiles.get(sessionId);
    if (!set) {
      // Clean up if too many sessions tracked
      if (readFiles.size >= MAX_SESSIONS) {
        const oldest = readFiles.keys().next().value;
        if (oldest !== undefined) readFiles.delete(oldest);
      }
      set = new Set();
      readFiles.set(sessionId, set);
    }
    return set;
  }

  async function afterToolCall(
    event: AfterToolCallEvent,
    ctx: ToolContext,
  ): Promise<void> {
    if (event.toolName !== "read") return;

    const filePath = event.params.file_path;
    if (typeof filePath !== "string") return;

    const sessionId = ctx.sessionId ?? ctx.sessionKey ?? "default";
    const set = getSessionSet(sessionId);
    set.add(normalizePath(filePath));
  }

  async function beforeToolCall(
    event: BeforeToolCallEvent,
    ctx: ToolContext,
  ): Promise<BeforeToolCallResult | void> {
    if (event.toolName !== "edit" && event.toolName !== "write") return;

    const filePath = event.params.file_path;
    if (typeof filePath !== "string") return;

    // For write: only block if the file already exists (new file creation is allowed)
    if (event.toolName === "write") {
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist — allow creation without read
        return;
      }
    }

    const sessionId = ctx.sessionId ?? ctx.sessionKey ?? "default";
    const set = readFiles.get(sessionId);
    const normalized = normalizePath(filePath);

    if (!set || !set.has(normalized)) {
      return {
        block: true,
        blockReason: "You must read this file before editing it. Use the read tool first.",
      };
    }
  }

  return { beforeToolCall, afterToolCall };
}
