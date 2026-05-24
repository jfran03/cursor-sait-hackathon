import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { PriorityListResponseSchema } from "@/lib/types";
import { PRIORITIES_SYSTEM_PROMPT } from "@/lib/prompts/priorities";

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
  const { goals, commitments } = await req.json();

  const userMessage = `Goals: ${JSON.stringify(goals)}\n\nCommitments this week: ${JSON.stringify(commitments)}`;

  if (!process.env.NVIDIA_API_KEY) {
    const mock = await readMockSection("priorities");
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ error: "NVIDIA_API_KEY not set and mock unavailable" }, { status: 500 });
  }

  try {
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
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = PriorityListResponseSchema.safeParse(JSON.parse(toolCall.function.arguments));
    if (!parsed.success) throw new Error("Invalid response shape");

    return NextResponse.json(parsed.data);
  } catch (err) {
    const mock = await readMockSection("priorities");
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
