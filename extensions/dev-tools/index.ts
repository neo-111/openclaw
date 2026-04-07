import { definePluginEntry, type AnyAgentTool } from "./api.js";
import { createGlobTool } from "./src/tools/glob-tool.js";
import { createGrepTool } from "./src/tools/grep-tool.js";
import { createReadBeforeEditHooks } from "./src/hooks/read-before-edit.js";
import { DEV_TOOLS_AGENT_GUIDANCE } from "./src/prompt-guidance.js";

export default definePluginEntry({
  id: "dev-tools",
  name: "Dev Tools",
  description: "File search (glob), content search (grep), and read-before-edit enforcement.",
  register(api) {
    api.registerTool(createGlobTool() as AnyAgentTool);
    api.registerTool(createGrepTool() as AnyAgentTool);

    const { beforeToolCall, afterToolCall } = createReadBeforeEditHooks();
    api.on("before_tool_call", beforeToolCall);
    api.on("after_tool_call", afterToolCall);

    api.on("before_prompt_build", async () => ({
      prependSystemContext: DEV_TOOLS_AGENT_GUIDANCE,
    }));
  },
});
