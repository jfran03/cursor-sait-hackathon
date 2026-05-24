import type { ProcrastinationRisk, RiskLevel } from "./types";

type StalledItem = {
  days_since_activity: number;
  tab_switches_and_revisits: number;
  lines_of_code_changed_last_48h?: number;
};

type TelemetryInput = {
  active_stalled_item?: {
    conceptual_type?: string;
    current_tab_switches_without_code_changes?: number;
    projected_velocity_drift_multiplier?: number;
  };
  cognitive_environment?: {
    calendar_density_score?: string;
    current_fatigue_level?: string;
  };
  behavioral_friction?: {
    friction_threshold_tab_switches?: number;
    procrastination_trigger_type?: string;
  };
};

type TaskInput = {
  conceptual_type: string;
  deadline: string;
  status: string;
  estimated_minutes: number;
};

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function hoursUntilDeadline(deadline: string): number {
  const now = new Date("2026-05-23T22:00:00Z");
  const end = new Date(deadline);
  return (end.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function computeProcrastinationRisk(input: {
  task: TaskInput;
  stalled_item?: StalledItem | null;
  telemetry?: TelemetryInput | null;
}): ProcrastinationRisk {
  const { task, stalled_item, telemetry } = input;
  const reasons: string[] = [];
  let score = 0;

  const tabThreshold = telemetry?.behavioral_friction?.friction_threshold_tab_switches ?? 5;
  const tabSwitches =
    telemetry?.active_stalled_item?.current_tab_switches_without_code_changes ??
    stalled_item?.tab_switches_and_revisits ??
    0;

  if (task.status === "stalled") {
    score += 25;
    reasons.push("Task marked as stalled");
  }

  if (tabSwitches >= tabThreshold) {
    score += 20;
    reasons.push(`${tabSwitches} tab switches without progress`);
  }

  if (stalled_item && stalled_item.days_since_activity >= 5) {
    score += 15;
    reasons.push(`${stalled_item.days_since_activity} days since last session`);
  }

  if (stalled_item?.lines_of_code_changed_last_48h === 0) {
    score += 10;
    reasons.push("No code changes in 48 hours");
  }

  const hoursLeft = hoursUntilDeadline(task.deadline);
  if (hoursLeft <= 12) {
    score += 25;
    reasons.push(`Deadline in ${Math.round(hoursLeft)} hours`);
  } else if (hoursLeft <= 48) {
    score += 15;
    reasons.push(`Deadline in ${Math.round(hoursLeft)} hours`);
  }

  if (telemetry?.cognitive_environment?.calendar_density_score === "High") {
    score += 10;
    reasons.push("High calendar density this week");
  }

  if (telemetry?.cognitive_environment?.current_fatigue_level === "High") {
    score += 8;
    reasons.push("High fatigue level detected");
  }

  if (task.conceptual_type.includes("Abstract Math")) {
    score += 12;
    reasons.push("High-friction task type for Alex");
  }

  const multiplier = telemetry?.active_stalled_item?.projected_velocity_drift_multiplier;
  if (multiplier && multiplier >= 2) {
    score += 10;
    reasons.push(`Velocity drift ${multiplier}x vs estimate`);
  }

  score = Math.min(100, score);

  return {
    score,
    level: scoreToLevel(score),
    reasons,
  };
}

export function riskAccent(level: RiskLevel): { bg: string; border: string; text: string } {
  switch (level) {
    case "critical":
      return { bg: "rgba(232,116,90,0.14)", border: "rgba(232,116,90,0.35)", text: "#e8745a" };
    case "high":
      return { bg: "rgba(244,197,168,0.12)", border: "rgba(244,197,168,0.3)", text: "#f4c5a8" };
    case "medium":
      return { bg: "rgba(200,184,224,0.12)", border: "rgba(200,184,224,0.28)", text: "#c8b8e0" };
    default:
      return { bg: "rgba(167,229,211,0.12)", border: "rgba(167,229,211,0.2)", text: "#a7e5d3" };
  }
}
