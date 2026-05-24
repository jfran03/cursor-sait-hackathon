# Project Brief — Cursor Calgary (SAIT)

> **Event slug:** 2026-05-cursor-calgary-sait
> **Stage:** 02-build
> **Last updated:** 2026-05-23
>
> This file is the single source of truth for this project. Each stage appends its section before advancing. Do not re-derive what is already written here.
>
> **Project folder layout:**
> ```
> projects/2026-05-cursor-calgary-sait/
> ├── AGENTS.md          ← this file (project brief + coding guidelines)
> ├── CLAUDE.md          ← @AGENTS.md
> ├── .mcp.json          ← MCP server config
> ├── .claude/           ← Claude Code settings
> ├── package.json
> ├── next.config.ts
> ├── tsconfig.json
> ├── src/               ← Next.js source (app/, components/, lib/, scripts/)
> ├── supabase/          ← migrations
> ├── docs/              ← reference docs
> └── pitch/             ← deck, script, writeup (Stage 03)
> ```

---

## Event

- **Hackathon:** Cursor Calgary @ SAIT
- **Theme:** Build something that solves a real pain point in your personal life
- **Deadline:** 2026-05-24 11:00 AM
- **Judging pipeline:** 2-phase — AI screening (all teams, Claude) → top 8 advance to human judges

**Phase 2 — AI Screening Criteria:**

| Criterion | Weight | What it means |
|---|---|---|
| Innovation & Originality | 25% | How novel and surprising is the concept? |
| Technical Execution | 20% | Cleverness of the engineering |
| Functional Completeness | 20% | Does the core loop actually work? |
| Problem-Solution Fit | 20% | Solving a real problem convincingly |
| UX & Design | 5% | Visual polish and usability |
| Demo & Communication | 5% | How clearly the project is presented |
| Learning & Ambition | 5% | Did the team stretch themselves? |

**Phase 3 — Final Round Criteria (human judges, score out of 10):**

| Criterion | Weight | Description |
|---|---|---|
| Innovation & Originality | 25% | Creative, fresh, unexpected approach — combined tools in a new way or built something meaningfully different |
| Technical Execution | **25%** | Strong implementation — reliable functionality, clever architecture, clean AI integrations, ambitious features actually built |
| Functional Completeness | 20% | Core experience works end-to-end — not spread across unfinished pieces |
| Problem-Solution Fit | **15%** | Solves a real, clearly defined problem for a specific user |
| Demo & Communication | 5% | Explains problem, solution, technical approach, and what was built |

**Takeaway:** To pass AI screening, Innovation + Problem-Solution Fit = 45%. To win the final round, Technical Execution jumps to 25% (tied with Innovation). Engineer the hell out of it once you make top 8.

## Problem

People make small, reasonable daily decisions — accepting invitations, helping others, taking on extra work — that individually feel justified but collectively pull them away from what they actually care about. The drift is invisible until it's too late to recover.

---

## Target User

> **Who:** A student with real long-term goals competing against an endless stream of immediate demands
> **When:** The moment they realize they've been busy all week but haven't moved on what actually matters
> **Frustration:** Every yes felt reasonable. No one was tracking the cumulative cost.

---

## Wow Moment

Halo reflects back the gap between who you said you wanted to be and where your time actually went — before the week is already lost.

## Scope

### In scope
- Goal setting (stated priorities, long-term goals)
- Commitment tracking (tasks, accepted invitations, ad-hoc help)
- Drift detection and surfacing (gap between stated goals and actual time allocation)
- Tonight's priority list generation (Claude, time-boxed)
- Task decomposition for stalled items (procrastination signal → sub-tasks)
- Gentle nudging tied to stated goals
- Pre-seeded demo scenario (Alex) for live demo

### Explicitly out of scope
- Calendar integration (no OAuth, no Google Calendar)
- Mobile app
- Multi-user / team features
- Real-time data ingestion from external sources
- Notifications / push alerts

---

## Stack

| Layer | Choice | Reason for deviation (if any) |
|---|---|---|
| Frontend | React + Next.js (App Router) | Default preferred stack |
| Backend | Next.js API routes (`/app/api`) | Collocated, deploys as Vercel serverless automatically |
| Data | Supabase | Postgres + auth + storage; MCP available during build |
| AI / LLM | Claude (Anthropic) | Load-bearing: behavioral inference, drift detection, task decomposition, priority generation |
| Deployment | Vercel | Native Next.js host; Vercel MCP available |

---

## UI & Design

**Before writing any UI code, read `DESIGN.md` in the project root.** It is the authoritative design specification for Halo — tokens, typography, components, and do's/don'ts are all defined there. Do not invent colors, font weights, border radii, or spacing values; pull them from DESIGN.md.

Quick reference:
- Canvas: `#f5f5f5` · Surface card: `#ffffff` · Ink: `#0c0a09` · Body text: `#4e4e4e`
- Primary CTA: `#292524` pill (`border-radius: 9999px`), active: `#0c0a09`
- Display font: EB Garamond weight 400 (Waldenburg substitute) with negative letter-spacing
- Body font: Inter weight 400/500 at +0.15–0.16px tracking
- Cards: `border-radius: 16px`, `1px solid #e7e5e4`, hover shadow `0 4px 16px rgba(0,0,0,0.04)`
- Gradient orbs (mint/peach/lavender/sky/rose) — atmospheric decoration only, never fills or text colors

---

## Coding Guidelines

<!-- BEGIN:nextjs-agent-rules -->
This version of Next.js has breaking changes — APIs, conventions, and file structure may differ from training data. Read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

**Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently. If something is unclear, stop and ask.

**Simplicity first.** Minimum code that solves the problem. No features beyond what was asked. No abstractions for single-use code. If you write 200 lines and it could be 50, rewrite it.

**Surgical changes.** Touch only what you must. Match existing style. Don't refactor things that aren't broken. Every changed line should trace directly to the request.

**Goal-driven execution.** For multi-step tasks, state a brief plan with verifiable steps before starting. Define success criteria up front.
