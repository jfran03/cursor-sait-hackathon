import type { RiskLevel } from "@/lib/types";
import { riskAccent } from "@/lib/drift-engine";

const LABELS: Record<RiskLevel, string> = {
  low: "On track",
  medium: "Watch",
  high: "At risk",
  critical: "Stalled",
};

export default function RiskBadge({
  level,
  score,
  compact = false,
}: {
  level: RiskLevel;
  score?: number;
  compact?: boolean;
}) {
  const accent = riskAccent(level);
  const showDot = score != null && score >= 60;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 3 : 4,
        padding: compact ? "2px 5px" : "2px 8px",
        borderRadius: 9999,
        fontSize: compact ? 9 : 10,
        fontWeight: 600,
        letterSpacing: compact ? "0.1px" : "0.3px",
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        color: accent.text,
        whiteSpace: compact ? "normal" : "nowrap",
        maxWidth: compact ? "100%" : undefined,
        lineHeight: 1.25,
        boxSizing: "border-box",
      }}
    >
      {showDot && (
        <span
          style={{
            width: compact ? 4 : 5,
            height: compact ? 4 : 5,
            borderRadius: "50%",
            background: accent.text,
            flexShrink: 0,
          }}
        />
      )}
      {compact ? LABELS[level] : `${LABELS[level]}${score != null ? ` · ${score}` : ""}`}
    </span>
  );
}
