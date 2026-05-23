import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DecomposeResponseSchema } from "@/lib/types";
import { DECOMPOSE_SYSTEM_PROMPT } from "@/lib/prompts/decompose";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { task_title, goal } = await req.json();

  const userMessage = `Stalled task: "${task_title}"\nGoal it serves: "${goal}"`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: DECOMPOSE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
    tools: [
      {
        name: "decompose_task",
        description: "Break a stalled task into 4 concrete subtasks",
        input_schema: {
          type: "object" as const,
          properties: {
            subtasks: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  estimated_minutes: { type: "number" },
                },
                required: ["title", "estimated_minutes"],
              },
            },
            nudge: { type: "string" },
          },
          required: ["subtasks", "nudge"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "decompose_task" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "No tool use in response" }, { status: 500 });
  }

  const parsed = DecomposeResponseSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response shape", details: parsed.error }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
