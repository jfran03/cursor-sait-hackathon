import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DriftResponseSchema } from "@/lib/types";
import { DRIFT_SYSTEM_PROMPT } from "@/lib/prompts/drift";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "meta/llama-3.1-70b-instruct";

export async function POST(req: NextRequest) {
  const { goals, commitments } = await req.json();

  const userMessage = `Goals: ${JSON.stringify(goals)}\n\nCommitments this week: ${JSON.stringify(commitments)}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: DRIFT_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "drift_report",
          description: "Report the drift between stated goals and actual time allocation",
          parameters: {
            type: "object",
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
      },
    ],
    tool_choice: { type: "function", function: { name: "drift_report" } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.find((tc) => tc.type === "function");
  if (!toolCall) {
    return NextResponse.json({ error: "No tool call in response" }, { status: 500 });
  }

  let parsed;
  try {
    parsed = DriftResponseSchema.safeParse(JSON.parse(toolCall.function.arguments));
  } catch {
    return NextResponse.json({ error: "Failed to parse tool call arguments" }, { status: 500 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response shape", details: parsed.error }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
