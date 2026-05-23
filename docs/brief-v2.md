# Halo — Team Brief
**Cursor Calgary @ SAIT | Deadline: 2026-05-24 11:00 AM**

---

## What We're Building

**Halo** is a personal AI system that tracks the gap between what you said matters to you and where your time is actually going — and surfaces that drift before it's too late to recover.

It's not a task manager. It's a personal compass.

---

## The Problem (Personal)

We say yes to things constantly — a meeting, helping someone debug, a social invite, a new commitment. Each one feels reasonable. But by Friday, we've been "busy" all week and haven't moved on what actually matters to us.

The drift is invisible until it's too late. No tool we use today catches it.

---

## The Demo Story

**Character:** Alex — a second-year CS student with two stated goals:
- Finish Data Structures with at least a B+
- Make progress toward publishing a research paper

**This week:** Alex accepted 5 unplanned commitments (helped a classmate, attended two social events, joined a club meeting, took on a group project). Each felt fine.

**Tonight:** DS homework is due tomorrow. Alex hasn't touched the research paper in 12 days.

**What Halo shows:**
1. Alex logs in — sees: *"9 unplanned hours this week. Research paper: 0 hours in 12 days."*
2. Alex's DS homework is flagged as stalled (opened 6 times, no progress). Halo breaks it into 4 chunks: Review notes (20 min) → Problems 1–3 (45 min) → Problems 4–5 (45 min) → Submit (15 min).
3. Halo generates tonight's plan, time-boxed to Alex's real pace (based on history: coding tasks take Alex 2x their estimate).
4. Closing nudge: *"3 hours protected for your goals tonight. You're back on track."*

**The emotional beat judges feel:** The system isn't just organizing tasks. It's holding Alex accountable to the person Alex said they wanted to be.

---

## The Three Core Features

### 1. Drift Detection
Compares your stated goals vs. your actual commitment log for the week. Surfaces the gap with real numbers. Fires when you're about to accept something new.

### 2. Adaptive Priority List
Claude generates tonight's priority list based on: what's due, relative impact on your goals, and your historical pace on similar tasks. Not generic — calibrated to how you actually work.

### 3. Procrastination → Decomposition
When a task shows stall signals (visited multiple times, no updates, pushed repeatedly), Halo breaks it into smaller, immediately actionable chunks and nudges you to start the first one.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Next.js (App Router) |
| Backend | Next.js API routes (Vercel serverless) |
| Database | Supabase (Postgres) |
| AI | Claude API (Anthropic) |
| Deployment | Vercel |

---

## Who Owns What

| Person | Owns |
|---|---|
| Jerome | Claude API integration — drift detection logic, priority generation, task decomposition prompts, structured outputs |
| BR | System architecture, API route design, overall backend |
| LN | Supabase schema, data layer, demo scenario seeding (Alex's pre-loaded history) |
| DS | Frontend — task input UI, drift surface view, priority list display, decomposition card |

---

## What "Done" Looks Like for the Demo

The demo must exercise all five steps of the user journey live:

1. Alex's goals and commitments are loaded — drift is visible immediately
2. Drift message fires with real numbers from the data
3. Claude returns a ranked priority list with time boxes — displayed in the UI
4. DS homework shows stall signal — Claude returns 4 sub-tasks — displayed as actionable steps
5. Session summary shows protected hours + goal nudge

**The demo runs on pre-seeded data.** LN seeds Alex's task history, commitment log, and behavioral patterns into Supabase before the demo. The AI responses should feel specific and earned, not generic.

---

## Explicitly Out of Scope

- Calendar integration (no OAuth, no Google Calendar sync)
- Mobile app
- Multi-user or team features
- Real-time ingestion from external sources
- Push notifications

Do not build these. Scope discipline is what makes the demo clean.

---

## Judging Criteria (What Matters)

| Criterion | Weight | How Halo scores |
|---|---|---|
| Innovation | 25% | Behavioral drift detection is a novel framing vs. generic task managers |
| Technical Execution | 20% | Structured Claude outputs, validated data at AI boundary, clean Supabase schema |
| Functional Completeness | 20% | All 5 demo steps must work live |
| Problem-Solution Fit | 20% | The problem is personal — the team named it themselves |
| UX | 5% | Clean, clear, one screen at a time |
| Demo | 5% | Pre-seeded scenario means no live data risk |
| Ambition | 5% | A system that models how you work is a hard problem |

---

## Key Risk

**The demo must feel specific, not generic.** If Claude returns a generic priority list ("Here are your tasks!"), it fails. The outputs need to reference Alex's actual goals, actual hours, actual history. Prompt engineering and demo data seeding are the two highest-risk items — tackle them early.
