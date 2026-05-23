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
> ├── CLAUDE.md          ← this file (project brief, created Stage 01)
> ├── team-brief.md      ← shareable brief for team members
> ├── repo-context.md    ← only if a repo was cloned (created Stage 02 intake)
> ├── src/               ← build artifact (Stage 02)
> └── pitch/             ← deck, script, writeup (Stage 03)
> ```

---

## Event

- **Hackathon:** Cursor Calgary @ SAIT
- **Theme:** Build something that solves a real pain point in your personal life
- **Deadline:** 2026-05-24 11:00 AM
- **Judging criteria (ranked):**
  1. Innovation (25%)
  2. Technical Execution (20%)
  3. Functional Completeness (20%)
  4. Problem-Solution Fit (20%)
  5. UX (5%), Demo (5%), Ambition (5%)

---

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

---

## Spec

### User Journey
*(numbered steps in demo order)*

1. Alex onboards — states two goals and logs this week's commitments and accepted invitations
2. Alex is about to accept another request — Halo surfaces the drift: *"9 unplanned hours this week. Research paper: 0 hours in 12 days."*
3. Halo generates tonight's priority list — what matters, time-boxed to Alex's real pace
4. DS homework flagged as stalled — Halo breaks it into 4 chunks, first one is 20 minutes
5. Session closes: *"3 hours protected for your goals tonight. You're back on track."*

### Done When

1. User can enter goals + commitments; system persists to Supabase and confirms receipt
2. System calculates unplanned hours vs. goal-directed hours; drift message surfaces with real numbers from the data
3. Claude returns a ranked priority list with time estimates; displayed clearly in the UI
4. Stall signal detected (triggered via demo data); Claude returns 4 sub-tasks; displayed as actionable steps
5. Session summary card renders with protected hours count and next goal nudge

---

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

### Feasibility check
- Buildable in time? Yes — 4 people, clear feature ownership, standard stack
- Demoable live? Yes — pre-seeded Alex scenario, all steps exercisable in under 60 seconds
- Does someone clearly need this? Yes — the team named the pain themselves (competing priorities, impulsive yes, drift from goals)

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

## Visual Reference

- **Reference:** TBD — fill in if provided before Stage 02 scaffold
- **What to take from it:** —
- **What to ignore:** —

---

## Build Notes
*(appended at Stage 02 gate)*

### Happy path
1.
2.
3.

### Key decisions made during build


### What's mocked or fragile


---

## Pitch Angle
*(appended at Stage 03 gate)*

### Hook (one sentence)


### Before / After framing


### 60-second version outline


### 3-minute version outline
