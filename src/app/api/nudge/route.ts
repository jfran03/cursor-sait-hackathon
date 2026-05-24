import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const telemetry = body.telemetry ?? {};
    const humanLogs = body.humanLogs ?? {};

    // Honor suppress flag
    const suppress = humanLogs?.biometric_and_spatial?.suppress_nudges === true;
    if (suppress) {
      return NextResponse.json({ nudge: "", do_not_disturb: true, severity: "none" });
    }

    // Simple deterministic rules for a reliable demo fallback
    const sleepDebt = humanLogs?.biometric_and_spatial?.fitness_tracker?.sleep_debt_accumulated_hours ?? 0;
    const location = humanLogs?.biometric_and_spatial?.spatial?.geofence_tag ?? "unknown location";
    const inferred = humanLogs?.biometric_and_spatial?.current_activity?.inferred_activity ?? "unknown";

    let severity: "low" | "medium" | "high" = "low";
    if (sleepDebt > 6 || /Partying|High Density/i.test(inferred) || /Pub|Bar|Club/i.test(location)) severity = "high";
    else if (sleepDebt > 3 || /Moderate/i.test(inferred)) severity = "medium";

    const recommended_action = severity === "high"
      ? "Protect 60 minutes for your highest-priority goal. Start with a 20-minute focused chunk now — set a timer and silence notifications."
      : "Start a 20-minute focused chunk now and set a timer."

    const nudge = severity === "high"
      ? `Objective nudge: You're at ${location} and have ${sleepDebt}h of sleep debt. Your activity looks like: ${inferred}. ${recommended_action}`
      : `Quick nudge: Activity ${inferred}. ${recommended_action}`;

    return NextResponse.json({ nudge, severity, recommended_action, do_not_disturb: false });
  } catch (err) {
    console.error("/api/nudge error", err);
    return NextResponse.json({ nudge: "", severity: "none", do_not_disturb: true }, { status: 500 });
  }
}
