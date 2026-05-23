/**
 * Seeds the Alex demo scenario into Supabase.
 * Run with: npx tsx scripts/seed.ts
 *
 * Alex is a second-year CS student with two stated goals:
 * - Finish Data Structures with a B+
 * - Publish a research paper
 *
 * This week: 5 unplanned commitments, 9 unplanned hours, DS homework stalled, research paper untouched 12 days.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALEX_USER_ID = "00000000-0000-0000-0000-000000000001";

async function seed() {
  console.log("Seeding Alex demo scenario...");

  // Goals
  const { error: goalsError } = await supabase.from("goals").upsert([
    {
      id: "10000000-0000-0000-0000-000000000001",
      user_id: ALEX_USER_ID,
      title: "Finish Data Structures with a B+",
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      user_id: ALEX_USER_ID,
      title: "Publish a research paper",
    },
  ]);
  if (goalsError) throw goalsError;

  // Commitments — 5 unplanned items totaling 9 hours
  const { error: commitmentsError } = await supabase.from("commitments").upsert([
    {
      id: "20000000-0000-0000-0000-000000000001",
      user_id: ALEX_USER_ID,
      title: "Helped roommate move furniture",
      hours: 2,
      is_goal_directed: false,
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      user_id: ALEX_USER_ID,
      title: "Club exec meeting + prep",
      hours: 2.5,
      is_goal_directed: false,
    },
    {
      id: "20000000-0000-0000-0000-000000000003",
      user_id: ALEX_USER_ID,
      title: "Covered a friend's shift",
      hours: 1.5,
      is_goal_directed: false,
    },
    {
      id: "20000000-0000-0000-0000-000000000004",
      user_id: ALEX_USER_ID,
      title: "Attended optional seminar",
      hours: 1.5,
      is_goal_directed: false,
    },
    {
      id: "20000000-0000-0000-0000-000000000005",
      user_id: ALEX_USER_ID,
      title: "DS homework (due tomorrow)",
      hours: 1.5,
      is_goal_directed: true,
    },
  ]);
  if (commitmentsError) throw commitmentsError;

  console.log("Done. Alex demo scenario seeded.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
