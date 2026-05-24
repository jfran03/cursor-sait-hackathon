# Halo — Personal Drift Detection

> *People make small, reasonable daily decisions that collectively pull them away from what they actually care about. The drift is invisible until it's too late to recover.*

Halo is a web app that detects behavioral drift between a student's stated long-term goals and where their time actually went — then surfaces that gap in real time, before a week is already lost.

---

## The Problem

A student with real long-term goals (research, coursework, internship applications) faces an endless stream of immediate demands: group project favours, club booth requests, social commitments. Every yes feels reasonable. No one is tracking the cumulative cost. By Friday, they've been busy all week and haven't moved on what actually matters.

## What Halo Does

1. **Drift detection** — compares stated goal priorities against actual commitment patterns. Surfaces unplanned hours vs. goal-directed hours, flags stalled goals (days without a session), and generates a plain-language drift message.
2. **Priority generation** — given goals and this week's commitments, produces a tonight-focused priority list with time estimates and rationale.
3. **Task decomposition** — takes a stalled task (detected via procrastination signals: IDE errors, attention scatter) and breaks it into 4 concrete sub-steps calibrated to the user's historical velocity.
4. **Proactive nudge** — reads biometric and spatial telemetry (sleep debt, location, inferred activity) and fires a targeted accountability message if the user's context warrants it.

---

## Demo Flow

The app walks through a scripted scenario for **Alex**, a SAIT CIS student:

| Step | What happens |
|---|---|
| Landing | Halo wordmark + "See the demo →" |
| Intro | Alex's week at a glance: schedule, goals, stalled DS homework, procrastination telemetry |
| Request | Jordan sends a 3-hour request over iMessage. Halo overlay appears with drift context before Alex replies. Alex presses "Analyze my week" — calendar animates through week view → day view → deliberate mode. |
| Drift | Drift report loads: unplanned hours, goal-directed hours, stalled goal list, drift message. |
| Priorities | Tonight's plan: 3 priority items with time estimates and rationale. Proactive nudge fires if telemetry warrants (biometric + spatial data). Alex replies to Jordan: "I've got a deadline tonight." |
| Decompose | DS homework broken into 4 sub-steps. Jordan responds. Focus timer available. |
| Summary | Session summary: drift surfaced, priorities set, DS homework mapped. Closing message. |

---

## Tech Stack

| Layer | What | Why |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | Collocated API routes deploy to Vercel serverless automatically |
| AI / LLM | Llama 3.1 70B (NVIDIA NIM) via OpenAI SDK | Forced tool use for structured JSON outputs on every endpoint |
| Schema validation | Zod | All LLM responses validated before the UI touches them |
| Animation | Framer Motion (layout animations, AnimatePresence) | Phone mockup, overlay transitions, word-by-word text animation |
| Styling | Tailwind CSS + inline design tokens | Single token source; no theme drift during the build |
| Mock fallback | `src/data/mock-responses.json` | API routes return canonical responses when `NVIDIA_API_KEY` is absent or the model fails |

---

## Architecture Notes

**Forced tool use on every LLM call.** Each API route passes `tool_choice: { type: "function", function: { name: "..." } }` to guarantee a structured JSON response rather than free text. Zod schemas then validate the parsed arguments before they reach the UI — if validation fails, the route falls back to the mock rather than surfacing a broken state.

**Deterministic nudge.** `/api/nudge` does not call the LLM. It applies simple rules against biometric + spatial telemetry (sleep debt, geofence tag, inferred activity) to produce a reliable nudge for the demo. `do_not_disturb` flag respected; `demo_mode` toggle in the header forces the nudge on for demo purposes.

**Demo data lives in `src/data/demo/`** — all of Alex's goals, commitments, schedule, telemetry, and work history are static JSON. No auth, no database required to run the demo.

---

## Quick Start

```bash
npm install
```

Create `.env.local` in the project root:

```
NVIDIA_API_KEY=...  # required for live LLM; omit to use mock responses
```

```bash
npm run dev
# open http://localhost:3000
```

To run without an API key (recommended for live demo): omit `NVIDIA_API_KEY`. All four API routes fall back to `src/data/mock-responses.json` automatically.

---

## API Routes

| Route | Input | Output |
|---|---|---|
| `POST /api/drift` | `goals`, `commitments`, `telemetry`, `pastWorkHistory`, `drift_context` | `{ unplanned_hours, goal_directed_hours, stalled_goals[], message }` |
| `POST /api/priorities` | `goals`, `commitments` | `{ items[], protected_hours, closing_message }` |
| `POST /api/decompose` | `task_title`, `goal` | `{ subtasks[4], nudge }` |
| `POST /api/nudge` | `telemetry`, `humanLogs`, `demo_mode` | `{ nudge, severity, do_not_disturb }` |

Smoke test (server running):

```bash
curl -X POST http://localhost:3000/api/drift \
  -d '{"goals":[],"commitments":[]}' \
  -H 'Content-Type: application/json'
```

---

## Files of Interest

```
src/
├── app/
│   ├── page.tsx                    ← full demo UI (6 steps + phone mockup)
│   └── api/
│       ├── drift/route.ts          ← drift detection endpoint
│       ├── priorities/route.ts     ← priority list endpoint
│       ├── decompose/route.ts      ← task decomposition endpoint
│       └── nudge/route.ts          ← deterministic nudge endpoint
├── components/
│   ├── FocusTimer.tsx              ← 20-minute focus session timer
│   ├── ShellNudge.tsx              ← in-overlay nudge card
│   └── preamble/
│       ├── IntroScreen.tsx         ← Alex's week overview (step 1)
│       ├── CalendarDeliberation.tsx ← animated week/day/deliberate calendar
│       ├── TaskDecomposePanel.tsx  ← subtask list with time slots
│       ├── BandwidthMeter.tsx      ← daily capacity visualization
│       └── ProfileDashboard.tsx    ← goal + commitment summary
├── data/demo/
│   ├── userProfile.json            ← Alex's goals, commitments, stalled item
│   ├── schedule.json               ← weekly schedule with obligations
│   ├── currentBehaviorTelemetry.json ← IDE errors, attention scatter
│   ├── humanLogs.json              ← biometric + spatial logs (sleep, location)
│   └── pastWorkHistory.json        ← historical velocity for decomposition
├── data/mock-responses.json        ← canonical fallback for all four routes
└── lib/
    ├── types.ts                    ← Zod schemas for all domain + response types
    ├── prompts/                    ← system prompt templates (drift, priorities, decompose, nudge)
    └── drift-engine.ts             ← drift computation utilities
```

