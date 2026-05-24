"use client";
import React from "react";

export default function PopupNudge({
  nudge,
  severity = "low",
  onClose,
  onStartFocus,
}: {
  nudge: string;
  severity?: string;
  onClose: () => void;
  onStartFocus?: () => void;
}) {
  const bg = severity === "high" ? "#ffecec" : severity === "medium" ? "#fff8e6" : "#f5fff5";
  return (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999 }}>
      <div style={{ width: 340, background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4", boxShadow: "0 6px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        <div style={{ padding: 12, background: bg, borderBottom: "1px solid #eee" }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Halo nudge</strong>
          <div style={{ fontSize: 13, color: "#333" }}>{nudge}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 10 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}>Dismiss</button>
          <button
            onClick={() => { onStartFocus?.(); onClose(); }}
            style={{ background: "#292524", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 999, cursor: "pointer" }}
          >
            Start 20m
          </button>
        </div>
      </div>
    </div>
  );
}
