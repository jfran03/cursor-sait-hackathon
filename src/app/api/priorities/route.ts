import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PriorityListResponseSchema } from "@/lib/types";
import { PRIORITIES_SYSTEM_PROMPT } from "@/lib/prompts/priorities";

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
        text: PRIORITIES_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
    tools: [
      {
        name: "priority_list",
        description: "Generate tonight's priority list for the student",
        input_schema: {
          type: "object" as const,
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  goal: { type: "string" },
                  estimated_minutes: { type: "number" },
                  rationale: { type: "string" },
                },
                required: ["title", "goal", "estimated_minutes", "rationale"],
              },
            },
            protected_hours: { type: "number" },
            closing_message: { type: "string" },
          },
          required: ["items", "protected_hours", "closing_message"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "priority_list" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "No tool use in response" }, { status: 500 });
  }

  const parsed = PriorityListResponseSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response shape", details: parsed.error }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
