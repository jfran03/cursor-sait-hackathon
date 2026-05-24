"use client";

import { motion } from "framer-motion";
import ProfileDashboard from "./ProfileDashboard";
import WeekCalendar from "./WeekCalendar";
import BandwidthMeter from "./BandwidthMeter";
import { computeWeekBandwidth } from "@/lib/bandwidth";
import { dk } from "./tokens";
import type { Schedule } from "@/lib/types";

type IntroScreenProps = {
  profile: Parameters<typeof ProfileDashboard>[0]["profile"];
  schedule: Schedule;
  pastWorkHistory: Parameters<typeof WeekCalendar>[0]["pastWorkHistory"];
  telemetry: Parameters<typeof WeekCalendar>[0]["telemetry"];
  stalledItem?: Parameters<typeof WeekCalendar>[0]["stalledItem"];
  onContinue: () => void;
};

export default function IntroScreen({
  profile,
  schedule,
  pastWorkHistory,
  telemetry,
  stalledItem,
  onContinue,
}: IntroScreenProps) {
  const bandwidth = computeWeekBandwidth(schedule, pastWorkHistory, telemetry.active_stalled_item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: 960,
        margin: "0 auto",
        background: dk.bg,
        backdropFilter: "blur(24px) saturate(1.2)",
        WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        border: `1px solid ${dk.border}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      {/* Halo chrome — matches overlay header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 24px",
          borderBottom: `1px solid ${dk.borderSoft}`,
          background: "rgba(255,255,255,0.025)",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${dk.mint}, ${dk.lavender})`,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.88px", textTransform: "uppercase", color: dk.text }}>
          Halo
        </span>
        <span style={{ fontSize: 11, color: dk.textDim }}>·</span>
        <span style={{ fontSize: 12, color: dk.textMuted }}>Alex&apos;s week</span>
      </div>

      <div style={{ padding: "24px 24px 28px" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, letterSpacing: "0.88px", textTransform: "uppercase", color: dk.textMuted }}>
            Meet Alex
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-eb-garamond), serif",
              fontSize: 32,
              fontWeight: 400,
              color: dk.text,
              letterSpacing: "-0.32px",
              lineHeight: 1.2,
            }}
          >
            Your week at a glance
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 1.4fr)", gap: 20, alignItems: "start" }}>
          <ProfileDashboard profile={profile} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <BandwidthMeter bandwidth={bandwidth} />
            <WeekCalendar
              schedule={schedule}
              pastWorkHistory={pastWorkHistory}
              telemetry={telemetry}
              stalledItem={stalledItem}
            />
          </div>
        </div>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={{ background: "rgba(255,255,255,0.13)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "12px 28px",
              borderRadius: 9999,
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: dk.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.1px",
            }}
          >
            Jordan is texting… →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
