# Phone Materialise — Step 5 Design Spec

**Date:** 2026-05-23
**Branch:** feat/frontend-ui
**Scope:** `src/app/page.tsx`, Step 5 only

---

## Problem

Step 5 (the biometric accountability nudge) currently renders as a plain summary card. The demo context calls for judges to viscerally understand that Halo reaches users on their real devices — phone, smartwatch — in the moment. Without a visual representation of that, the delivery channel is invisible.

---

## Decision

Simulated device delivery. No real push infrastructure. A dark iPhone mockup renders alongside the session summary, animated into existence with a materialise effect. Judges see a phone appear with a Halo notification mid-demo — the wow without the demo risk.

---

## Layout

Step 5 switches from a single-column `Section` to a two-column flex row.

```
┌─────────────────────────┬──────────────────┐
│  Left (flex: 1)         │  Right (180px)   │
│                         │                  │
│  "3 hours protected     │  ┌────────────┐  │
│   for your goals        │  │ 10:42      │  │
│   tonight."             │  │            │  │
│                         │  │ 🔔 HALO    │  │
│  [Session recap card]   │  │ Pub · 3h   │  │
│                         │  │ ...        │  │
└─────────────────────────┴──────────────────┘
```

- Container: `display: flex`, `alignItems: center`, `gap: 48px`, `maxWidth: 680px`
- Left column: `flex: 1`, contains existing `displayLg` heading + closing message + recap card
- Right column: `flexShrink: 0`, `width: 180px`, the phone shell

---

## Phone Shell

Dark iPhone — no interactive elements, purely visual.

| Layer | Detail |
|---|---|
| Shell | `background: #111`, `borderRadius: 32px`, `padding: 14px 10px 18px`, `boxShadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)` |
| Notch | `width: 48px, height: 5px`, `background: #222`, centered |
| Lock screen time | `10:42` at `fontSize: 28px, fontWeight: 200`, muted date below |
| Notification card | `background: rgba(30,30,30,0.95)`, `borderRadius: 16px`, `border: 1px solid rgba(255,255,255,0.08)` |
| Home indicator | `width: 80px, height: 4px`, `background: #333` |

---

## Notification Card Content

```
┌─────────────────────────────────────┐
│ [◎ icon]  HALO              now     │
│                                     │
│ You've been at The Hudson Pub       │
│ for 3 hours.                        │
│                                     │
│ Sleep debt: 2.1h · DS due 9 AM ·   │
│ Research paper: 12 days untouched.  │
│ ─────────────────────────────────── │
│ Head home now → 3h still            │  ← mint green (#a7e5d3)
│ recoverable tonight.                │
└─────────────────────────────────────┘
```

- App icon: `16px × 16px`, `borderRadius: 5px`, `background: linear-gradient(135deg, #a7e5d3, #c8b8e0)` — matches Halo orb palette
- Title: `fontSize: 10px, fontWeight: 600, color: #fff`
- Body: `fontSize: 9px, color: #aaa`
- CTA line: `color: #a7e5d3, fontWeight: 600`, separated by a hairline `border-top: 1px solid rgba(255,255,255,0.06)`

---

## Animations

### Phone entry (materialise)

```ts
// motion.div wrapping the phone shell
initial={{ scale: 0.88, opacity: 0, filter: "blur(6px)" }}
animate={{ scale: 1,    opacity: 1, filter: "blur(0px)" }}
transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
```

- 150ms delay — left content lands first, phone appears after
- Spring overshoot gives it snap; `blur` clearing as it arrives reads as materialising from nothing
- Source: [Framer Motion spring transition](https://www.framer.com/motion/transition/#spring)

### Notification card entry (staggered fade-up)

```ts
// motion.div wrapping the notification card inside the phone
initial={{ opacity: 0, y: 6 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: "easeOut", delay: 0.45 }}
```

- 450ms total delay — phone materialises, then notification appears as if pushed by the OS
- Source: [Framer Motion animation](https://www.framer.com/motion/animation/)

### Existing step transition

The whole Step 5 screen still uses the existing `AnimatePresence` slide-up entry (`y: 16 → 0, opacity: 0 → 1`). The phone materialise is a nested animation inside it — both run, the step transition fires first.

---

## Implementation Constraints

- **Touch only `page.tsx`, Step 5 block.** No new files, no new components, no API changes.
- The two-column flex row replaces the existing `<Section>` wrapper for Step 5 only. All other steps keep `<Section>` unchanged.
- `motion.div` from `framer-motion` is already imported in `page.tsx` (added for step transitions).
- No props, no state, no data fetching. The phone content is hardcoded to Alex's demo data — same as the rest of the demo flow.
- The notification copy is static strings, not pulled from an API route.

---

## Out of Scope

- Real push notifications (Twilio, Expo, Web Push)
- Apple Watch mockup
- Animated notification text (typewriter, etc.)
- Dismiss / close interaction on the phone
- Any other step's layout
