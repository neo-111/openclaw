import { definePluginEntry } from "./api.js";
import { createProtectedFilesHook } from "./src/protected-files.js";
import { createWriteHardeningHooks } from "./src/write-hardening.js";
import { createExecHardeningHook } from "./src/exec-hardening.js";
import { DEFAULT_MAX_WRITE_LINES } from "./src/constants.js";

const EXEC_SECURITY_GUIDANCE = [
  "Security enforcement active:",
  "- Protected files (.bashrc, .gitconfig, .ssh/*, .npmrc, .env*, openclaw.json) cannot be modified",
  "- Files over 200 lines cannot be overwritten with write — use edit for targeted changes",
  "- Exec commands are sanitized for Unicode injection and ANSI-C escape obfuscation",
].join("\n");

export default definePluginEntry({
  id: "exec-security",
  name: "Exec Security",
  description:
    "Protected file enforcement, write hardening, and exec command sanitization.",
  register(api) {
    const pluginConfig = api.pluginConfig ?? {};
    const maxWriteLines =
      typeof pluginConfig.maxWriteLines === "number"
        ? pluginConfig.maxWriteLines
        : DEFAULT_MAX_WRITE_LINES;
    const additionalPaths = Array.isArray(pluginConfig.additionalProtectedPaths)
      ? pluginConfig.additionalProtectedPaths.filter(
          (p: unknown): p is string => typeof p === "string",
        )
      : [];

    const protectedFiles = createProtectedFilesHook(additionalPaths);
    const writeHardening = createWriteHardeningHooks(maxWriteLines);
    const execHardening = createExecHardeningHook(additionalPaths);

    // Priority 10: run before dev-tools hooks (default priority 0)
    api.on("before_tool_call", protectedFiles.beforeToolCall, {
      priority: 10,
    });
    api.on("before_tool_call", writeHardening.beforeToolCall, {
      priority: 10,
    });
    api.on("before_tool_call", execHardening.beforeToolCall, { priority: 10 });
    api.on("after_tool_call", writeHardening.afterToolCall);

    api.on("before_prompt_build", async () => ({
      prependSystemContext: EXEC_SECURITY_GUIDANCE,
    }));
  },
});
