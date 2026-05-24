import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { DecomposeResponseSchema } from "@/lib/types";
import { DECOMPOSE_SYSTEM_PROMPT } from "@/lib/prompts/decompose";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "meta/llama-3.1-70b-instruct";
const MOCK_PATH = path.join(process.cwd(), "src/data/mock-responses.json");

async function readMockSection(section: string) {
  try {
    const raw = fs.readFileSync(MOCK_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed[section];
  } catch (err) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { task_title, goal } = await req.json();

  const userMessage = `Stalled task: "${task_title}"\nGoal it serves: "${goal}"`;

  if (!process.env.NVIDIA_API_KEY) {
    const mock = await readMockSection("decompose");
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ error: "NVIDIA_API_KEY not set and mock unavailable" }, { status: 500 });
  }

  try {
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
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = DecomposeResponseSchema.safeParse(JSON.parse(toolCall.function.arguments));
    if (!parsed.success) throw new Error("Invalid response shape");

    return NextResponse.json(parsed.data);
  } catch (err) {
    const mock = await readMockSection("decompose");
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
