import type { DayBandwidth } from "@/lib/types";
import { formatBandwidthLabel } from "@/lib/bandwidth";
import { dk, panelStyle } from "./tokens";

function barColor(pct: number): string {
  if (pct <= 20) return dk.red;
  if (pct <= 40) return dk.peach;
  return dk.mint;
}

export default function BandwidthMeter({ bandwidth }: { bandwidth: DayBandwidth[] }) {
  const weekdays = bandwidth.filter((b) => b.day !== "Sat" && b.day !== "Sun");

  return (
    <div style={{ ...panelStyle, padding: 16, minWidth: 0, overflow: "hidden" }}>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.88px",
          textTransform: "uppercase",
          color: dk.textMuted,
        }}
      >
        Bandwidth remaining
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, minWidth: 0 }}>
        {weekdays.map((day) => (
          <div
            key={day.day}
            title={`${day.used_hours}h used · ${day.protected_hours}h protected · ${formatBandwidthLabel(day.remaining_pct)}`}
            style={{
              minWidth: 0,
              padding: "8px 6px",
              borderRadius: 10,
              border: `1px solid ${day.is_demo_day ? "rgba(167,229,211,0.25)" : dk.borderSoft}`,
              background: day.is_demo_day ? dk.mintDim : "rgba(255,255,255,0.03)",
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 600,
                color: day.is_demo_day ? dk.mint : dk.textMuted,
                textAlign: "center",
              }}
            >
              {day.day}
            </p>
            <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${day.remaining_pct}%`,
                  borderRadius: 9999,
                  background: barColor(day.remaining_pct),
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: dk.textDim, textAlign: "center" }}>
              {day.remaining_pct}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
