# Phone Materialise — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Step 5's single-column summary with a two-column layout — session recap on the left, a dark iPhone mockup on the right — where the phone materialises via a Framer Motion spring animation and the notification card fades up staggered inside it.

**Architecture:** All changes are contained in the Step 5 block of `src/app/page.tsx`. The existing `motion.div` step wrapper handles the whole-screen entry; two nested `motion.div` elements handle the phone materialise and notification card stagger independently. No new files, no new components, no API changes.

**Tech Stack:** React, Framer Motion 12 (already installed), inline styles (existing pattern in this file)

---

## Files

- Modify: `src/app/page.tsx` — Step 5 block only (lines ~306–338)

---

### Task 1: Replace Step 5 layout with two-column flex row

**Files:**
- Modify: `src/app/page.tsx`

This replaces the `<Section>` wrapper in Step 5 with a flex row. The left column gets all existing content. The right column is a placeholder `div` for now (phone shell comes in Task 2).

- [ ] **Step 1: Replace the Step 5 Section wrapper**

In `src/app/page.tsx`, find the Step 5 block (starts at `{/* ── Step 5: Summary ── */}`). Replace everything between the outer `<motion.div key="summary">` and its closing tag with:

```tsx
{/* ── Step 5: Summary ── */}
{step === "summary" && priorities && (
  <motion.div key="summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: "easeOut" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 48, maxWidth: 680 }}>

      {/* Left column — existing summary content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <h1 style={displayLg}>
            {priorities.protected_hours} hours protected<br />for your goals tonight.
          </h1>
          <p style={{ ...bodySm, marginTop: 16, lineHeight: 1.65 }}>
            {priorities.closing_message}
          </p>
        </div>

        <div style={card}>
          <p style={{ ...captionUpper, marginBottom: 16 }}>Session recap</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {drift && (
              <li style={bodySm}>
                Drift identified — {drift.unplanned_hours}h unplanned vs {drift.goal_directed_hours}h goal-directed
              </li>
            )}
            <li style={bodySm}>{priorities.items.length} priorities set for tonight</li>
            {decompose && (
              <li style={bodySm}>
                DS homework broken into 4 steps — first one is {decompose.subtasks[0].estimated_minutes}m
              </li>
            )}
          </ul>
        </div>

        <PillBtn onClick={reset} loading={false} label="Start over" outline />
      </div>

      {/* Right column — phone placeholder */}
      <div style={{ flexShrink: 0, width: 180, height: 200, background: "#111", borderRadius: 32 }} />

    </div>
  </motion.div>
)}
```

- [ ] **Step 2: Verify build is clean**

```bash
npm run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(step5): two-column layout scaffold with phone placeholder"
```

---

### Task 2: Build the phone shell

**Files:**
- Modify: `src/app/page.tsx`

Replace the placeholder `div` from Task 1 with the full iPhone shell — notch, lock screen time, home indicator. No notification card yet.

- [ ] **Step 1: Replace the phone placeholder with the shell**

Find the `{/* Right column — phone placeholder */}` comment in Step 5 and replace its `div` with:

```tsx
{/* Right column — phone shell */}
<div style={{
  flexShrink: 0,
  width: 180,
  background: "#111",
  borderRadius: 32,
  padding: "14px 10px 18px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
}}>
  {/* Notch */}
  <div style={{ width: 48, height: 5, background: "#222", borderRadius: 3, margin: "0 auto 12px" }} />

  {/* Lock screen time */}
  <div style={{ textAlign: "center", marginBottom: 10 }}>
    <div style={{ fontSize: 28, fontWeight: 200, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>10:42</div>
    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>Friday, May 23</div>
  </div>

  {/* Notification card placeholder */}
  <div style={{ background: "rgba(30,30,30,0.95)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "10px 12px", minHeight: 80 }} />

  {/* Home indicator */}
  <div style={{ width: 80, height: 4, background: "#333", borderRadius: 2, margin: "14px auto 0" }} />
</div>
```

- [ ] **Step 2: Verify build is clean**

```bash
npm run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(step5): add iPhone shell — notch, time, home indicator"
```

---

### Task 3: Build the notification card inside the shell

**Files:**
- Modify: `src/app/page.tsx`

Replace the notification card placeholder with the full card content — app icon, title, body copy, mint CTA line.

- [ ] **Step 1: Replace the notification card placeholder**

Find `{/* Notification card placeholder */}` in Step 5 and replace its `div` with:

```tsx
{/* Notification card */}
<div style={{
  background: "rgba(30,30,30,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "10px 12px",
}}>
  {/* App header */}
  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
    <div style={{
      width: 16, height: 16, borderRadius: 5, flexShrink: 0,
      background: "linear-gradient(135deg, #a7e5d3, #c8b8e0)",
    }} />
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.3px" }}>HALO</div>
    </div>
    <div style={{ marginLeft: "auto", fontSize: 8, color: "#555" }}>now</div>
  </div>

  {/* Title */}
  <div style={{ fontSize: 10, fontWeight: 600, color: "#fff", lineHeight: 1.4, marginBottom: 5 }}>
    You've been at The Hudson Pub for 3 hours.
  </div>

  {/* Body */}
  <div style={{ fontSize: 9, color: "#aaa", lineHeight: 1.5 }}>
    Sleep debt: 2.1h · DS assignment due 9 AM · Research paper: 12 days untouched.
  </div>

  {/* CTA */}
  <div style={{
    marginTop: 8, paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: 9, fontWeight: 700, color: "#a7e5d3",
  }}>
    Head home now → 3h still recoverable tonight.
  </div>
</div>
```

- [ ] **Step 2: Verify build is clean**

```bash
npm run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(step5): add Halo notification card content to phone shell"
```

---

### Task 4: Add materialise animation to the phone + staggered notification card

**Files:**
- Modify: `src/app/page.tsx`

Wrap the phone shell `div` in a `motion.div` with the materialise spring. Wrap the notification card `div` in a second `motion.div` with the staggered fade-up.

- [ ] **Step 1: Wrap the phone shell in a materialise motion.div**

Find `{/* Right column — phone shell */}` in Step 5. Replace the outer `<div style={{ flexShrink: 0, width: 180, ...` with a `motion.div`:

```tsx
{/* Right column — phone (materialise) */}
<motion.div
  style={{
    flexShrink: 0,
    width: 180,
    background: "#111",
    borderRadius: 32,
    padding: "14px 10px 18px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
  }}
  initial={{ scale: 0.88, opacity: 0, filter: "blur(6px)" }}
  animate={{ scale: 1,    opacity: 1, filter: "blur(0px)" }}
  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
>
```

Close it with `</motion.div>` where the phone shell `</div>` was.

- [ ] **Step 2: Wrap the notification card in a staggered motion.div**

Find `{/* Notification card */}` inside the phone shell. Wrap its outer `<div` with:

```tsx
<motion.div
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut", delay: 0.45 }}
>
  <div style={{
    background: "rgba(30,30,30,0.95)",
    ...
  }}>
    {/* ... card content unchanged ... */}
  </div>
</motion.div>
```

- [ ] **Step 3: Verify build is clean**

```bash
npm run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Start dev server and manually verify the animation**

```bash
npm run dev
```

Open `http://localhost:3000`. Click through all 5 steps to reach Step 5. Verify:
- Left column: heading, closing message, recap card, "Start over" button — all present
- Right column: dark iPhone appears with a spring snap and blur clearing
- Notification card fades up ~300ms after the phone lands
- Clicking "Start over" resets to Step 1 and the phone is gone

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(step5): materialise phone animation + staggered notification card"
```
