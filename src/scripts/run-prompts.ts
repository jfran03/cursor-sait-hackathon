import Anthropic from "@anthropic-ai/sdk";
import alex from "../lib/demo/alex.json";
import { DRIFT_SYSTEM_PROMPT } from "../lib/prompts/drift";
import { PRIORITIES_SYSTEM_PROMPT } from "../lib/prompts/priorities";
import { DECOMPOSE_SYSTEM_PROMPT } from "../lib/prompts/decompose";

const client = new Anthropic();

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  toolName: string,
  toolSchema: Anthropic.Tool["input_schema"]
): Promise<unknown> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMessage }],
    tools: [{ name: toolName, description: "", input_schema: toolSchema }],
    tool_choice: { type: "tool", name: toolName },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use block in response");
  return toolUse.input;
}

const commitmentMsg = `Goals: ${JSON.stringify(alex.goals)}\n\nCommitments this week: ${JSON.stringify(alex.commitments)}`;

const prompts = {
  drift: () =>
    callClaude(DRIFT_SYSTEM_PROMPT, commitmentMsg, "drift_report", {
      type: "object",
      properties: {
        unplanned_hours:     { type: "number" },
        goal_directed_hours: { type: "number" },
        stalled_goals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              goal_title:          { type: "string" },
              days_since_activity: { type: "number" },
            },
            required: ["goal_title", "days_since_activity"],
          },
        },
        message: { type: "string" },
      },
      required: ["unplanned_hours", "goal_directed_hours", "stalled_goals", "message"],
    }),

  priorities: () =>
    callClaude(PRIORITIES_SYSTEM_PROMPT, commitmentMsg, "priority_list", {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title:               { type: "string" },
              goal:                { type: "string" },
              estimated_minutes:   { type: "number" },
              rationale:           { type: "string" },
            },
            required: ["title", "goal", "estimated_minutes", "rationale"],
          },
        },
        protected_hours:  { type: "number" },
        closing_message:  { type: "string" },
      },
      required: ["items", "protected_hours", "closing_message"],
    }),

  decompose: () =>
    callClaude(
      DECOMPOSE_SYSTEM_PROMPT,
      `Stalled task: "${alex.stalled_item.goal_title}"\nGoal it serves: "${alex.goals[1].title}"`,
      "decompose_task",
      {
        type: "object",
        properties: {
          subtasks: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                title:               { type: "string" },
                estimated_minutes:   { type: "number" },
              },
              required: ["title", "estimated_minutes"],
            },
          },
          nudge: { type: "string" },
        },
        required: ["subtasks", "nudge"],
      }
    ),
};

type PromptKey = keyof typeof prompts;

async function main() {
  const arg = process.argv[2] as PromptKey | undefined;
  const keys: PromptKey[] = arg && arg in prompts ? [arg] : (Object.keys(prompts) as PromptKey[]);

  for (const key of keys) {
    console.log(`\n── ${key} ─────────────────────────────`);
    try {
      const result = await prompts[key]();
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main();
