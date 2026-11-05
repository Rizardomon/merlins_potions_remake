/** Converts a hex color to its WCAG relative luminance (0–1). */
export function hexToRelativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const linearize = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Returns the WCAG contrast ratio between two hex colors. */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = hexToRelativeLuminance(fg);
  const l2 = hexToRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Canonical design token values. Single source of truth for tests. */
export const DESIGN_TOKENS = {
  bg: "#f5f2ec",
  surface: "#fbf9f5",
  text: "#1f1a26",
  text2: "#4a4352",
  accent: "#4b2e83",
  accentStrong: "#3b2268",
  accentSoft: "#d9c7f2",
  accentText: "#4b2e83",
} as const;
