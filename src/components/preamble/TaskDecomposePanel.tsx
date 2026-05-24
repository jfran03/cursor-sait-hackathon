"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SubtaskSlot } from "@/lib/types";

const dk = {
  bgSoft: "rgba(22, 20, 18, 0.90)",
  borderSoft: "rgba(255,255,255,0.04)",
  text: "#f5f4f2",
  textMuted: "#8a8580",
  mint: "#a7e5d3",
  mintDim: "rgba(167,229,211,0.12)",
};

export default function TaskDecomposePanel({
  subtasks,
  slots,
  onStartFocus,
}: {
  subtasks: { title: string; estimated_minutes: number }[];
  slots: SubtaskSlot[];
  onStartFocus?: (index: number) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.88px", textTransform: "uppercase", color: dk.textMuted }}>
        Tonight&apos;s micro-chunks
      </p>

      {/* Mini evening strip */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
        {slots.map((slot, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: 8,
              background: i === 0 ? dk.mintDim : dk.bgSoft,
              border: `1px solid ${i === 0 ? "rgba(167,229,211,0.2)" : dk.borderSoft}`,
              minWidth: 72,
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: i === 0 ? dk.mint : dk.textMuted }}>{slot.start_time}</p>
            <p style={{ margin: "2px 0 0", fontSize: 9, color: dk.textMuted }}>{slot.estimated_minutes}m</p>
          </div>
        ))}
      </div>

      {/* Collapsible matrix */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {subtasks.map((task, i) => {
          const isOpen = openIndex === i;
          const slot = slots[i];
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${i === 0 ? "rgba(167,229,211,0.14)" : dk.borderSoft}`,
                  background: i === 0 ? dk.mintDim : dk.bgSoft,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? "rgba(167,229,211,0.2)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: i === 0 ? dk.mint : dk.textMuted,
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: dk.text, lineHeight: 1.35 }}>{task.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: dk.textMuted }}>{task.estimated_minutes}m</span>
                <span style={{ fontSize: 10, color: dk.textMuted }}>{isOpen ? "▾" : "▸"}</span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "8px 12px 10px 42px", fontSize: 12, color: dk.textMuted, lineHeight: 1.5 }}>
                      {slot && <p style={{ margin: "0 0 6px" }}>Scheduled for {slot.start_time} tonight</p>}
                      {i === 0 && onStartFocus && (
                        <button
                          type="button"
                          onClick={() => onStartFocus(i)}
                          style={{
                            marginTop: 4,
                            padding: "5px 12px",
                            borderRadius: 9999,
                            border: "none",
                            background: dk.mint,
                            color: "#0c0a09",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Start 20m focus sprint
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
