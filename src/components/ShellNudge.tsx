"use client";

import { motion } from "framer-motion";
import { dk } from "@/components/preamble/tokens";

const severityStyle = {
  high: { bg: dk.redDim, border: "rgba(232,116,90,0.18)", accent: dk.red },
  medium: { bg: dk.peachDim, border: "rgba(244,197,168,0.18)", accent: dk.peach },
  low: { bg: dk.mintDim, border: "rgba(167,229,211,0.12)", accent: dk.mint },
} as const;

export default function ShellNudge({
  nudge,
  severity = "low",
  onDismiss,
  onStartFocus,
}: {
  nudge: string;
  severity?: string;
  onDismiss: () => void;
  onStartFocus?: () => void;
}) {
  const style = severityStyle[severity as keyof typeof severityStyle] ?? severityStyle.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: style.bg,
          border: `1px solid ${style.border}`,
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.88px",
            textTransform: "uppercase",
            color: style.accent,
          }}
        >
          Halo nudge
        </p>
        <p style={{ margin: 0, fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{nudge}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingBottom: 20 }}>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "rgba(255,255,255,0.10)",
            color: dk.text,
            border: `1px solid ${dk.border}`,
            padding: "8px 16px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          View the plan
        </button>
      </div>
    </motion.div>
  );
}
