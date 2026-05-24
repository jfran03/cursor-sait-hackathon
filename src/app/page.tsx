"use client";

import { useState } from "react";
import alexData from "@/data/demo/userProfile.json";
import telemetry from "@/data/demo/currentBehaviorTelemetry.json";
import humanLogs from "@/data/demo/humanLogs.json";
import PopupNudge from "@/components/PopupNudge";
import type { DriftResponse, PriorityListResponse, DecomposeResponse } from "@/lib/types";

type Step = "request" | "drift" | "priorities" | "decompose" | "summary";

// ── Design tokens (from DESIGN.md) ──────────────────────────────────────────
const t = {
  canvas:         "#f5f5f5",
  canvasSoft:     "#fafafa",
  surfaceCard:    "#ffffff",
  surfaceStrong:  "#f0efed",
  primary:        "#292524",
  primaryActive:  "#0c0a09",
  onPrimary:      "#ffffff",
  ink:            "#0c0a09",
  body:           "#4e4e4e",
  bodyStrong:     "#292524",
  muted:          "#777169",
  mutedSoft:      "#a8a29e",
  hairline:       "#e7e5e4",
  hairlineStrong: "#d6d3d1",
  // Gradient orbs
  orbMint:        "#a7e5d3",
  orbPeach:       "#f4c5a8",
  orbLavender:    "#c8b8e0",
  orbSky:         "#a8c8e8",
  orbRose:        "#e8b8c4",
} as const;

// ── Shared styles ─────────────────────────────────────────────────────────────
const displayLg: React.CSSProperties = {
  fontFamily: "var(--font-eb-garamond), 'Times New Roman', serif",
  fontSize: 36,
  fontWeight: 400,   // EB Garamond 400 renders at Waldenburg 300 optical weight
  lineHeight: 1.17,
  letterSpacing: "-0.36px",
  color: t.ink,
  margin: 0,
};
const bodySm: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 400,
  lineHeight: 1.47,
  letterSpacing: "0.15px",
  color: t.body,
};
const captionUpper: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: "0.96px",
  textTransform: "uppercase",
  color: t.muted,
};
const card: React.CSSProperties = {
  background: t.surfaceCard,
  borderRadius: 16,
  border: `1px solid ${t.hairline}`,
  padding: "20px 24px",
};
const cardShadowHover = "0 4px 16px rgba(0,0,0,0.04)";

export default function Home() {
  const [step, setStep]           = useState<Step>("request");
  const [drift, setDrift]         = useState<DriftResponse | null>(null);
  const [priorities, setPriorities] = useState<PriorityListResponse | null>(null);
  const [decompose, setDecompose] = useState<DecomposeResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [nudgeData, setNudgeData] = useState<{nudge:string,severity:string,do_not_disturb?:boolean}|null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(() => {
    try { return localStorage.getItem('halo_demo_mode') === 'true'; } catch { return false; }
  });

  async function post<T>(url: string, body: object): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function fetchDrift() {
    setLoading(true);
    const data = await post<DriftResponse>("/api/drift", {
      goals: alexData.goals,
      commitments: alexData.commitments,
    });
    setDrift(data);
    setStep("drift");
    setLoading(false);
  }

  async function fetchPriorities() {
    setLoading(true);
    const data = await post<PriorityListResponse>("/api/priorities", {
      goals: alexData.goals,
      commitments: alexData.commitments,
    });
    setPriorities(data);
    setStep("priorities");
    setLoading(false);
  }

  async function fetchDecompose() {
    setLoading(true);
    const data = await post<DecomposeResponse>("/api/decompose", {
      task_title: alexData.stalled_item.goal_title,
      goal: alexData.goals[1].title,
    });
    setDecompose(data);
    setStep("decompose");
    setLoading(false);
  }

  function reset() {
    setStep("request");
    setDrift(null);
    setPriorities(null);
    setDecompose(null);
  }

  // Check for proactive nudge on page load (demo: short-poll once)
  React.useEffect(() => {
    async function checkNudge(){
      try {
        const res = await fetch('/api/nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telemetry: telemetry, humanLogs: humanLogs, demo_mode: demoMode }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.nudge && !data.do_not_disturb) setNudgeData(data);
      } catch (e) {
        console.error('nudge check failed', e);
      }
    }
    checkNudge();
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: t.canvas, color: t.body }}>

      {/* Atmospheric orbs — decoration only, never content */}
      <div className="orb" style={{ width: 480, height: 480, top: -100, right: -80,  background: `radial-gradient(circle, ${t.orbMint}, transparent)`,     opacity: 0.55, animationDelay: "0s"  }} />
      <div className="orb" style={{ width: 360, height: 360, top: "42%", left: -120, background: `radial-gradient(circle, ${t.orbPeach}, transparent)`,    opacity: 0.50, animationDelay: "7s"  }} />
      <div className="orb" style={{ width: 300, height: 300, bottom: 60, right: "20%", background: `radial-gradient(circle, ${t.orbLavender}, transparent)`, opacity: 0.42, animationDelay: "14s" }} />

      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* Wordmark */}
        <header style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...captionUpper, color: t.mutedSoft }}>Halo</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: t.muted }}>Demo mode</span>
            <button onClick={() => { const v = !demoMode; setDemoMode(v); try { localStorage.setItem('halo_demo_mode', String(v)); } catch {} }} style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid #e7e5e4', background: demoMode ? t.primary : 'transparent', color: demoMode ? t.onPrimary : t.body, cursor: 'pointer' }}>{demoMode ? 'ON' : 'OFF'}</button>
          </div>
        </header>

        {/* ── Step 1: Incoming Request ── */}
        {step === "request" && (
          <Section>
            <div>
              <h1 style={displayLg}>
                Before you say yes,<br />check in with yourself.
              </h1>
              <p style={{ ...bodySm, marginTop: 16 }}>
                <span style={{ color: t.bodyStrong, fontWeight: 500 }}>{alexData.incoming_request.from}</span>{" "}
                is asking: <em>"{alexData.incoming_request.description}"</em>
              </p>
            </div>

            <div style={card}>
              <p style={{ ...captionUpper, marginBottom: 16 }}>Your goals this week</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {alexData.goals.map((g) => (
                  <li key={g.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: t.muted, flexShrink: 0 }} />
                    <span style={{ ...bodySm, color: t.bodyStrong }}>{g.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PillBtn onClick={fetchDrift} loading={loading} label="See my drift" />
          </Section>
        )}

        {/* ── Step 2: Drift ── */}
        {step === "drift" && drift && (
          <Section>
            <h1 style={displayLg}>
              Here's where your<br />week actually went.
            </h1>

            <div style={card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <StatBox label="Unplanned" value={`${drift.unplanned_hours}h`} />
                <StatBox label="Goal-directed" value={`${drift.goal_directed_hours}h`} />
              </div>

              {drift.stalled_goals.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ ...captionUpper, marginBottom: 12 }}>Stalled</p>
                  {drift.stalled_goals.map((sg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 0",
                        borderBottom: i < drift.stalled_goals.length - 1 ? `1px solid ${t.hairlineStrong}` : "none",
                      }}
                    >
                      <span style={{ ...bodySm, color: t.bodyStrong }}>{sg.goal_title}</span>
                      <Badge label={`${sg.days_since_activity}d ago`} />
                    </div>
                  ))}
                </div>
              )}

              <p style={{ ...bodySm, lineHeight: 1.65 }}>{drift.message}</p>
            </div>

            <PillBtn onClick={fetchPriorities} loading={loading} label="Plan tonight" />
          </Section>
        )}

        {/* ── Step 3: Priorities ── */}
        {step === "priorities" && priorities && (
          <Section>
            <div>
              <h1 style={displayLg}>Tonight's plan.</h1>
              <p style={{ ...bodySm, marginTop: 12 }}>
                {priorities.protected_hours}h protected for your goals.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {priorities.items.map((item, i) => (
                <HoverCard key={i}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, letterSpacing: "0.15px", color: t.bodyStrong, margin: 0, lineHeight: 1.4 }}>
                      {item.title}
                    </p>
                    <p style={{ ...bodySm, margin: "4px 0 0", fontSize: 13 }}>{item.rationale}</p>
                  </div>
                  <Badge label={`${item.estimated_minutes}m`} />
                </HoverCard>
              ))}
            </div>

            <PillBtn onClick={fetchDecompose} loading={loading} label="Break down DS homework" />
          </Section>
        )}

        {/* ── Step 4: Decompose ── */}
        {step === "decompose" && decompose && (
          <Section>
            <div>
              <h1 style={displayLg}>DS homework,<br />made small.</h1>
              <p style={{ ...bodySm, marginTop: 12, lineHeight: 1.65 }}>{decompose.nudge}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {decompose.subtasks.map((task, i) => (
                <HoverCard key={i}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: t.surfaceStrong,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
                    color: t.muted, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ ...bodySm, flex: 1, color: t.bodyStrong }}>{task.title}</span>
                  <Badge label={`${task.estimated_minutes}m`} />
                </HoverCard>
              ))}
            </div>

            <PillBtn onClick={() => setStep("summary")} loading={false} label="Close session" />
          </Section>
        )}

        {/* ── Step 5: Summary ── */}
        {step === "summary" && priorities && (
          <Section>
            <div>
              <h1 style={displayLg}>
                {priorities.protected_hours} hours protected<br />for your goals tonight.
              </h1>
              <p style={{ ...bodySm, marginTop: 16, lineHeight: 1.65 }}>
                {priorities.closing_message}
              </p>
            </div>

            <div style={card}>
              <p style={{ ...captionUpper, marginBottom: 16 }}>Session recap</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {drift && (
                  <li style={bodySm}>
                    Drift identified — {drift.unplanned_hours}h unplanned vs {drift.goal_directed_hours}h goal-directed
                  </li>
                )}
                <li style={bodySm}>{priorities.items.length} priorities set for tonight</li>
                {decompose && (
                  <li style={bodySm}>
                    DS homework broken into 4 steps — first one is {decompose.subtasks[0].estimated_minutes}m
                  </li>
                )}
              </ul>
            </div>

            <PillBtn onClick={reset} loading={false} label="Start over" outline />
          </Section>
        )}

      {nudgeData && <PopupNudge nudge={nudgeData.nudge} severity={nudgeData.severity} onClose={() => setNudgeData(null)} />}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {children}
    </div>
  );
}

function HoverCard({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: `1px solid ${t.hairline}`,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "box-shadow 0.15s",
        boxShadow: hovered ? cardShadowHover : "none",
      }}
    >
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: t.surfaceStrong, borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: 28, fontWeight: 400, letterSpacing: "-0.32px", color: t.ink, margin: 0, lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ ...captionUpper, marginTop: 4 }}>{label}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{
      flexShrink: 0,
      background: t.surfaceStrong,
      borderRadius: 9999,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.5px",
      color: t.muted,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function PillBtn({
  onClick, loading, label, outline = false,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  outline?: boolean;
}) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onMouseLeave={() => setActive(false)}
      style={{
        alignSelf: "flex-start",
        height: 40,
        borderRadius: 9999,
        padding: "0 20px",
        fontSize: 15,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: 0,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.4 : 1,
        transition: "opacity 0.15s",
        background: outline ? "transparent" : (active ? t.primaryActive : t.primary),
        color: outline ? t.ink : t.onPrimary,
        border: outline ? `1px solid ${t.hairlineStrong}` : "none",
      }}
    >
      {loading ? "Working…" : `${label} →`}
    </button>
  );
}
