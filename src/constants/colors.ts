/**
 * Central color tokens for the Bitfinex-style dark UI.
 * Prefer importing from here instead of hex literals in components.
 */
export const OB_COLORS = {
  bg: "#10171D",
  bgRow: "#141c24",
  headerMuted: "#8b9aab",
  text: "#e8eef5",
  textDim: "#9aa8bc",
  bidBar: "rgba(22, 53, 49, 0.72)",
  bidText: "#5ee9b5",
  askBar: "rgba(61, 30, 30, 0.72)",
  askText: "#f87171",
  border: "#1f2a36",
} as const;

// Full-book screen: neutral / monochrome table
export const DETAIL_COLORS = {
  bg: "#0d1118",
  bgRow: "#121922",
  headerMuted: "#7a8a9e",
  text: "#f2f5f9",
  textDim: "#b8c3d4",
  border: "#1c2630",
} as const;

// Home shell (outside the order-book card)
export const AppShellColors = {
  background: "#0a0e12",
  title: "#e8eef5",
  subtitle: "#8b9aab",
  hintBackground: "#141c24",
  hintBorder: "#1f2a36",
  hintText: "#8b9aab",
} as const;

// Connect / Disconnect toolbar
export const ConnectionColors = {
  primary: "#1c9c76",
  primaryText: "#ffffff",
  secondaryBackground: "#1f2a36",
  secondaryBorder: "#2d3d4d",
  secondaryText: "#e8eef5",
} as const;

// Connection status row on home
export const StatusColors = {
  label: "#8b9aab",
  value: "#c5d0e0",
  ok: "#5ee9b5",
  pending: "#fbbf24",
  err: "#f87171",
} as const;

// Cross-feature accents
export const SemanticColors = {
  link: "#60a5fa",
  liveIndicator: "#22c55e",
  transparent: "transparent",
  orderBookErrorBanner: "rgba(61, 30, 30, 0.5)",
  orderBookReconnectBanner: "rgba(22, 53, 49, 0.35)",
} as const;
