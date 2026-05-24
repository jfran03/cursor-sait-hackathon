Halo — Next.js demo (Cursor Calgary @ SAIT)

Overview

Halo demonstrates drift detection and adaptive prioritization for a student persona (Alex). This repo contains the UI, prompt runners, seed data, and API routes used for the hackathon demo.

Quick start

1. Install dependencies:

   npm install

2. Add environment variables in .env.local (root):

   NVIDIA_API_KEY=...           # required to call LLM; optional for demo if using mock fallback
   NEXT_PUBLIC_SUPABASE_URL=...  # Supabase URL (optional for demo)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=... # Supabase anon key (optional for demo)
   SUPABASE_SERVICE_ROLE_KEY=... # Service role key used by scripts/seed.ts (optional)

3. Run the dev server:

   npm run dev

Seed demo data (optional — requires SUPABASE keys)

   npx tsx scripts/seed.ts

Run prompt runners (calls LLM via NVIDIA integration)

   npm run prompts

Mock fallback (recommended for live demo)

- A safe mock file with canonical responses lives at src/data/mock-responses.json and is used automatically by the API routes when the NVIDIA_API_KEY is missing or when the model call fails.
- API routes with fallback: /api/drift, /api/priorities, /api/decompose — each returns the mock section when LLM is unavailable.

Demo flow (60s)

Follow src/data/demo/demoFlow.md for the scripted 60s demo steps: onboarding → incoming request → drift message → priorities → decompose → session summary.

Files of interest

- src/data/demo/userProfile.json — Alex demo profile (goals, commitments, stalled item)
- src/data/mock-responses.json — canned drift/priorities/decompose JSON used for fallback
- src/scripts/run-prompts.ts — runner that builds prompt context and calls the LLM (or verify against mock)
- src/lib/prompts/*.ts — system prompt templates for drift/priorities/decompose (tuned for demo)
- src/app/api/{drift,priorities,decompose}/route.ts — API endpoints; they now fallback to mock responses when LLM is missing/fails
- scripts/seed.ts — seeds the Alex scenario into Supabase (requires SUPABASE keys)
- src/data/demo/demoFlow.md — step-by-step demo script and operator notes

Smoke tests

- Quick check (server running): POST sample payloads to each API route. Example using curl (replace port if needed):

  curl -X POST http://localhost:3000/api/drift -d '{"goals":[],"commitments":[]}' -H 'Content-Type: application/json'

- When NVIDIA_API_KEY is unset, the endpoints should return mock responses from src/data/mock-responses.json.

Development notes

- To force the mock during development, unset NVIDIA_API_KEY in your environment or remove it from .env.local.
- Prompts have been tuned to produce demo-friendly outputs (3 priority items, protected_hours ≈ 3, 4×20m decompose subtasks for coursework).

Contact / Troubleshooting

If the prompts fail or the model returns malformed output, the API will fall back to mock responses. For other issues, check server logs and ensure .env.local is correct.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
