# Cursor Calgary (SAIT) — 2026-05-cursor-calgary-sait

> Created at Stage 01. Updated throughout the event. Do not compile-step this page — it is a live record.

---

## Brief Summary
*(written at Stage 01)*

- **Theme:** Build something that solves a real pain point in your personal life
- **Duration:** 2026-05-23 11:00 AM → 2026-05-24 11:00 AM (24 hours)
- **Judging pipeline:** 2-phase — AI screening (Claude, all teams) → top 8 advance to human judges
- **AI screening criteria:** Innovation & Originality 25%, Technical Execution 20%, Functional Completeness 20%, Problem-Solution Fit 20%, UX & Design 5%, Demo & Communication 5%, Learning & Ambition 5%
- **Final round criteria (human judges, score out of 10):** Innovation & Originality 25%, Technical Execution 25%, Functional Completeness 20%, Problem-Solution Fit 15%, Demo & Communication 5% — NOTE: Technical Execution jumps from 20% → 25% and Problem-Solution Fit drops from 20% → 15% in the final round
- **Problem chosen:** Halo — personal drift detection. People make small, reasonable daily decisions that collectively pull them away from their real goals. No tool catches the cumulative cost.
- **Target user:** A student with meaningful long-term goals, at the moment they realize they've been busy all week but haven't moved on what matters
- **Wow moment:** Halo reflects back the gap between who you said you wanted to be and where your time actually went — before the week is already lost

---

## Judging Pipeline

### Phase 1 — Submit
- Project name, description, public GitHub repo URL required
- Upload **up to 5 screenshots** — used directly for AI visual review (Pass 4). If none uploaded, UX sub-scores default to 0.
- Demo URL if available
- Submissions updatable anytime before deadline

### Phase 2 — AI Screening (Claude)
All teams scored. Top 8 advance. You will NOT see your AI score before admin review.

Claude runs **6 passes** per submission:

| Pass | Model | What it does |
|---|---|---|
| 1 — Repo Archaeology | Sonnet | Extracts tech stack, template detection, commit history metadata, README summary, key files. Grounds all downstream passes. |
| 2 — Code Deep Dive | Sonnet | Reads source files for clever solutions, novel API use, architectural decisions. Does NOT penalize messy code, TODOs, or missing tests — it's a 24-hour build. |
| 3 — Innovation Audit | Sonnet | Checks against 13 common hackathon archetypes (LangChain+Pinecone CRUD, basic todo/weather, boilerplate chatbots, etc.). Flags "senior engineer surprise factor": meh / interesting / impressive / exceptional. |
| 4 — Visual/UX Review | Sonnet | Reviews up to 5 screenshots as image inputs. Scores visual hierarchy, design consistency, UX flow clarity, brand cohesion. No screenshots = 0 on this criterion. |
| 5 — Pool Comparison | Sonnet | Ranks relative to all other submissions in the event. Outputs percentile, pool rank, where project outperforms or underperforms. |
| 6 — Synthesis | Opus + Extended Thinking | Ingests all 5 pass outputs with 8,000-token thinking budget. Produces calibrated scores. Anchors: 9–10 = genuinely exceptional, 5–6 = average/competent, missing UI or no-show demo = 1–4 (not softened). |

**AI Screening Criteria:**

| Criterion | Weight | What it means |
|---|---|---|
| Innovation & Originality | 25% | How novel and surprising is the concept? |
| Technical Execution | 20% | Cleverness of the engineering |
| Functional Completeness | 20% | Does the core loop actually work? |
| Problem-Solution Fit | 20% | Solving a real problem convincingly |
| UX & Design | 5% | Visual polish and usability |
| Demo & Communication | 5% | How clearly the project is presented |
| Learning & Ambition | 5% | Did the team stretch themselves? |

### Phase 3 — Final Round (Top 8, Human Judges)
Human judges score each criterion out of 10. Portal normalizes by weights. AI scores shown as reference only.

**Final Round Criteria:**

| Criterion | Weight | Description |
|---|---|---|
| Innovation & Originality | 25% | How creative, fresh, or unexpected is the idea? Did they approach the problem in a new way, combine tools creatively, or build something meaningfully different from a standard solution? |
| Technical Execution | **25%** | How strong and difficult is the implementation? Reliable functionality, appropriate technologies, strong engineering decisions, clever architecture, clean integrations, effective AI use, ambitious features actually built. |
| Functional Completeness | 20% | Does the core experience work end-to-end? Strong teams identify the most important part and build a usable version instead of spreading effort across unfinished pieces. |
| Problem-Solution Fit | **15%** | Does the project solve a real or clearly defined problem? Target user, pain point, and why the solution is useful. |
| Demo & Communication | 5% | Explains problem, solution, technical approach, and what was built during the hackathon. |

> **Key shift:** Technical Execution rises from 20% (AI) → 25% (human). Problem-Solution Fit drops from 20% (AI) → 15% (human). Engineer the hell out of it to make the final round.

### Phase 4 — Results
Top 3 published on Competitions page. Leaderboard visible after admin approves. Winners in #announcements.

---

## Strategic Notes (for this event)

- **README is Pass 1 input** — write a real README before submission
- **Commit history is analyzed** — commit meaningfully throughout the build, not in one dump at the end
- **5 screenshots mandatory** — upload before deadline or UX = 0
- **Innovation Audit (Pass 3) checks for todo-app archetypes** — behavioral drift detection is genuinely novel; do not let the UI look like a basic task manager
- **Demo URL** — deploy to Vercel and submit the URL; "demo" criterion includes how clearly the project is presented
- **Synthesis uses Opus with extended thinking** — it will catch shallow implementations; the architecture needs to be real

---

## Judges

| Name | Role | Org | Lens |
|---|---|---|---|
| Oguzhan Dogru | Advanced Process Control Engineer | CruxOCM | AI-driven process control, reinforcement learning, computer vision, OT/SCADA, industrial automation — practical research-to-production lens for technical systems, ML workflows, high-impact demos. Also mentor. |
| Jia Ming Huang | Founder, Entrepreneur in Residence & Cursor Ambassador | Antler / Cursor | Startup, product, community, data science perspective from building ventures and organizing large builder events. Also mentor. |
| Cal Leung | Partner & AI Automation Strategist | New Era Intelligence Automation | AI workflow automation, platform support, policy strategy, campaigns, community building — practical operations and go-to-market lens for turning prototypes into useful systems. Also mentor. |
| Audrey Aui Yong | CEO & Co-Founder | Tsuin.AI | AI Digital Twin solutions for enterprises — project management, no-code development, startup strategy, enterprise AI implementation, product leadership. |
| Simon Loewen | Agribusiness AI Strategist & Cursor Ambassador | New Era Intelligence / Terralink Horticulture | Practical automation, business workflows, customer-facing systems, useful AI deployments across commercial horticulture. Also mentor. |
| Trystan Keller | Event Growth Strategist | Saleslink Strategies | Sales, demand generation, positioning, event marketing judgment — helping teams build authority and generate clients. |
| Anvil Palamattam | AI & Platform Cloud Architect | Google | Gemini, Google Cloud, Kubernetes, application modernization, cybersecurity, infrastructure — strong architecture, cloud engineering, production deployment judgment. Also mentor. |
| Suprita Shankar | Machine Learning Engineer, Foundation Models | Apple | Training data, ablations, model performance, production-scale knowledge extraction, entity resolution, Siri QA — deep ML systems, data-centric AI, startup engineering experience. Also mentor. |

---

## Build Log
*(appended during Stage 02 — short entries, not essays)*

| Time | Entry |
|---|---|
|  |  |

---

## Outcomes
*(written at Stage 03 gate or on close-out)*

- **Stage reached:**
- **What worked:**
- **What didn't:**
- **Result (if known):**

---

## Post-event compile status

- [ ] Post-mortem written to `shared/sources/2026-05-cursor-calgary-sait/post-mortem.md`
- [ ] Compile step run
- [ ] Contradictions resolved
