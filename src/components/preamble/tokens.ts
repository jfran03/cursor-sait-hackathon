/** Dark glass tokens — matches Halo overlay on phone demo */
export const dk = {
  bg: "rgba(12, 10, 9, 0.94)",
  bgSoft: "rgba(22, 20, 18, 0.90)",
  border: "rgba(255,255,255,0.08)",
  borderSoft: "rgba(255,255,255,0.04)",
  text: "#f5f4f2",
  textMuted: "#8a8580",
  textDim: "#5a5550",
  mint: "#a7e5d3",
  mintDim: "rgba(167,229,211,0.12)",
  peach: "#f4c5a8",
  peachDim: "rgba(244,197,168,0.12)",
  lavender: "#c8b8e0",
  red: "#e8745a",
  redDim: "rgba(232,116,90,0.14)",
} as const;

export const panelStyle = {
  background: dk.bgSoft,
  borderRadius: 16,
  border: `1px solid ${dk.borderSoft}`,
};
