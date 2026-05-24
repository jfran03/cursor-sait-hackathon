import type { AdjustedDuration } from "./types";

type AssignmentBaseline = {
  conceptual_type: string;
  velocity_drift_multiplier: number | null;
  status?: string;
};

type PastWorkHistory = {
  historical_trends: { global_velocity_multiplier: number };
  assignment_baselines: AssignmentBaseline[];
};

type TelemetryStalled = {
  conceptual_type?: string;
  projected_velocity_drift_multiplier?: number;
};

const FRICTION_MULTIPLIERS: Record<string, number> = {
  "Practical Coding": 1.2,
  "Abstract Math & Pointers": 1.88,
  "Abstract Math & Big-O Proofs": 2.06,
  "Abstract Math & Complex Algorithms": 2.15,
};

export function getVelocityMultiplier(
  conceptType: string,
  pastWorkHistory: PastWorkHistory,
  telemetryStalled?: TelemetryStalled | null,
): number {
  if (telemetryStalled?.projected_velocity_drift_multiplier) {
    return telemetryStalled.projected_velocity_drift_multiplier;
  }

  const matching = pastWorkHistory.assignment_baselines.find(
    (b) => b.conceptual_type === conceptType && b.velocity_drift_multiplier != null,
  );
  if (matching?.velocity_drift_multiplier) {
    return matching.velocity_drift_multiplier;
  }

  return FRICTION_MULTIPLIERS[conceptType] ?? pastWorkHistory.historical_trends.global_velocity_multiplier;
}

export function adjustedMinutes(estimated: number, multiplier: number): number {
  return Math.round(estimated * multiplier);
}

export function computeAdjustedDuration(
  estimatedMinutes: number,
  conceptType: string,
  pastWorkHistory: PastWorkHistory,
  telemetryStalled?: TelemetryStalled | null,
): AdjustedDuration {
  const velocity_multiplier = getVelocityMultiplier(conceptType, pastWorkHistory, telemetryStalled);
  return {
    estimated_minutes: estimatedMinutes,
    adjusted_minutes: adjustedMinutes(estimatedMinutes, velocity_multiplier),
    velocity_multiplier,
  };
}

export function mapSubtasksToSlots(
  subtasks: { title: string; estimated_minutes: number }[],
  startHour = 20,
  startMinute = 0,
): { title: string; estimated_minutes: number; start_time: string }[] {
  let cursor = startHour * 60 + startMinute;
  return subtasks.map((st) => {
    const h = Math.floor(cursor / 60);
    const m = cursor % 60;
    const start_time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    cursor += st.estimated_minutes + 5; // 5 min buffer between chunks
    return { ...st, start_time };
  });
}
