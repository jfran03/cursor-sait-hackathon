"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const dk = {
  bg: "rgba(12, 10, 9, 0.94)",
  border: "rgba(255,255,255,0.08)",
  text: "#f5f4f2",
  textMuted: "#8a8580",
  mint: "#a7e5d3",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusTimer({
  durationMinutes = 20,
  taskTitle,
  open,
  onClose,
  onComplete,
}: {
  durationMinutes?: number;
  taskTitle?: string;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setRemaining(totalSeconds);
      setRunning(false);
    }
  }, [open, totalSeconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      onComplete?.();
    }
  }, [remaining, running, onComplete]);

  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRemaining(totalSeconds);
    setRunning(false);
  }, [totalSeconds]);

  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 10000,
            width: 280,
            background: dk.bg,
            border: `1px solid ${dk.border}`,
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.88px", textTransform: "uppercase", color: dk.mint }}>
              Focus sprint
            </span>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: dk.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>

          {taskTitle && (
            <p style={{ margin: "0 0 12px", fontSize: 13, color: dk.textMuted, lineHeight: 1.4 }}>{taskTitle}</p>
          )}

          <p style={{ margin: "0 0 8px", fontFamily: "var(--font-eb-garamond), serif", fontSize: 48, fontWeight: 400, color: dk.text, textAlign: "center", letterSpacing: "-1px" }}>
            {formatTime(remaining)}
          </p>

          <div style={{ height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.08)", marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: dk.mint, borderRadius: 9999, transition: "width 1s linear" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={toggle}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 9999,
                border: "none",
                background: dk.mint,
                color: "#0c0a09",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {remaining === 0 ? "Done" : running ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "8px 14px",
                borderRadius: 9999,
                border: `1px solid ${dk.border}`,
                background: "transparent",
                color: dk.textMuted,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
