import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DriftResponseSchema } from "@/lib/types";
import { DRIFT_SYSTEM_PROMPT } from "@/lib/prompts/drift";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { goals, commitments } = await req.json();

  const userMessage = `Goals: ${JSON.stringify(goals)}\n\nCommitments this week: ${JSON.stringify(commitments)}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: DRIFT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
    tools: [
      {
        name: "drift_report",
        description: "Report the drift between stated goals and actual time allocation",
        input_schema: {
          type: "object" as const,
          properties: {
            unplanned_hours: { type: "number" },
            goal_directed_hours: { type: "number" },
            stalled_goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal_title: { type: "string" },
                  days_since_activity: { type: "number" },
                },
                required: ["goal_title", "days_since_activity"],
              },
            },
            message: { type: "string" },
          },
          required: ["unplanned_hours", "goal_directed_hours", "stalled_goals", "message"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "drift_report" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "No tool use in response" }, { status: 500 });
  }

  const parsed = DriftResponseSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response shape", details: parsed.error }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
