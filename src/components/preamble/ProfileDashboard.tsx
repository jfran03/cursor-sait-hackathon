import type { Goal, Commitment } from "@/lib/types";
import { dk, panelStyle } from "./tokens";

type UserProfile = {
  user: {
    name: string;
    demographics: { institution: string; program: string; current_year: string };
    expertise: {
      primary_technical_domain: string;
      known_languages: string[];
      academic_strengths: string;
      academic_stretches: string;
    };
  };
  goals: Goal[];
  commitments: Commitment[];
  drift_context: { unplanned_hours: number; goal_directed_hours: number; behavioral_summary: string };
};

const HORIZON_LABELS = { short: "Short-term", medium: "Medium-term", long: "Long-term" } as const;
const HORIZON_ORDER = ["short", "medium", "long"] as const;

const captionUpper = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.88px",
  textTransform: "uppercase" as const,
  color: dk.textMuted,
};

export default function ProfileDashboard({ profile }: { profile: UserProfile }) {
  const { user, goals, commitments, drift_context } = profile;
  const unplanned = commitments.filter((c) => !c.is_goal_directed).reduce((s, c) => s + c.hours, 0);
  const goalDirected = commitments.filter((c) => c.is_goal_directed).reduce((s, c) => s + c.hours, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Alex card */}
      <div style={{ ...panelStyle, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${dk.mint}, ${dk.lavender})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 600,
              color: "#0c0a09",
              flexShrink: 0,
            }}
          >
            {user.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-eb-garamond), serif",
                fontSize: 24,
                fontWeight: 400,
                color: dk.text,
                letterSpacing: "-0.24px",
              }}
            >
              {user.name}&apos;s Halo profile
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: dk.textMuted }}>
              {user.demographics.current_year} · {user.demographics.program} · {user.demographics.institution.split("(")[0].trim()}
            </p>
          </div>
        </div>

        <p style={{ margin: "14px 0 8px", fontSize: 13, color: dk.textMuted, lineHeight: 1.55 }}>
          {user.expertise.primary_technical_domain}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {user.expertise.known_languages.map((lang) => (
            <span
              key={lang}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${dk.borderSoft}`,
                color: dk.textMuted,
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Goals by horizon */}
      <div style={{ ...panelStyle, padding: 20 }}>
        <p style={{ ...captionUpper, margin: "0 0 12px" }}>Academic goals</p>
        {HORIZON_ORDER.map((horizon) => {
          const group = goals.filter((g) => (g.horizon ?? "medium") === horizon);
          if (group.length === 0) return null;
          return (
            <div key={horizon} style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: dk.textDim }}>{HORIZON_LABELS[horizon]}</p>
              {group.map((g) => {
                const stalled = (g.academic_metrics?.days_since_active_engagement ?? 0) > 5;
                return (
                  <div
                    key={g.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 10,
                      background: stalled ? dk.redDim : dk.mintDim,
                      border: `1px solid ${stalled ? "rgba(232,116,90,0.18)" : "rgba(167,229,211,0.12)"}`,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, color: dk.text, lineHeight: 1.35, flex: 1 }}>{g.title}</span>
                    {g.academic_metrics && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: stalled ? dk.red : dk.mint,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {g.academic_metrics.days_since_active_engagement}d idle
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Weekly drift summary */}
      <div style={{ ...panelStyle, padding: 20 }}>
        <p style={{ ...captionUpper, margin: "0 0 10px" }}>This week</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ padding: "12px 14px", borderRadius: 10, background: dk.bgSoft, border: `1px solid ${dk.borderSoft}` }}>
            <p style={{ margin: 0, fontFamily: "var(--font-eb-garamond), serif", fontSize: 26, color: dk.red, lineHeight: 1 }}>
              {unplanned}h
            </p>
            <p style={{ ...captionUpper, marginTop: 4, fontSize: 10 }}>Unplanned</p>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 10, background: dk.bgSoft, border: `1px solid ${dk.borderSoft}` }}>
            <p style={{ margin: 0, fontFamily: "var(--font-eb-garamond), serif", fontSize: 26, color: dk.mint, lineHeight: 1 }}>
              {goalDirected}h
            </p>
            <p style={{ ...captionUpper, marginTop: 4, fontSize: 10 }}>Goal-directed</p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: dk.textMuted, lineHeight: 1.6, borderTop: `1px solid ${dk.borderSoft}`, paddingTop: 12 }}>
          {drift_context.behavioral_summary}
        </p>
      </div>
    </div>
  );
}
