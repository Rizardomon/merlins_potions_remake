import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  hexToRelativeLuminance,
  contrastRatio,
  DESIGN_TOKENS,
} from "./theme";

const CSS_PATH = resolve(__dirname, "../app/globals.css");
const TAILWIND_PATH = resolve(__dirname, "../../tailwind.config.ts");

const css = readFileSync(CSS_PATH, "utf-8");
const tailwind = readFileSync(TAILWIND_PATH, "utf-8");

// ── 5.1 Token presence ──────────────────────────────────────────────────────

describe("design tokens — globals.css", () => {
  it("defines the cream background token", () => {
    expect(css).toContain(`--bg: ${DESIGN_TOKENS.bg}`);
  });

  it("defines the deep ink text token", () => {
    expect(css).toContain(`--text: ${DESIGN_TOKENS.text}`);
  });

  it("defines the purple accent token", () => {
    expect(css).toContain(`--accent: ${DESIGN_TOKENS.accent}`);
  });

  it("defines the purple accent-strong token", () => {
    expect(css).toContain(`--accent-strong: ${DESIGN_TOKENS.accentStrong}`);
  });

  it("defines the purple accent-soft token", () => {
    expect(css).toContain(`--accent-soft: ${DESIGN_TOKENS.accentSoft}`);
  });
});

// ── 5.4 No dark mode ────────────────────────────────────────────────────────

describe("dark mode removal", () => {
  it('globals.css has no [data-theme="dark"] selector', () => {
    expect(css).not.toContain('[data-theme="dark"]');
  });

  it("globals.css has no dark color-scheme declaration", () => {
    expect(css).not.toContain("color-scheme: dark");
  });

  it('tailwind.config.ts has no darkMode selector config', () => {
    expect(tailwind).not.toContain("darkMode");
  });
});

// ── WCAG AA contrast ────────────────────────────────────────────────────────

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

describe("WCAG AA contrast — hexToRelativeLuminance", () => {
  it("returns 0 for pure black", () => {
    expect(hexToRelativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("returns 1 for pure white", () => {
    expect(hexToRelativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("WCAG AA contrast — contrastRatio", () => {
  it("black on white gives 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("deep ink text on cream background passes AA (≥4.5)", () => {
    const ratio = contrastRatio(DESIGN_TOKENS.text, DESIGN_TOKENS.bg);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it("deep ink text on white surface passes AA (≥4.5)", () => {
    const ratio = contrastRatio(DESIGN_TOKENS.text, DESIGN_TOKENS.surface);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it("white text on purple accent passes AA (≥4.5)", () => {
    const ratio = contrastRatio("#ffffff", DESIGN_TOKENS.accent);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it("accent-text on accent-soft passes AA for large text (≥3.0)", () => {
    const ratio = contrastRatio(DESIGN_TOKENS.accentText, DESIGN_TOKENS.accentSoft);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
  });
});
