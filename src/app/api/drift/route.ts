import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { DriftResponseSchema } from "@/lib/types";
import { DRIFT_SYSTEM_PROMPT } from "@/lib/prompts/drift";

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

  // If API key missing, return mock immediately
  if (!process.env.NVIDIA_API_KEY) {
    const mock = await readMockSection("drift");
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ error: "NVIDIA_API_KEY not set and mock unavailable" }, { status: 500 });
  }

  try {
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
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = DriftResponseSchema.safeParse(JSON.parse(toolCall.function.arguments));
    if (!parsed.success) throw new Error("Invalid response shape");

    return NextResponse.json(parsed.data);
  } catch (err) {
    // Fallback to mock on any error
    const mock = await readMockSection("drift");
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
