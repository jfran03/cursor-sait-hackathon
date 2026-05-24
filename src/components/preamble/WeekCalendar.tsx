"use client";

import { motion } from "framer-motion";
import { computeAdjustedDuration } from "@/lib/duration";
import { computeProcrastinationRisk, riskAccent } from "@/lib/drift-engine";
import type { ProcrastinationRisk, Schedule } from "@/lib/types";
import RiskBadge from "./RiskBadge";
import { dk, panelStyle } from "./tokens";

type PastWorkHistory = {
  historical_trends: { global_velocity_multiplier: number };
  assignment_baselines: { conceptual_type: string; velocity_drift_multiplier: number | null; status?: string }[];
};

type StalledItem = {
  days_since_activity: number;
  tab_switches_and_revisits: number;
  lines_of_code_changed_last_48h?: number;
};

type Telemetry = {
  active_stalled_item?: {
    conceptual_type?: string;
    current_tab_switches_without_code_changes?: number;
    projected_velocity_drift_multiplier?: number;
  };
  cognitive_environment?: { calendar_density_score?: string; current_fatigue_level?: string };
  behavioral_friction?: { friction_threshold_tab_switches?: number };
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

function Block({
  title,
  time,
  subtitle,
  bg,
  border,
  risk,
  nudge,
  pulse,
}: {
  title: string;
  time: string;
  subtitle?: string;
  bg: string;
  border: string;
  risk?: ProcrastinationRisk;
  nudge?: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      animate={
        pulse
          ? { boxShadow: ["0 0 0 0 rgba(232,116,90,0)", "0 0 0 4px rgba(232,116,90,0.25)", "0 0 0 0 rgba(232,116,90,0)"] }
          : {}
      }
      transition={pulse ? { duration: 2, repeat: Infinity } : {}}
      style={{
        padding: "6px 8px",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`,
        marginBottom: 4,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 4 }}>
        <p
          style={{
            margin: 0,
            flex: "1 1 100%",
            minWidth: 0,
            fontSize: 11,
            fontWeight: 600,
            color: dk.text,
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {title}
        </p>
        {risk && risk.level !== "low" && (
          <div style={{ maxWidth: "100%" }}>
            <RiskBadge level={risk.level} score={risk.score} compact />
          </div>
        )}
      </div>
      <p style={{ margin: "2px 0 0", fontSize: 10, color: dk.textMuted }}>{time}</p>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 10, color: dk.textDim }}>{subtitle}</p>}
      {nudge && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 10,
            fontWeight: 500,
            color: dk.mint,
            lineHeight: 1.4,
            borderTop: `1px solid ${dk.borderSoft}`,
            paddingTop: 4,
          }}
        >
          {nudge}
        </p>
      )}
    </motion.div>
  );
}

export default function WeekCalendar({
  schedule,
  pastWorkHistory,
  telemetry,
  stalledItem,
}: {
  schedule: Schedule;
  pastWorkHistory: PastWorkHistory;
  telemetry: Telemetry;
  stalledItem?: StalledItem | null;
}) {
  return (
    <div style={{ ...panelStyle, padding: 20, minWidth: 0, overflow: "hidden" }}>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.88px",
          textTransform: "uppercase",
          color: dk.textMuted,
        }}
      >
        Week of {schedule.week_start}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, minWidth: 0 }}>
        {WEEK_DAYS.map((day) => {
          const isDemo = day === schedule.demo_day;
          const obligations = schedule.obligations.filter((o) => o.day === day);
          const commitments = schedule.commitment_blocks.filter((c) => c.day === day);
          const tasks = schedule.scheduled_tasks.filter((tk) => tk.day === day);

          return (
            <div
              key={day}
              style={{
                minWidth: 0,
                minHeight: 120,
                padding: "8px 6px",
                borderRadius: 12,
                border: `1px solid ${isDemo ? "rgba(167,229,211,0.25)" : dk.borderSoft}`,
                background: isDemo ? dk.mintDim : "rgba(255,255,255,0.03)",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDemo ? dk.mint : dk.textMuted,
                  textAlign: "center",
                }}
              >
                {day}
                {isDemo && (
                  <span style={{ display: "block", fontSize: 9, fontWeight: 500, color: dk.textDim }}>today</span>
                )}
              </p>

              {obligations.map((o) => (
                <Block
                  key={o.id}
                  title={o.title}
                  time={`${o.start}–${o.end}`}
                  bg="rgba(255,255,255,0.05)"
                  border={dk.borderSoft}
                />
              ))}

              {commitments.map((c) => (
                <Block
                  key={c.id}
                  title={c.title}
                  time={`${c.start} · ${c.hours}h`}
                  bg={dk.peachDim}
                  border="rgba(244,197,168,0.25)"
                />
              ))}

              {tasks.map((task) => {
                const adj = computeAdjustedDuration(
                  task.estimated_minutes,
                  task.conceptual_type,
                  pastWorkHistory,
                  task.status === "stalled" ? telemetry.active_stalled_item : null,
                );
                const risk = computeProcrastinationRisk({
                  task,
                  stalled_item: task.status === "stalled" ? stalledItem : null,
                  telemetry,
                });
                const accent = riskAccent(risk.level);
                const nudge =
                  task.status === "stalled" && isDemo
                    ? `Start with 20m review — velocity suggests ${adj.adjusted_minutes}m total`
                    : undefined;

                return (
                  <Block
                    key={task.id}
                    title={task.title}
                    time={`${task.start} · est ${adj.adjusted_minutes}m`}
                    subtitle={task.status === "skipped" ? "Skipped" : undefined}
                    bg={accent.bg}
                    border={accent.border}
                    risk={risk}
                    nudge={nudge}
                    pulse={risk.level === "critical" && isDemo}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
