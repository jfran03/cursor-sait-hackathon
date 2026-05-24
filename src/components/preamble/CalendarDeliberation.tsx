"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { computeAdjustedDuration } from "@/lib/duration";
import type { Goal, Schedule } from "@/lib/types";
import { dk, panelStyle } from "./tokens";

type PastWorkHistory = {
  historical_trends: { global_velocity_multiplier: number };
  assignment_baselines: { conceptual_type: string; velocity_drift_multiplier: number | null; status?: string }[];
};

type Telemetry = {
  active_stalled_item?: {
    conceptual_type?: string;
    projected_velocity_drift_multiplier?: number;
  };
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

const shellEase = [0.22, 1, 0.36, 1] as const;
const zoomTransition = { duration: 0.52, ease: shellEase };

type Phase = "week" | "day" | "deliberate";

export default function CalendarDeliberation({
  schedule,
  goals,
  pastWorkHistory,
  telemetry,
  phase,
  contentReady,
}: {
  schedule: Schedule;
  goals: Goal[];
  pastWorkHistory: PastWorkHistory;
  telemetry: Telemetry;
  phase: Phase;
  contentReady: boolean;
}) {
  const focusDay = schedule.demo_day;
  const obligations = schedule.obligations.filter((o) => o.day === focusDay);
  const commitments = schedule.commitment_blocks.filter((c) => c.day === focusDay);
  const tasks = schedule.scheduled_tasks.filter((t) => t.day === focusDay);
  const zoomed = phase !== "week";

  const weekRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState({ week: 120, day: 320 });

  const protectedLeft = Math.max(
    0,
    schedule.daily_bandwidth_hours -
      obligations.reduce((s, o) => {
        const [sh, sm] = o.start.split(":").map(Number);
        const [eh, em] = o.end.split(":").map(Number);
        return s + (eh + em / 60 - (sh + sm / 60));
      }, 0) -
      commitments.reduce((s, c) => s + c.hours, 0),
  );

  useLayoutEffect(() => {
    if (!contentReady || !weekRef.current || !dayRef.current) return;

    const measure = () => {
      setHeights({
        week: weekRef.current?.scrollHeight ?? 120,
        day: dayRef.current?.scrollHeight ?? 320,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(weekRef.current);
    ro.observe(dayRef.current);
    return () => ro.disconnect();
  }, [contentReady, phase]);

  return (
    <motion.div
      initial={false}
      animate={{ width: zoomed ? 300 : 340 }}
      transition={zoomTransition}
      style={{
        flexShrink: 0,
        ...panelStyle,
        padding: 16,
        minHeight: contentReady ? undefined : 148,
        background: dk.bg,
        border: `1px solid ${dk.border}`,
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
        overflow: "hidden",
      }}
    >
      {contentReady && (
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        >
          {/* Header — crossfade, no mount/unmount snap */}
          <div style={{ position: "relative", height: 20, marginBottom: 12 }}>
            <motion.span
              animate={{
                opacity: zoomed ? 0 : 1,
                y: zoomed ? -6 : 0,
                filter: zoomed ? "blur(3px)" : "blur(0px)",
              }}
              transition={zoomTransition}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.88px",
                textTransform: "uppercase",
                color: dk.textMuted,
                pointerEvents: zoomed ? "none" : "auto",
              }}
            >
              This week
            </motion.span>
            <motion.div
              animate={{ opacity: zoomed ? 1 : 0, x: zoomed ? 0 : -8 }}
              transition={zoomTransition}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                pointerEvents: zoomed ? "auto" : "none",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.88px", textTransform: "uppercase", color: dk.textMuted }}>
                {focusDay} · today
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: dk.mint, padding: "2px 8px", borderRadius: 9999, background: dk.mintDim }}>
                zoomed in
              </span>
            </motion.div>
          </div>

          {/* Height-animated viewport — both layers stay mounted */}
          <motion.div
            initial={false}
            animate={{ height: zoomed ? heights.day : heights.week }}
            transition={zoomTransition}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <motion.div
              ref={weekRef}
              animate={{
                opacity: zoomed ? 0 : 1,
                scale: zoomed ? 0.96 : 1,
                filter: zoomed ? "blur(5px)" : "blur(0px)",
              }}
              transition={zoomTransition}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                transformOrigin: "50% 75%",
                pointerEvents: zoomed ? "none" : "auto",
              }}
            >
              <p style={{ margin: "0 0 10px", fontSize: 12, color: dk.textMuted, lineHeight: 1.45 }}>
                Week of {schedule.week_start} — scanning bandwidth before you reply.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {WEEK_DAYS.map((day) => {
                  const isDemo = day === focusDay;
                  const load =
                    schedule.obligations.filter((o) => o.day === day).length +
                    schedule.commitment_blocks.filter((c) => c.day === day).length +
                    schedule.scheduled_tasks.filter((t) => t.day === day).length;
                  return (
                    <div
                      key={day}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 10,
                        textAlign: "center",
                        border: `1px solid ${isDemo ? "rgba(167,229,211,0.35)" : dk.borderSoft}`,
                        background: isDemo ? dk.mintDim : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: isDemo ? dk.mint : dk.textMuted }}>{day}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: dk.textDim }}>{load} blocks</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              ref={dayRef}
              animate={{
                opacity: zoomed ? 1 : 0,
                scale: zoomed ? 1 : 0.97,
                filter: zoomed ? "blur(0px)" : "blur(5px)",
              }}
              transition={zoomTransition}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                transformOrigin: "50% 0%",
                pointerEvents: zoomed ? "auto" : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {obligations.map((o) => (
                  <AgendaRow key={o.id} title={o.title} time={`${o.start}–${o.end}`} tone="fixed" />
                ))}
                {tasks.map((task) => {
                  const adj = computeAdjustedDuration(
                    task.estimated_minutes,
                    task.conceptual_type,
                    pastWorkHistory,
                    task.status === "stalled" ? telemetry.active_stalled_item : null,
                  );
                  return (
                    <AgendaRow
                      key={task.id}
                      title={task.title}
                      time={`${task.start} · ~${adj.adjusted_minutes}m`}
                      tone={task.status === "stalled" ? "critical" : "goal"}
                      tag={task.status === "stalled" ? "due tomorrow" : undefined}
                    />
                  );
                })}
                {commitments.map((c) => (
                  <AgendaRow key={c.id} title={c.title} time={`${c.start} · ${c.hours}h`} tone="drift" />
                ))}
                <AgendaRow
                  title="AI Club booth (Jordan's ask)"
                  time="Sat · ~3h proposed"
                  tone="proposed"
                  tag="+3h if yes"
                />
              </div>

              <div style={{ padding: "10px 12px", borderRadius: 10, background: dk.bgSoft, border: `1px solid ${dk.borderSoft}`, marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: dk.textMuted }}>
                  Protected time left tonight
                </p>
                <p style={{ margin: "4px 0 0", fontFamily: "var(--font-eb-garamond), serif", fontSize: 22, color: dk.mint }}>
                  {protectedLeft.toFixed(1)}h
                </p>
              </div>

              <AnimatePresence initial={false}>
                {phase === "deliberate" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.38, ease: shellEase }}
                    style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}
                  >
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", color: dk.textMuted }}>
                      Goals at stake
                    </p>
                    {goals.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: g.academic_metrics && g.academic_metrics.days_since_active_engagement > 5 ? dk.redDim : dk.mintDim,
                          border: `1px solid ${g.academic_metrics && g.academic_metrics.days_since_active_engagement > 5 ? "rgba(232,116,90,0.2)" : "rgba(167,229,211,0.15)"}`,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12, color: dk.text, lineHeight: 1.35 }}>{g.title}</p>
                        {g.academic_metrics && (
                          <p style={{ margin: "3px 0 0", fontSize: 10, color: dk.textMuted }}>
                            {g.academic_metrics.days_since_active_engagement}d since last session
                          </p>
                        )}
                      </div>
                    ))}
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: dk.textMuted, lineHeight: 1.5, fontStyle: "italic" }}>
                      Saying yes costs ~3h you don&apos;t have — research paper hasn&apos;t moved in 12 days.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

function AgendaRow({
  title,
  time,
  tone,
  tag,
}: {
  title: string;
  time: string;
  tone: "fixed" | "goal" | "critical" | "drift" | "proposed";
  tag?: string;
}) {
  const styles = {
    fixed: { bg: "rgba(255,255,255,0.05)", border: dk.borderSoft, text: dk.textMuted },
    goal: { bg: dk.mintDim, border: "rgba(167,229,211,0.2)", text: dk.mint },
    critical: { bg: dk.redDim, border: "rgba(232,116,90,0.25)", text: dk.red },
    drift: { bg: dk.peachDim, border: "rgba(244,197,168,0.25)", text: dk.peach },
    proposed: { bg: "rgba(200,184,224,0.12)", border: "rgba(200,184,224,0.3)", text: dk.lavender },
  }[tone];

  return (
    <div style={{ padding: "7px 10px", borderRadius: 8, background: styles.bg, border: `1px solid ${styles.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: dk.text, lineHeight: 1.3, flex: 1 }}>{title}</p>
        {tag && (
          <span style={{ fontSize: 9, fontWeight: 700, color: styles.text, whiteSpace: "nowrap", letterSpacing: "0.3px" }}>{tag}</span>
        )}
      </div>
      <p style={{ margin: "2px 0 0", fontSize: 10, color: dk.textDim }}>{time}</p>
    </div>
  );
}
