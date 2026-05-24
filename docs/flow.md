Halo architecture & flow (summary)

Overview
- Frontend: Next.js app (src/app) — UI components, PopupNudge, Calendar, Profile sidebar, Demo toggle.
- API: Next.js API routes under src/app/api: /drift, /priorities, /decompose, /nudge. Each route builds prompt context and either calls the LLM (NVIDIA/Claude) or returns fallback mock responses from src/data/mock-responses.json.
- LLM: External model integration (NVIDIA_API_KEY + baseURL) used for behavior inference, prioritization, and decomposition. Deterministic demo behavior supported via tuned system prompts and mock responses.
- Persistence: Supabase for profile, goals, commitments; scripts/seed.ts to populate demo data. API routes read/write to Supabase when keys present; otherwise use mock file.
- Telemetry: client-side telemetry (src/data/demo/currentBehaviorTelemetry.json and humanLogs.json in demo) is posted to API endpoints for nudge/assessment.
- CLI: scripts/run-prompts.ts used to test prompts offline and generate canned outputs.

Key flows
1) Demo / normal interaction (UI-driven)
   - User clicks "See my drift" → Frontend posts goals & commitments to /api/drift.
   - /api/drift composes prompt (includes telemetry/humanLogs if present), calls LLM (or reads mock), returns DriftResponse (unplanned_hours, stalled_goals, message).
   - Frontend renders drift card; user continues to priorities and decompose flows. /api/priorities and /api/decompose follow same pattern.

2) Proactive nudge flow
   - On page load (or periodic short-poll), Frontend POSTs telemetry + humanLogs to /api/nudge. If demoMode=true, API ignores suppress_nudges to force a nudge.
   - /api/nudge applies deterministic rules (sleep debt, inferred activity, location) to produce {nudge,severity,recommended_action,do_not_disturb}.
   - Frontend shows PopupNudge if do_not_disturb=false.

3) Offline/demo mode
   - If NVIDIA_API_KEY is absent or model call fails, API routes return sections from src/data/mock-responses.json for consistent demo outputs.
   - Demo toggle (UI) can force behaviors (e.g., force nudge even when suppress_nudges=true).

Implementation notes & next steps
- Add calendar component that reads commitments and protected blocks; clicking an item calls an assessment API that returns risk and suggested chunking.
- Decomposition API should return structured subtasks (title, estimated_minutes, first_step, nudge) to render in UI.
- Add CI smoke tests to POST sample payloads to /api/* and validate schema; include a demo-mode flag for predictable output.

Files of interest
- src/app/page.tsx — main UI flow and PopupNudge integration
- src/lib/prompts/* — system prompt templates (drift/priorities/decompose/nudge)
- src/app/api/*/route.ts — endpoints with fallback logic
- src/data/mock-responses.json — canonical demo outputs
- scripts/run-prompts.ts — CLI runner for prompts
- scripts/seed.ts — Supabase seed script (optional for demo)

Diagram files
- docs/architecture.svg — visual diagram of components and flows

Questions? Reply if you want: (A) a PNG export of the diagram, (B) a Confluence-style embed-ready PNG, (C) a downloadable PDF, or (D) wireframes for the calendar/profile screens.