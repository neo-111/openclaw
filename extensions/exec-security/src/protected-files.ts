import {
  PROTECTED_SUFFIXES,
  normalizePath,
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

export function createProtectedFilesHook(additionalPaths: string[]) {
  const allSuffixes = [...PROTECTED_SUFFIXES, ...additionalPaths];

  async function beforeToolCall(
    event: BeforeToolCallEvent,
    _ctx: ToolContext,
  ): Promise<BeforeToolCallResult | void> {
    if (event.toolName !== "write" && event.toolName !== "edit") {
      return;
    }

    const filePath = event.params.file_path;
    if (typeof filePath !== "string") {
      return;
    }

    const normalized = normalizePath(filePath);

    if (isProtectedPath(normalized, allSuffixes)) {
      const matched = allSuffixes.find(
        (s) => normalized.endsWith("/" + s) || normalized === s,
      );
      return {
        block: true,
        blockReason: `Protected file: ${matched ?? filePath} cannot be modified. This file is on the security-enforced protected list.`,
      };
    }
  }

  return { beforeToolCall };
}
