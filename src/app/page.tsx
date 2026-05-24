"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import alexData from "@/data/demo/userProfile.json";
import scheduleData from "@/data/demo/schedule.json";
import telemetry from "@/data/demo/currentBehaviorTelemetry.json";
import pastWorkHistory from "@/data/demo/pastWorkHistory.json";
import humanLogs from "@/data/demo/humanLogs.json";
import ShellNudge from "@/components/ShellNudge";
import IntroScreen from "@/components/preamble/IntroScreen";
import CalendarDeliberation from "@/components/preamble/CalendarDeliberation";
import TaskDecomposePanel from "@/components/preamble/TaskDecomposePanel";
import FocusTimer from "@/components/FocusTimer";
import { mapSubtasksToSlots } from "@/lib/duration";
import type { DriftResponse, PriorityListResponse, DecomposeResponse, Schedule, Goal } from "@/lib/types";

type Step = "intro" | "request" | "drift" | "priorities" | "decompose" | "summary";
type JordanFollowUp = "none" | "typing" | "message";
type CalendarPhase = "week" | "day" | "deliberate";

// ── Design tokens ─────────────────────────────────────────────────────────────
const t = {
  canvas:        "#f5f5f5",
  surfaceStrong: "#f0efed",
  primary:       "#292524",
  onPrimary:     "#ffffff",
  ink:           "#0c0a09",
  body:          "#4e4e4e",
  bodyStrong:    "#292524",
  muted:         "#777169",
  mutedSoft:     "#a8a29e",
  hairline:      "#e7e5e4",
  hairlineStrong:"#d6d3d1",
  orbMint:       "#a7e5d3",
  orbPeach:      "#f4c5a8",
  orbLavender:   "#c8b8e0",
} as const;

const dk = {
  bg:         "rgba(12, 10, 9, 0.94)",
  bgSoft:     "rgba(22, 20, 18, 0.90)",
  border:     "rgba(255,255,255,0.08)",
  borderSoft: "rgba(255,255,255,0.04)",
  text:       "#f5f4f2",
  textMuted:  "#8a8580",
  textDim:    "#5a5550",
  mint:       "#a7e5d3",
  mintDim:    "rgba(167,229,211,0.12)",
  red:        "#e8745a",
  redDim:     "rgba(232,116,90,0.14)",
} as const;

// ── Framer variants ───────────────────────────────────────────────────────────
// Inline animation props for step panels (avoids v12 Variants typing strictness)
const panelIn  = { opacity: 1, y: 0,   filter: "blur(0px)"  };
const panelOut = { opacity: 0, y: -10, filter: "blur(6px)"  };
const panelHidden = { opacity: 0, y: 14, filter: "blur(8px)" };
const panelTransition = { duration: 0.28, ease: "easeOut" as const };
const panelExitTransition = { duration: 0.2, ease: "easeIn" as const };
const layoutTween = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

// Panels emerge from the phone center, then settle left (calendar) or right (overlay).
const PHONE_PANEL_GAP = 16;
const PHONE_WIDTH = 264;
const CALENDAR_WIDTH = 340;
const OVERLAY_WIDTH = 380;
const slideFromPhoneEase = [0.22, 1, 0.36, 1] as const;
const calendarFromPhoneX = PHONE_PANEL_GAP + PHONE_WIDTH / 2 + CALENDAR_WIDTH / 2;
const overlayFromPhoneX = -(PHONE_PANEL_GAP + PHONE_WIDTH / 2 + OVERLAY_WIDTH / 2);
const slideFromPhoneTransition = { duration: 0.58, ease: slideFromPhoneEase };

// Jordan → Halo overlay → calendar (left panel) demo sequence
const JORDAN_MESSAGE_MS = 1400;
const OVERLAY_AFTER_MESSAGE_MS = 1800;
const CALENDAR_AFTER_OVERLAY_MS = 1500;
const CALENDAR_SHELL_TO_CONTENT_MS = 320;
const WEEK_VIEW_DWELL_MS = 2700;
const DELIBERATE_AFTER_DAY_MS = 1800;
const OVERLAY_BODY_DELAY_MS = 430;
const OVERLAY_CTA_DELAY_MS = 1080;

function jordanDemoTiming() {
  const overlayAt = JORDAN_MESSAGE_MS + OVERLAY_AFTER_MESSAGE_MS;
  const calendarAt = overlayAt + CALENDAR_AFTER_OVERLAY_MS;
  const calendarContentAt = calendarAt + CALENDAR_SHELL_TO_CONTENT_MS;
  const dayZoomAt = calendarContentAt + WEEK_VIEW_DWELL_MS;
  const deliberateAt = dayZoomAt + DELIBERATE_AFTER_DAY_MS;
  return {
    overlayAt,
    calendarAt,
    calendarContentAt,
    dayZoomAt,
    deliberateAt,
    bodyAt: overlayAt + OVERLAY_BODY_DELAY_MS,
    ctaAt: overlayAt + OVERLAY_CTA_DELAY_MS,
  };
}

const staggerList = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const staggerItem = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1,  x: 0, transition: { type: "spring" as const, stiffness: 340, damping: 26 } },
};

const bubbleFromLeft = {
  hidden: { opacity: 0, x: -14, scale: 0.92 },
  show:   { opacity: 1,  x: 0,  scale: 1, transition: { type: "spring" as const, stiffness: 320, damping: 22 } },
};

const bubbleFromRight = {
  hidden: { opacity: 0, x: 14, scale: 0.88 },
  show:   { opacity: 1,  x: 0,  scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 20 } },
};

// ── Caption style ─────────────────────────────────────────────────────────────
const captionUpper: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: "0.88px",
  textTransform: "uppercase", color: dk.textMuted,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [step, setStep]               = useState<Step>("intro");
  const [demoStarted, setDemoStarted] = useState(false);
  const [drift, setDrift]             = useState<DriftResponse | null>(null);
  const [priorities, setPriorities]   = useState<PriorityListResponse | null>(null);
  const [decompose, setDecompose]     = useState<DecomposeResponse | null>(null);
  const [loading, setLoading]         = useState(false);
  const [nudgeData, setNudgeData]     = useState<{ nudge: string; severity: string; do_not_disturb?: boolean } | null>(null);
  const [focusTimerOpen, setFocusTimerOpen] = useState(false);
  const [focusTaskTitle, setFocusTaskTitle] = useState<string | undefined>();
  const [demoMode, setDemoMode]       = useState<boolean>(() => {
    try { return localStorage.getItem("halo_demo_mode") === "true"; } catch { return false; }
  });
  const [messageArrived, setMessageArrived] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [alexReplied,    setAlexReplied]    = useState(false);
  const [phoneVisible,   setPhoneVisible]   = useState(false);
  const [jordanFollowUp, setJordanFollowUp] = useState<JordanFollowUp>("none");
  const [reqBody,        setReqBody]        = useState(false);
  const [reqCTA,         setReqCTA]         = useState(false);
  const [calendarPhase,  setCalendarPhase]  = useState<CalendarPhase>("week");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarContentReady, setCalendarContentReady] = useState(false);
  const [driftReady, setDriftReady] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const phoneSequenceRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = scheduleData as Schedule;

  function clearPhoneSequence() {
    phoneSequenceRef.current.forEach(clearTimeout);
    phoneSequenceRef.current = [];
  }

  function schedulePhoneDismiss(data: DecomposeResponse) {
    clearPhoneSequence();
    setDecompose(data);
    setAlexReplied(true);
    setJordanFollowUp("typing");
    phoneSequenceRef.current.push(
      setTimeout(() => setJordanFollowUp("message"), 1400),
      setTimeout(() => {
        setPhoneVisible(false);
        setStep("decompose");
        setLoading(false);
      }, 4400), // 1.4s Jordan reply + 3s linger
    );
  }

  useEffect(() => () => clearPhoneSequence(), []);

  function beginDemo() {
    setDemoStarted(true);
    setStep("request");
    setPhoneVisible(true);
  }

  function openFocusTimer(index = 0) {
    const title = decompose?.subtasks[index]?.title;
    setFocusTaskTitle(title);
    setFocusTimerOpen(true);
  }

  function resetDemo() {
    clearPhoneSequence();
    setShowLanding(true);
    setStep("intro");
    setDemoStarted(false);
    setDrift(null);
    setPriorities(null);
    setDecompose(null);
    setAlexReplied(false);
    setPhoneVisible(false);
    setJordanFollowUp("none");
    setMessageArrived(false);
    setOverlayVisible(false);
    setReqBody(false);
    setReqCTA(false);
    setCalendarPhase("week");
    setCalendarVisible(false);
    setCalendarContentReady(false);
    setDriftReady(false);
    setNudgeDismissed(false);
    setNudgeData(null);
    setFocusTimerOpen(false);
    setFocusTaskTitle(undefined);
  }

  // Jordan sequence: message → Before you reply overlay. Calendar appears on button press.
  useEffect(() => {
    if (!demoStarted) return;
    const t = jordanDemoTiming();
    setCalendarPhase("week");
    setCalendarVisible(false);
    setCalendarContentReady(false);
    const tMsg     = setTimeout(() => setMessageArrived(true), JORDAN_MESSAGE_MS);
    const tOverlay = setTimeout(() => setOverlayVisible(true), t.overlayAt);
    const tBody    = setTimeout(() => setReqBody(true), t.bodyAt);
    const tCTA     = setTimeout(() => setReqCTA(true), t.ctaAt);
    return () => {
      clearTimeout(tMsg);
      clearTimeout(tOverlay);
      clearTimeout(tBody);
      clearTimeout(tCTA);
    };
  }, [demoStarted]);

  // Alex replies to Jordan after the plan is generated
  useEffect(() => {
    if (step !== "priorities") return;
    const t = setTimeout(() => setAlexReplied(true), 1200);
    return () => clearTimeout(t);
  }, [step]);

  function toggleDemoMode() {
    const next = !demoMode;
    setDemoMode(next);
    try { localStorage.setItem("halo_demo_mode", String(next)); } catch {}
  }

  async function post<T>(url: string, body: object): Promise<T> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  async function handleNext() {
    if (step === "request") {
      if (driftReady) {
        // User clicked "View Summary" — advance to drift
        setStep("drift");
        return;
      }
      setLoading(true);
      // Show calendar when "Analyze my week" is pressed
      setCalendarVisible(true);
      setTimeout(() => setCalendarContentReady(true), CALENDAR_SHELL_TO_CONTENT_MS);
      const tDay        = setTimeout(() => setCalendarPhase("day"), CALENDAR_SHELL_TO_CONTENT_MS + WEEK_VIEW_DWELL_MS);
      const tDeliberate = setTimeout(() => setCalendarPhase("deliberate"), CALENDAR_SHELL_TO_CONTENT_MS + WEEK_VIEW_DWELL_MS + DELIBERATE_AFTER_DAY_MS);
      const data = await post<DriftResponse>("/api/drift", {
        goals: alexData.goals,
        commitments: alexData.commitments,
        telemetry,
        pastWorkHistory,
        drift_context: alexData.drift_context,
      });
      clearTimeout(tDay);
      clearTimeout(tDeliberate);
      setDrift(data);
      setDriftReady(true);
      setLoading(false);
      // Stay on "request" step — user must press "View Summary" to continue
    } else if (step === "drift") {
      setLoading(true);
      const [data, nudgeRes] = await Promise.all([
        post<PriorityListResponse>("/api/priorities", { goals: alexData.goals, commitments: alexData.commitments }),
        post<{ nudge: string; severity: string; do_not_disturb?: boolean }>("/api/nudge", {
          telemetry,
          humanLogs,
          demo_mode: demoMode,
        }),
      ]);
      setPriorities(data);
      if (nudgeRes?.nudge && !nudgeRes.do_not_disturb) {
        setNudgeData(nudgeRes);
        setNudgeDismissed(false);
      } else {
        setNudgeData(null);
        setNudgeDismissed(true);
      }
      setStep("priorities");
      setLoading(false);
    } else if (step === "priorities") {
      setLoading(true);
      const data = await post<DecomposeResponse>("/api/decompose", { task_title: alexData.stalled_item.goal_title, goal: alexData.goals[1].title });
      schedulePhoneDismiss(data);
    } else if (step === "decompose") {
      setStep("summary");
    } else {
      resetDemo();
    }
  }

  const stepLabel: Record<Step, string> = {
    intro:      "Alex's week",
    request:    "Before you reply",
    drift:      "Here's where your week went",
    priorities: "Tonight's plan",
    decompose:  "DS homework, made small",
    summary:    "You're back on track",
  };
  const nextLabel: Record<Step, string> = {
    intro:      "Continue",
    request:    "Analyze my week",
    drift:      "Plan tonight",
    priorities: "Break down DS homework",
    decompose:  "Close session",
    summary:    "Start over",
  };
  const loadingLabel: Record<Step, string> = {
    intro:      "Loading…",
    request:    "Calculating drift…",
    drift:      "Building tonight's plan…",
    priorities: "Breaking down your work…",
    decompose:  "Finishing up…",
    summary:    "Resetting…",
  };

  const unplannedHours = alexData.commitments.filter(c => !c.is_goal_directed).reduce((s, c) => s + c.hours, 0);
  const showShellNudge = step === "priorities" && !!nudgeData && !nudgeDismissed;
  const overlayStepLabel = showShellNudge ? "Halo nudge" : stepLabel[step];

  return (
    <>
    <AnimatePresence mode="wait">
    {showLanding ? (
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ minHeight: "100vh", background: t.canvas, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}
      >
        {/* Atmospheric orbs */}
        <div className="orb" style={{ width: 560, height: 560, top: -160, right: -100, background: `radial-gradient(circle, ${t.orbMint}, transparent)`, opacity: 0.5 }} />
        <div className="orb" style={{ width: 420, height: 420, bottom: 60, left: -160, background: `radial-gradient(circle, ${t.orbPeach}, transparent)`, opacity: 0.42, animationDelay: "7s" }} />
        <div className="orb" style={{ width: 320, height: 320, top: "40%", left: "40%", background: `radial-gradient(circle, ${t.orbLavender}, transparent)`, opacity: 0.30, animationDelay: "14s" }} />

        {/* Wordmark top-left */}
        <div style={{ position: "relative", padding: "22px 40px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.96px", textTransform: "uppercase", color: t.mutedSoft }}>Halo</span>
        </div>

        {/* Center stage */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px 80px", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
          >
            {/* Logotype */}
            <h1 style={{
              fontFamily: "var(--font-eb-garamond), serif",
              fontSize: "clamp(72px, 12vw, 112px)",
              fontWeight: 400,
              color: t.ink,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
              Halo
            </h1>

            {/* Motto */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.38 }}
              style={{
                fontFamily: "var(--font-eb-garamond), serif",
                fontSize: "clamp(16px, 2.4vw, 22px)",
                fontWeight: 400,
                color: t.muted,
                letterSpacing: "0.01em",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              Amplifying Human Potential
            </motion.p>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
              style={{ width: 40, height: 1, background: t.hairlineStrong, transformOrigin: "center" }}
            />

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.72 }}
              whileHover={{ background: t.ink, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowLanding(false)}
              style={{
                marginTop: 4,
                padding: "13px 36px",
                borderRadius: 9999,
                border: "none",
                background: t.primary,
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: "0.08px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(41,37,36,0.18)",
              }}
            >
              See the demo →
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    ) : (
    <motion.div
      key="app"
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <div style={{ minHeight: "100vh", background: t.canvas, overflow: "hidden", position: "relative" }}>

      {/* Atmospheric orbs */}
      <div className="orb" style={{ width: 500, height: 500, top: -120, right: -80,  background: `radial-gradient(circle, ${t.orbMint}, transparent)`,    opacity: 0.45 }} />
      <div className="orb" style={{ width: 380, height: 380, top: "50%", left: -140, background: `radial-gradient(circle, ${t.orbPeach}, transparent)`,   opacity: 0.40, animationDelay: "7s" }} />
      <div className="orb" style={{ width: 300, height: 300, bottom: 40, right: "22%", background: `radial-gradient(circle, ${t.orbLavender}, transparent)`, opacity: 0.35, animationDelay: "14s" }} />

      {/* Header */}
      <header style={{
        position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 40px", borderBottom: `1px solid ${t.hairline}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.96px", textTransform: "uppercase", color: t.mutedSoft }}>Halo</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: t.bodyStrong }}>{alexData.user.name}</span>
            <span style={{ fontSize: 13, color: t.muted }}>· SAIT · CIS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12, color: t.muted }}>Demo</span>
            <button
              onClick={toggleDemoMode}
              style={{
                padding: "4px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
                border: `1px solid ${t.hairlineStrong}`,
                background: demoMode ? t.primary : "transparent",
                color: demoMode ? t.onPrimary : t.muted,
                cursor: "pointer",
              }}
            >
              {demoMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </header>

      {/* Main split */}
      <main style={{
        position: "relative",
        display: "flex", alignItems: step === "intro" ? "flex-start" : "center", justifyContent: "center",
        gap: 40, padding: step === "intro" ? "32px 40px 64px" : "48px 40px 64px",
        minHeight: "calc(100vh - 61px)",
        flexWrap: "wrap",
      }}>
        {step === "intro" ? (
          <IntroScreen
            profile={alexData as React.ComponentProps<typeof IntroScreen>["profile"]}
            schedule={schedule}
            pastWorkHistory={pastWorkHistory}
            telemetry={telemetry}
            stalledItem={alexData.stalled_item}
            onContinue={beginDemo}
          />
        ) : (
        <LayoutGroup id="halo-stage">
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: step === "request" ? 1120 : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: step === "request" ? 0 : 40,
          flexWrap: step === "request" ? "nowrap" : "wrap",
          minHeight: step === "request" ? 460 : undefined,
        }}>
        <AnimatePresence>
          {phoneVisible && step === "request" && calendarVisible && (
            <motion.div
              key="calendar-slot"
              initial={{ opacity: 0, x: calendarFromPhoneX, y: "-50%", filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, y: "-50%", filter: "blur(0px)" }}
              exit={{ opacity: 0, x: calendarFromPhoneX * 0.4, y: "-50%", filter: "blur(8px)" }}
              transition={slideFromPhoneTransition}
              style={{
                position: "absolute",
                right: "calc(50% + 148px)",
                top: "50%",
                zIndex: 1,
              }}
            >
              <CalendarDeliberation
                schedule={schedule}
                goals={alexData.goals as Goal[]}
                pastWorkHistory={pastWorkHistory}
                telemetry={telemetry}
                phase={calendarPhase}
                contentReady={calendarContentReady}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
        <AnimatePresence mode="popLayout">
          {phoneVisible && (
            <PhoneMockup
              key="phone"
              step={step}
              messageArrived={messageArrived}
              alexReplied={alexReplied}
              jordanFollowUp={jordanFollowUp}
            />
          )}
        </AnimatePresence>
        </div>

        {/* ── Halo overlay — request: slides in from right; later steps: from below ── */}
        <AnimatePresence>
        {overlayVisible && (
        <LayoutGroup id="halo-overlay">
        <div
          style={
            step === "request"
              ? {
                  position: "absolute",
                  left: "calc(50% + 148px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1,
                }
              : undefined
          }
        >
        <motion.div
          layout
          initial={
            step === "request"
              ? { opacity: 0, x: overlayFromPhoneX, filter: "blur(10px)" }
              : { opacity: 0, y: 24, filter: "blur(10px)" }
          }
          animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
          exit={step === "request" ? { opacity: 0, x: overlayFromPhoneX * 0.35 } : { opacity: 0, y: 12 }}
          transition={
            step === "request"
              ? slideFromPhoneTransition
              : { duration: 0.18, ease: "easeOut", layout: layoutTween }
          }
          style={{
          width: 380, flexShrink: 0,
          background: dk.bg,
          backdropFilter: "blur(24px) saturate(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          border: `1px solid ${dk.border}`,
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
        }}>

          {/* Overlay header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 20px", borderBottom: `1px solid ${dk.borderSoft}`,
            background: "rgba(255,255,255,0.025)",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${dk.mint}, ${t.orbLavender})`,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.88px", textTransform: "uppercase", color: dk.text }}>Halo</span>
            <span style={{ fontSize: 11, color: dk.textDim, marginLeft: 2 }}>·</span>
            {/* Step label crossfades */}
            <div style={{ position: "relative", height: 18, flex: 1, overflow: "hidden" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={overlayStepLabel}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{
                    fontSize: 12,
                    color: step === "drift" ? dk.mint : dk.textMuted,
                    fontStyle: step === "drift" ? "italic" : "normal",
                    position: "absolute",
                    whiteSpace: "nowrap",
                  }}
                >
                  {overlayStepLabel}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Overlay content */}
          <motion.div layout transition={{ layout: layoutTween }} style={{ padding: "20px 20px 0" }}>
            <AnimatePresence mode="wait">

              {step === "request" && (
                <motion.div key="request" layout exit={panelOut} transition={{ duration: 0.2, ease: "easeIn", layout: layoutTween }}>
                  {/* Body tweens down as a unit; contents animate inside with delays */}
                  {reqBody && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.36, ease: "easeOut", layout: layoutTween }}
                      style={{ display: "flex", flexDirection: "column", gap: 14 }}
                    >
                      {/* Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.34, duration: 0.22, ease: "easeOut" }}
                      >
                        <AlertBadge label="+3h requested" />
                      </motion.div>

                      {/* Headline + subline: word-by-word from bottom up */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <AnimatedWords
                          lines={[`${unplannedHours} unplanned hours`, "this week."]}
                          lineStyle={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-eb-garamond), serif", color: dk.text, lineHeight: 1.25, letterSpacing: "-0.22px" }}
                          delay={0.40}
                        />
                        <AnimatedWords
                          lines={[`Research paper: ${alexData.goals[0].academic_metrics.days_since_active_engagement} days without a session.`]}
                          lineStyle={{ fontSize: 13, color: dk.textMuted, lineHeight: 1.55 }}
                          delay={0.72}
                        />
                      </div>

                      {/* Goal rows: right to left */}
                      <motion.div
                        initial="hidden" animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.90 } } }}
                        style={{ display: "flex", flexDirection: "column", gap: 8 }}
                      >
                        {alexData.goals.map((g) => (
                          <motion.div key={g.id}
                            variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 320, damping: 26 } } }}
                            style={{
                              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                              padding: "9px 12px", borderRadius: 10,
                              background: g.academic_metrics.days_since_active_engagement > 5 ? dk.redDim : dk.mintDim,
                              border: `1px solid ${g.academic_metrics.days_since_active_engagement > 5 ? "rgba(232,116,90,0.18)" : "rgba(167,229,211,0.12)"}`,
                            }}
                          >
                            <span style={{ fontSize: 13, color: dk.text, lineHeight: 1.35, flex: 1, minWidth: 0 }}>
                              {g.title}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: g.academic_metrics.days_since_active_engagement > 5 ? dk.red : dk.mint, whiteSpace: "nowrap", flexShrink: 0 }}>
                              {g.academic_metrics.days_since_active_engagement}d ago
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* CTA slot reserved on body mount; button fades in later without resizing panel */}
                      <motion.div
                        layout
                        transition={{ layout: layoutTween }}
                        style={{ paddingTop: 8, paddingBottom: 20 }}
                      >
                        <AnimatePresence>
                          {loading && <LoadingLine key="req-loading-line" />}
                        </AnimatePresence>
                        <motion.div
                          initial={false}
                          animate={{ opacity: reqCTA ? 1 : 0, y: reqCTA ? 0 : 6 }}
                          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                          style={{ pointerEvents: reqCTA ? "auto" : "none" }}
                        >
                          <OverlayBtn onClick={handleNext} loading={loading} label={driftReady ? "View Summary" : nextLabel["request"]} loadingText={loadingLabel["request"]} />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === "drift" && drift && (
                <motion.div key="drift" initial={panelHidden} animate={panelIn} exit={panelOut} transition={panelTransition}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <DarkStat label="Unplanned" value={`${drift.unplanned_hours}h`} accent={dk.red} />
                    <DarkStat label="Goal-directed" value={`${drift.goal_directed_hours}h`} accent={dk.mint} />
                  </div>
                  {drift.stalled_goals.length > 0 && (
                    <motion.div variants={staggerList} initial="hidden" animate="show">
                      <p style={{ ...captionUpper, marginBottom: 8 }}>Stalled</p>
                      {drift.stalled_goals.map((sg, i) => (
                        <motion.div key={i} variants={staggerItem} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                          padding: "7px 0",
                          borderBottom: i < drift.stalled_goals.length - 1 ? `1px solid ${dk.borderSoft}` : "none",
                        }}>
                          <span style={{ fontSize: 13, color: dk.text, lineHeight: 1.35, flex: 1, minWidth: 0 }}>
                            {sg.goal_title}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: dk.red, whiteSpace: "nowrap", flexShrink: 0 }}>{sg.days_since_activity}d ago</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  <p style={{ fontSize: 13, color: dk.textMuted, lineHeight: 1.6, margin: 0, borderTop: `1px solid ${dk.borderSoft}`, paddingTop: 12 }}>
                    {drift.message}
                  </p>
                </motion.div>
              )}

              {showShellNudge && nudgeData && (
                <ShellNudge
                  key="shell-nudge"
                  nudge={nudgeData.nudge}
                  severity={nudgeData.severity}
                  onDismiss={() => setNudgeDismissed(true)}
                  onStartFocus={() => openFocusTimer(0)}
                />
              )}

              {step === "priorities" && priorities && !showShellNudge && (
                <motion.div key="priorities" initial={panelHidden} animate={panelIn} exit={panelOut} transition={panelTransition}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-eb-garamond), serif", color: dk.mint, letterSpacing: "-0.22px" }}>
                      {priorities.protected_hours}h
                    </span>
                    <span style={{ fontSize: 13, color: dk.textMuted }}>protected for your goals tonight.</span>
                  </div>
                  <motion.div variants={staggerList} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {priorities.items.map((item, i) => (
                      <motion.div key={i} variants={staggerItem} style={{
                        display: "flex", gap: 10, alignItems: "flex-start",
                        padding: "10px 12px", borderRadius: 10,
                        background: dk.bgSoft, border: `1px solid ${dk.borderSoft}`,
                      }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          background: "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: dk.textDim,
                        }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: dk.text, margin: 0, lineHeight: 1.3 }}>{item.title}</p>
                          <p style={{ fontSize: 12, color: dk.textMuted, margin: "3px 0 0", lineHeight: 1.4 }}>{item.rationale}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: dk.textDim, whiteSpace: "nowrap" }}>{item.estimated_minutes}m</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {step === "decompose" && decompose && (
                <motion.div key="decompose" initial={panelHidden} animate={panelIn} exit={panelOut} transition={panelTransition}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 13, color: dk.textMuted, lineHeight: 1.6, margin: 0 }}>{decompose.nudge}</p>
                  <TaskDecomposePanel
                    subtasks={decompose.subtasks}
                    slots={mapSubtasksToSlots(decompose.subtasks)}
                    onStartFocus={() => openFocusTimer(0)}
                  />
                  <p style={{ fontSize: 12, color: dk.textMuted, borderTop: `1px solid ${dk.borderSoft}`, paddingTop: 12, margin: 0 }}>
                    First step: 20 minutes. Set a timer now.
                  </p>
                </motion.div>
              )}

              {step === "summary" && priorities && (
                <motion.div key="summary" initial={panelHidden} animate={panelIn} exit={panelOut} transition={panelTransition}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-eb-garamond), serif", color: dk.text, lineHeight: 1.25, letterSpacing: "-0.22px", margin: 0 }}>
                    You&apos;re back on track.
                  </p>
                  <motion.div variants={staggerList} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {drift && (
                      <motion.div variants={staggerItem}>
                        <SummaryRow label="Drift surfaced" value={`${drift.unplanned_hours}h unplanned → ${drift.goal_directed_hours}h goal-directed`} />
                      </motion.div>
                    )}
                    <motion.div variants={staggerItem}>
                      <SummaryRow label="Priorities set" value={`${priorities.items.length} items · ${priorities.protected_hours}h protected`} />
                    </motion.div>
                    {decompose && (
                      <motion.div variants={staggerItem}>
                        <SummaryRow label="DS homework" value={`4 steps · first one is ${decompose.subtasks[0].estimated_minutes}m`} />
                      </motion.div>
                    )}
                  </motion.div>
                  <p style={{ fontSize: 13, color: dk.textMuted, lineHeight: 1.6, margin: 0 }}>
                    {priorities.closing_message}
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* CTA — request step handles its own CTA inside the body; only non-request steps use this */}
          <AnimatePresence>
            {step !== "request" && !showShellNudge && (
              <motion.div
                key={step}
                layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.22, ease: "easeOut", layout: layoutTween }}
                style={{ padding: "16px 20px 20px" }}
              >
                <AnimatePresence>
                  {loading && <LoadingLine key="loading-line" />}
                </AnimatePresence>
                <OverlayBtn onClick={handleNext} loading={loading} label={nextLabel[step]} loadingText={loadingLabel[step]} />
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
        </div>
        </LayoutGroup>
        )}
        </AnimatePresence>
        </div>
        </LayoutGroup>
        )}
      </main>
    </div>
    </motion.div>
    )}
    </AnimatePresence>

    <FocusTimer
      open={focusTimerOpen}
      taskTitle={focusTaskTitle}
      onClose={() => setFocusTimerOpen(false)}
      onComplete={() => setFocusTimerOpen(false)}
    />
    </>
  );
}

// ── Phone mockup ───────────────────────────────────────────────────────────────
const PHONE_SCREEN_HEIGHT = 420;

function PhoneMockup({
  step,
  messageArrived,
  alexReplied,
  jordanFollowUp,
}: {
  step: Step;
  messageArrived: boolean;
  alexReplied: boolean;
  jordanFollowUp: JordanFollowUp;
}) {
  const showAlexTyping = step === "priorities" && !alexReplied && jordanFollowUp === "none";
  const showReply      = alexReplied;
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messageArrived, showAlexTyping, showReply, jordanFollowUp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.92, filter: "blur(10px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 264, flexShrink: 0,
        background: "#111", borderRadius: 40,
        padding: "16px 10px 20px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Notch */}
      <div style={{ width: 72, height: 6, background: "#000", borderRadius: 4, margin: "0 auto 10px", border: "1px solid #222" }} />

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px 10px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>10:41</span>
        <div style={{ width: 14, height: 8, borderRadius: 2, border: "1px solid rgba(255,255,255,0.4)", position: "relative" }}>
          <div style={{ position: "absolute", inset: "1px", right: 3, background: "#fff", borderRadius: 1 }} />
        </div>
      </div>

      {/* Messages screen — fixed height; thread scrolls inside */}
      <div style={{
        background: "#fff", borderRadius: 28, overflow: "hidden",
        display: "flex", flexDirection: "column", height: PHONE_SCREEN_HEIGHT,
      }}>

        {/* iMessage chrome */}
        <div style={{ flexShrink: 0, background: "rgba(245,245,247,0.96)", backdropFilter: "blur(12px)", padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #5e72e4, #825ee4)", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>J</div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111" }}>Jordan (AI Club)</p>
          <p style={{ margin: 0, fontSize: 10, color: "#8e8e93" }}>iMessage</p>
        </div>

        {/* Bubbles — scrollable thread */}
        <div
          ref={threadRef}
          style={{
            flex: 1, minHeight: 0, overflowY: "auto",
            padding: "12px 10px", display: "flex", flexDirection: "column", gap: 8,
            background: "#fff",
            WebkitOverflowScrolling: "touch",
          }}
        >

          <AnimatePresence>
            {messageArrived && (
              <motion.p
                key="ts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: "center", fontSize: 10, color: "#8e8e93", margin: "4px 0" }}
              >
                Today 10:38 AM
              </motion.p>
            )}
          </AnimatePresence>

          {/* Jordan: typing indicator → message */}
          <AnimatePresence mode="wait">
            {!messageArrived ? (
              /* Jordan typing */
              <motion.div
                key="jordan-typing"
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 22 } }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                style={{ alignSelf: "flex-start" }}
              >
                <div style={{ background: "#e5e5ea", borderRadius: "18px 18px 18px 4px", padding: "9px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "#8e8e93" }}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Jordan's message springs in */
              <motion.div
                key="jordan-message"
                variants={bubbleFromLeft}
                initial="hidden"
                animate="show"
                style={{ alignSelf: "flex-start", maxWidth: "82%" }}
              >
                <div style={{ background: "#e5e5ea", borderRadius: "18px 18px 18px 4px", padding: "9px 12px" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#111", lineHeight: 1.4 }}>
                    Hey Alex! Can you help set up the AI club booth at the campus fair tomorrow? Should take about 3 hours 🙌
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alex: typing / reply */}
          <AnimatePresence mode="wait">
            {showAlexTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 22 } }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                style={{ alignSelf: "flex-end" }}
              >
                <div style={{ background: "#e5e5ea", borderRadius: "18px 18px 4px 18px", padding: "9px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "#8e8e93" }}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {showReply && (
              <motion.div
                key="reply"
                variants={bubbleFromRight}
                initial="hidden"
                animate="show"
                style={{ alignSelf: "flex-end", maxWidth: "82%" }}
              >
                <div style={{ background: "#007aff", borderRadius: "18px 18px 4px 18px", padding: "9px 12px" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#fff", lineHeight: 1.4 }}>
                    Hey! I&apos;d love to but I&apos;ve got a deadline tonight — research paper and DS homework need attention. Maybe next time? 🙏
                  </p>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ margin: "4px 0 0", fontSize: 10, color: "#8e8e93", textAlign: "right" }}
                >
                  Delivered
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Jordan follow-up after Alex declines */}
          <AnimatePresence mode="wait">
            {jordanFollowUp === "typing" && (
              <motion.div
                key="jordan-followup-typing"
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 22 } }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                style={{ alignSelf: "flex-start" }}
              >
                <div style={{ background: "#e5e5ea", borderRadius: "18px 18px 18px 4px", padding: "9px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "#8e8e93" }}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {jordanFollowUp === "message" && (
              <motion.div
                key="jordan-followup-message"
                variants={bubbleFromLeft}
                initial="hidden"
                animate="show"
                style={{ alignSelf: "flex-start", maxWidth: "82%" }}
              >
                <div style={{ background: "#e5e5ea", borderRadius: "18px 18px 18px 4px", padding: "9px 12px" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#111", lineHeight: 1.4 }}>
                    No worries, totally get it! Good luck with the paper tonight 💪
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Input bar */}
        <div style={{
          flexShrink: 0,
          padding: "8px 10px", borderTop: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(245,245,247,0.96)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 18, padding: "7px 12px", fontSize: 13, color: "#8e8e93" }}>
            {showReply ? "" : "iMessage"}
          </div>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: showReply ? "#007aff" : "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 6.5L6.5 1.5L11.5 6.5M6.5 2V11.5" stroke={showReply ? "#fff" : "#8e8e93"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div style={{ width: 90, height: 4, background: "#333", borderRadius: 2, margin: "12px auto 0" }} />
    </motion.div>
  );
}

// ── Shared overlay sub-components ─────────────────────────────────────────────

function AnimatedWords({ lines, lineStyle, delay = 0 }: {
  lines: string[];
  lineStyle?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: delay } } }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "block", ...lineStyle }}>
          {line.split(" ").map((word, wi) => (
            <motion.span
              key={`${li}-${wi}`}
              style={{ display: "inline-block", marginRight: "0.28em" }}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 28 } },
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      ))}
    </motion.div>
  );
}

function AlertBadge({ label }: { label: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 9999, alignSelf: "flex-start",
      background: dk.redDim, border: "1px solid rgba(232,116,90,0.2)",
    }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: dk.red }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: dk.red, letterSpacing: "0.3px" }}>{label}</span>
    </div>
  );
}

function DarkStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: dk.bgSoft, borderRadius: 10, padding: "12px 14px", border: `1px solid ${dk.borderSoft}` }}>
      <p style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px", color: accent, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ ...captionUpper, marginTop: 4 }}>{label}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "9px 12px", borderRadius: 9, background: dk.bgSoft, border: `1px solid ${dk.borderSoft}` }}>
      <span style={{ ...captionUpper, fontSize: 10 }}>{label}</span>
      <span style={{ fontSize: 13, color: dk.text }}>{value}</span>
    </div>
  );
}

function LoadingLine() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ marginBottom: 10, borderRadius: 2, overflow: "hidden", height: 2, background: dk.border }}
    >
      <motion.div
        style={{ height: "100%", width: "35%", background: dk.mint, borderRadius: 2 }}
        initial={{ x: "-100%" }}
        animate={{ x: "300%" }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
      />
    </motion.div>
  );
}

function OverlayBtn({ onClick, loading, label, loadingText = "Analyzing…" }: { onClick: () => void; loading: boolean; label: string; loadingText?: string }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ background: "rgba(255,255,255,0.13)" }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: "100%", height: 38, borderRadius: 9999, border: "none",
        background: "rgba(255,255,255,0.08)",
        color: loading ? dk.textDim : dk.text,
        fontSize: 13, fontWeight: 500, letterSpacing: "0.1px",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}
    >
      {loading ? (
        <>
          <motion.div
            style={{ width: 12, height: 12, border: `1.5px solid ${dk.textDim}`, borderTopColor: dk.mint, borderRadius: "50%" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          {loadingText}
        </>
      ) : (
        `${label} →`
      )}
    </motion.button>
  );
}
