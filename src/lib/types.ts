import { z } from "zod";

// --- Domain types ---

export const GoalHorizonSchema = z.enum(["short", "medium", "long"]);
export type GoalHorizon = z.infer<typeof GoalHorizonSchema>;

export const AcademicMetricsSchema = z.object({
  target_hours_per_week: z.number(),
  days_since_active_engagement: z.number(),
  completion_trend: z.string(),
});

export const GoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  horizon: GoalHorizonSchema.optional(),
  context: z.string().optional(),
  created_at: z.string(),
  academic_metrics: AcademicMetricsSchema.optional(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const CommitmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  hours: z.number(),
  is_goal_directed: z.boolean(),
  created_at: z.string(),
});
export type Commitment = z.infer<typeof CommitmentSchema>;

export const WeekDaySchema = z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
export type WeekDay = z.infer<typeof WeekDaySchema>;

export const ObligationSchema = z.object({
  id: z.string(),
  title: z.string(),
  day: WeekDaySchema,
  start: z.string(),
  end: z.string(),
  type: z.enum(["class", "work", "other"]),
  fixed: z.boolean(),
});
export type Obligation = z.infer<typeof ObligationSchema>;

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  goal_id: z.string().uuid(),
  title: z.string(),
  day: WeekDaySchema,
  start: z.string(),
  estimated_minutes: z.number(),
  conceptual_type: z.string(),
  deadline: z.string(),
  status: z.enum(["planned", "stalled", "skipped", "done"]),
});
export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;

export const CommitmentBlockSchema = z.object({
  id: z.string(),
  commitment_id: z.string().uuid(),
  title: z.string(),
  day: WeekDaySchema,
  start: z.string(),
  hours: z.number(),
});
export type CommitmentBlock = z.infer<typeof CommitmentBlockSchema>;

export const ScheduleSchema = z.object({
  week_start: z.string(),
  protected_hours_per_day: z.number(),
  daily_bandwidth_hours: z.number(),
  demo_day: WeekDaySchema,
  obligations: z.array(ObligationSchema),
  scheduled_tasks: z.array(ScheduledTaskSchema),
  commitment_blocks: z.array(CommitmentBlockSchema),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const ProcrastinationRiskSchema = z.object({
  score: z.number().min(0).max(100),
  level: RiskLevelSchema,
  reasons: z.array(z.string()),
});
export type ProcrastinationRisk = z.infer<typeof ProcrastinationRiskSchema>;

export const AdjustedDurationSchema = z.object({
  estimated_minutes: z.number(),
  adjusted_minutes: z.number(),
  velocity_multiplier: z.number(),
});
export type AdjustedDuration = z.infer<typeof AdjustedDurationSchema>;

export const DayBandwidthSchema = z.object({
  day: WeekDaySchema,
  used_hours: z.number(),
  protected_hours: z.number(),
  remaining_pct: z.number(),
  is_demo_day: z.boolean(),
});
export type DayBandwidth = z.infer<typeof DayBandwidthSchema>;

export const SubtaskSlotSchema = z.object({
  title: z.string(),
  estimated_minutes: z.number(),
  start_time: z.string(),
});
export type SubtaskSlot = z.infer<typeof SubtaskSlotSchema>;

// --- Claude response schemas ---

export const DriftResponseSchema = z.object({
  unplanned_hours: z.number(),
  goal_directed_hours: z.number(),
  stalled_goals: z.array(
    z.object({
      goal_title: z.string(),
      days_since_activity: z.number(),
    })
  ),
  message: z.string(),
});
export type DriftResponse = z.infer<typeof DriftResponseSchema>;

export const PriorityItemSchema = z.object({
  title: z.string(),
  goal: z.string(),
  estimated_minutes: z.number(),
  rationale: z.string(),
});
export const PriorityListResponseSchema = z.object({
  items: z.array(PriorityItemSchema),
  protected_hours: z.number(),
  closing_message: z.string(),
});
export type PriorityListResponse = z.infer<typeof PriorityListResponseSchema>;

export const SubtaskSchema = z.object({
  title: z.string(),
  estimated_minutes: z.number(),
});
export const DecomposeResponseSchema = z.object({
  subtasks: z.array(SubtaskSchema).length(4),
  nudge: z.string(),
});
export type DecomposeResponse = z.infer<typeof DecomposeResponseSchema>;
