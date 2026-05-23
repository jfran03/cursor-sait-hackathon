import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PriorityListResponseSchema } from "@/lib/types";
import { PRIORITIES_SYSTEM_PROMPT } from "@/lib/prompts/priorities";

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
      { role: "system", content: PRIORITIES_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "priority_list",
          description: "Generate tonight's priority list for the student",
          parameters: {
            type: "object",
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
      },
    ],
    tool_choice: { type: "function", function: { name: "priority_list" } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.find((tc) => tc.type === "function");
  if (!toolCall) {
    return NextResponse.json({ error: "No tool call in response" }, { status: 500 });
  }

  let parsed;
  try {
    parsed = PriorityListResponseSchema.safeParse(JSON.parse(toolCall.function.arguments));
  } catch {
    return NextResponse.json({ error: "Failed to parse tool call arguments" }, { status: 500 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response shape", details: parsed.error }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
