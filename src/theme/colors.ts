/**
 * VaultKey design system — centralized color tokens.
 * Keep every raw hex/rgba here so screens never have magic strings.
 */

export type ThemeColors = {
  bg: string;
  bgCard: string;
  bgCardHover: string;
  bgInput: string;
  bgSection: string;
  bgGlass: string;
  border: string;
  borderInput: string;
  borderAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  accent: string;
  accentDim: string;
  accentBright: string;
  accentBg: string;
  accentBorder: string;
  strength: readonly [string, string, string, string, string];
  strengthDim: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  errorText: string;
  star: string;
  starDim: string;
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  blobBlue: string;
  blobPurple: string;
};

export const darkColors: ThemeColors = {
  bg: "#060B17",
  bgCard: "rgba(255,255,255,0.03)",
  bgCardHover: "rgba(255,255,255,0.06)",
  bgInput: "rgba(255,255,255,0.05)",
  bgSection: "rgba(255,255,255,0.04)",
  bgGlass: "rgba(6, 11, 23, 0.7)",
  border: "rgba(255,255,255,0.12)",
  borderInput: "rgba(255,255,255,0.15)",
  borderAccent: "rgba(91,141,239,0.5)",
  textPrimary: "#FFFFFF",
  textSecondary: "#8B94A8",
  textMuted: "#5A6478",
  textAccent: "#D2DCF0",
  accent: "#5B8DEF",
  accentDim: "rgba(91,141,239,0.2)",
  accentBright: "#7BA8FF",
  accentBg: "rgba(91,141,239,0.14)",
  accentBorder: "rgba(91,141,239,0.45)",
  strength: ["#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E"],
  strengthDim: "#1B2D4D",
  success: "#22C55E",
  successBg: "rgba(34,197,94,0.18)",
  warning: "#F59E0B",
  warningBg: "rgba(245,158,11,0.18)",
  error: "#EF4444",
  errorBg: "rgba(239,68,68,0.18)",
  errorText: "#F87171",
  star: "#F59E0B",
  starDim: "rgba(245,158,11,0.22)",
  tabBg: "rgba(11,16,32,0.96)",
  tabBorder: "rgba(255,255,255,0.1)",
  tabActive: "#5B8DEF",
  tabInactive: "#4A5568",
  blobBlue: "#5B8DEF",
  blobPurple: "#7C3AED",
};

export const lightColors: ThemeColors = {
  bg: "#F4F7FA", // Soothing soft off-white/gray
  bgCard: "#FFFFFF",
  bgCardHover: "#F9FAFC",
  bgInput: "#FFFFFF",
  bgSection: "#EAEFF4",
  bgGlass: "rgba(255, 255, 255, 0.7)",
  border: "rgba(0,0,0,0.08)",
  borderInput: "rgba(0,0,0,0.1)",
  borderAccent: "rgba(91,141,239,0.3)",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textAccent: "#3B82F6",
  accent: "#3B82F6",
  accentDim: "rgba(59,130,246,0.15)",
  accentBright: "#2563EB",
  accentBg: "rgba(59,130,246,0.1)",
  accentBorder: "rgba(59,130,246,0.3)",
  strength: ["#EF4444", "#F97316", "#EAB308", "#65A30D", "#16A34A"],
  strengthDim: "#E2E8F0",
  success: "#16A34A",
  successBg: "rgba(22,163,74,0.15)",
  warning: "#D97706",
  warningBg: "rgba(217,119,6,0.15)",
  error: "#DC2626",
  errorBg: "rgba(220,38,38,0.15)",
  errorText: "#B91C1C",
  star: "#F59E0B",
  starDim: "rgba(245,158,11,0.2)",
  tabBg: "rgba(255,255,255,0.96)",
  tabBorder: "rgba(0,0,0,0.05)",
  tabActive: "#3B82F6",
  tabInactive: "#94A3B8",
  blobBlue: "#3B82F6",
  blobPurple: "#8B5CF6",
};

// Default export for backward compatibility during refactor
export const Colors = darkColors;

/** Returns a deterministic accent color for a given site name (letter avatars). */
export const siteColor = (siteName: string): string => {
  const palette = [
    "#5B8DEF", "#7C3AED", "#EC4899", "#F59E0B",
    "#10B981", "#06B6D4", "#EF4444", "#8B5CF6",
    "#14B8A6", "#F97316", "#84CC16", "#6366F1",
  ];
  let hash = 0;
  for (let i = 0; i < siteName.length; i++) {
    hash = (hash * 31 + siteName.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
};
