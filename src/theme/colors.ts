/**
 * VaultKey design system — centralized color tokens.
 * Keep every raw hex/rgba here so screens never have magic strings.
 */

export const Colors = {
  // ─── Backgrounds ──────────────────────────────────────────────────────
  bg: "#060B17", // Crevio deep navy
  bgCard: "rgba(255,255,255,0.03)",
  bgCardHover: "rgba(255,255,255,0.06)",
  bgInput: "rgba(255,255,255,0.05)",
  bgSection: "rgba(255,255,255,0.04)",
  bgGlass: "rgba(6, 11, 23, 0.7)", // For glassmorphic overlays

  // ─── Borders ──────────────────────────────────────────────────────────
  border: "rgba(255,255,255,0.12)",
  borderInput: "rgba(255,255,255,0.15)",
  borderAccent: "rgba(91,141,239,0.5)",

  // ─── Text ─────────────────────────────────────────────────────────────
  textPrimary: "#FFFFFF",
  textSecondary: "#8B94A8",
  textMuted: "#5A6478",
  textAccent: "#D2DCF0",

  // ─── Accent / brand ───────────────────────────────────────────────────
  accent: "#5B8DEF",
  accentDim: "rgba(91,141,239,0.2)",
  accentBright: "#7BA8FF",
  accentBg: "rgba(91,141,239,0.14)",
  accentBorder: "rgba(91,141,239,0.45)",

  // ─── Strength palette (index 1–5) ─────────────────────────────────────
  strength: ["#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E"] as const,
  strengthDim: "#1B2D4D",

  // ─── Status ───────────────────────────────────────────────────────────
  success: "#22C55E",
  successBg: "rgba(34,197,94,0.18)",
  warning: "#F59E0B",
  warningBg: "rgba(245,158,11,0.18)",
  error: "#EF4444",
  errorBg: "rgba(239,68,68,0.18)",
  errorText: "#F87171",

  // ─── Favourite ────────────────────────────────────────────────────────
  star: "#F59E0B",
  starDim: "rgba(245,158,11,0.22)",

  // ─── Tab bar ──────────────────────────────────────────────────────────
  tabBg: "rgba(11,16,32,0.96)",
  tabBorder: "rgba(255,255,255,0.1)",
  tabActive: "#5B8DEF",
  tabInactive: "#4A5568",

  // ─── Overlay blobs ────────────────────────────────────────────────────
  blobBlue: "#5B8DEF",
  blobPurple: "#7C3AED",
};

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
