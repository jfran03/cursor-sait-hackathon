import { z } from "zod";

// --- Domain types ---

export const GoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
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
