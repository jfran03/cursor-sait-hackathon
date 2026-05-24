import { computeAdjustedDuration } from "./duration";
import type { DayBandwidth, Schedule, WeekDay } from "./types";

const WEEK_DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseTimeToHours(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function obligationHours(start: string, end: string): number {
  return parseTimeToHours(end) - parseTimeToHours(start);
}

type PastWorkHistory = {
  historical_trends: { global_velocity_multiplier: number };
  assignment_baselines: { conceptual_type: string; velocity_drift_multiplier: number | null; status?: string }[];
};

type TelemetryStalled = {
  conceptual_type?: string;
  projected_velocity_drift_multiplier?: number;
};

export function computeDayBandwidth(
  day: WeekDay,
  schedule: Schedule,
  pastWorkHistory: PastWorkHistory,
  telemetryStalled?: TelemetryStalled | null,
): DayBandwidth {
  const cap = schedule.daily_bandwidth_hours;
  const protected_hours = schedule.protected_hours_per_day;

  const fixedHours = schedule.obligations
    .filter((o) => o.day === day)
    .reduce((sum, o) => sum + obligationHours(o.start, o.end), 0);

  const commitmentHours = schedule.commitment_blocks
    .filter((c) => c.day === day)
    .reduce((sum, c) => sum + c.hours, 0);

  const taskHours = schedule.scheduled_tasks
    .filter((t) => t.day === day)
    .reduce((sum, t) => {
      const adj = computeAdjustedDuration(
        t.estimated_minutes,
        t.conceptual_type,
        pastWorkHistory,
        t.status === "stalled" ? telemetryStalled : null,
      );
      return sum + adj.adjusted_minutes / 60;
    }, 0);

  const used_hours = fixedHours + commitmentHours + taskHours;
  const available = cap - protected_hours;
  const remaining = Math.max(0, available - used_hours);
  const remaining_pct = available > 0 ? Math.round((remaining / available) * 100) : 0;

  return {
    day,
    used_hours: Math.round(used_hours * 10) / 10,
    protected_hours,
    remaining_pct,
    is_demo_day: day === schedule.demo_day,
  };
}

export function computeWeekBandwidth(
  schedule: Schedule,
  pastWorkHistory: PastWorkHistory,
  telemetryStalled?: TelemetryStalled | null,
): DayBandwidth[] {
  return WEEK_DAYS.map((day) =>
    computeDayBandwidth(day, schedule, pastWorkHistory, telemetryStalled),
  );
}

export function formatBandwidthLabel(pct: number): string {
  if (pct <= 15) return "Critical";
  if (pct <= 35) return "Low";
  if (pct <= 60) return "Moderate";
  return "Available";
}
