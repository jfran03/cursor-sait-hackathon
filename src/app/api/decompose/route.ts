import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DecomposeResponseSchema } from "@/lib/types";
import { DECOMPOSE_SYSTEM_PROMPT } from "@/lib/prompts/decompose";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "meta/llama-3.1-70b-instruct";

export async function POST(req: NextRequest) {
  const { task_title, goal } = await req.json();

  const userMessage = `Stalled task: "${task_title}"\nGoal it serves: "${goal}"`;

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: DECOMPOSE_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "decompose_task",
          description: "Break a stalled task into 4 concrete subtasks",
          parameters: {
            type: "object",
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
      },
    ],
    tool_choice: { type: "function", function: { name: "decompose_task" } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.find((tc) => tc.type === "function");
  if (!toolCall) {
    return NextResponse.json({ error: "No tool call in response" }, { status: 500 });
  }

  let parsed;
  try {
    parsed = DecomposeResponseSchema.safeParse(JSON.parse(toolCall.function.arguments));
  } catch {
    return NextResponse.json({ error: "Failed to parse tool call arguments" }, { status: 500 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response shape", details: parsed.error }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
