import fs from "node:fs/promises";

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

export function createWriteHardeningHooks(maxWriteLines: number) {
  async function beforeToolCall(
    event: BeforeToolCallEvent,
    _ctx: ToolContext,
  ): Promise<BeforeToolCallResult | void> {
    if (event.toolName !== "write") {
      return;
    }

    const filePath = event.params.file_path;
    if (typeof filePath !== "string") {
      return;
    }

    // Allow new file creation
    try {
      await fs.access(filePath);
    } catch {
      return;
    }

    // File exists — check line count
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lineCount = content.split("\n").length;

      if (lineCount > maxWriteLines) {
        return {
          block: true,
          blockReason: `This file has ${lineCount} lines. Use edit for targeted changes instead of overwriting the entire file with write.`,
        };
      }
    } catch {
      // Cannot read file — allow write to proceed
      return;
    }
  }

  async function afterToolCall(
    event: AfterToolCallEvent,
    _ctx: ToolContext,
  ): Promise<void> {
    if (event.toolName !== "write") {
      return;
    }

    const filePath = event.params.file_path;
    if (typeof filePath !== "string") {
      return;
    }

    // Verify file exists post-write (informational only)
    try {
      await fs.access(filePath);
    } catch {
      // Silent write failure — logged but no mechanism to surface in after_tool_call
    }
  }

  return { beforeToolCall, afterToolCall };
}
