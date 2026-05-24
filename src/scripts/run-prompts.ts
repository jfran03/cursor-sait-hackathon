import OpenAI from "openai";
import alex from "../data/demo/userProfile.json";
import history from "../data/demo/pastWorkHistory.json";
import telemetry from "../data/demo/currentBehaviorTelemetry.json";
import humanLogs from "../data/demo/humanLogs.json";
import { DRIFT_SYSTEM_PROMPT } from "../lib/prompts/drift";
import { PRIORITIES_SYSTEM_PROMPT } from "../lib/prompts/priorities";
import { DECOMPOSE_SYSTEM_PROMPT } from "../lib/prompts/decompose";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "meta/llama-3.1-70b-instruct";

async function callModel(
  systemPrompt: string,
  userMessage: string,
  toolName: string,
  parameters: OpenAI.FunctionParameters
): Promise<unknown> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    tools: [{ type: "function", function: { name: toolName, description: "", parameters } }],
    tool_choice: { type: "function", function: { name: toolName } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.find((tc) => tc.type === "function");
  if (!toolCall) throw new Error("No function tool call in response");
  return JSON.parse(toolCall.function.arguments);
}

// ── User messages ─────────────────────────────────────────────────────────────

const driftMessage = `
Goals: ${JSON.stringify(alex.goals)}

Commitments this week: ${JSON.stringify(alex.commitments)}

Historical context:
- GPA: ${history.historical_trends.gpa_cumulative}
- Global velocity multiplier: ${history.historical_trends.global_velocity_multiplier}x (tasks take this much longer than estimated on average)
- Procrastination index: ${history.historical_trends.procrastination_index}

Behavioral summary: ${alex.drift_context?.behavioral_summary ?? JSON.stringify(alex.drift_context)}

Biometric and spatial context: ${JSON.stringify(humanLogs.biometric_and_spatial)}

Cognitive environment: ${JSON.stringify(telemetry.cognitive_environment)}
`.trim();

const prioritiesMessage = `
Goals: ${JSON.stringify(alex.goals)}

Commitments this week: ${JSON.stringify(alex.commitments)}

Assignment velocity history (use for realistic time estimates):
${JSON.stringify(history.assignment_baselines)}

Cognitive environment: ${JSON.stringify(telemetry.cognitive_environment)}

Biometric and spatial context: ${JSON.stringify(humanLogs.biometric_and_spatial)}
`.trim();

const decomposeMessage = `
Stalled task: "${alex.stalled_item.goal_title}"
Goal it serves: "${alex.goals.find(g => g.id === alex.stalled_item.goal_id)?.title ?? alex.goals[1].title}"

Live IDE telemetry: ${JSON.stringify(telemetry.ide_telemetry_window_30m)}

Active stalled item data: ${JSON.stringify(telemetry.active_stalled_item)}

Behavioral friction profile: ${JSON.stringify(telemetry.behavioral_friction)}

Historical performance on similar task types:
${JSON.stringify(history.assignment_baselines)}

Cognitive and biometric state:
- Fatigue: ${telemetry.cognitive_environment.current_fatigue_level}
- Sleep debt: ${humanLogs.biometric_and_spatial.fitness_tracker.sleep_debt_accumulated_hours}h
- Current location: ${humanLogs.biometric_and_spatial.spatial.geofence_tag}
- Inferred activity: ${humanLogs.biometric_and_spatial.current_activity.inferred_activity}
`.trim();

// ── Prompt runners ────────────────────────────────────────────────────────────

const prompts = {
  drift: () =>
    callModel(DRIFT_SYSTEM_PROMPT, driftMessage, "drift_report", {
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
    callModel(PRIORITIES_SYSTEM_PROMPT, prioritiesMessage, "priority_list", {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title:             { type: "string" },
              goal:              { type: "string" },
              estimated_minutes: { type: "number" },
              rationale:         { type: "string" },
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
    callModel(DECOMPOSE_SYSTEM_PROMPT, decomposeMessage, "decompose_task", {
      type: "object",
      properties: {
        subtasks: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              title:             { type: "string" },
              estimated_minutes: { type: "number" },
            },
            required: ["title", "estimated_minutes"],
          },
        },
        nudge: { type: "string" },
      },
      required: ["subtasks", "nudge"],
    }),
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
