import type { Config } from "tailwindcss";

/**
 * Theme mapped over CSS custom properties from globals.css.
 * Light-only — no dark mode.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        content: {
          DEFAULT: "var(--text)",
          2: "var(--text-2)",
          3: "var(--text-3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
          soft: "var(--accent-soft)",
          text: "var(--accent-text)",
        },
        green: { DEFAULT: "var(--green)", soft: "var(--green-soft)" },
        red: { DEFAULT: "var(--red)", soft: "var(--red-soft)" },
        blue: { DEFAULT: "var(--blue)", soft: "var(--blue-soft)" },
      },
      borderRadius: {
        input: "10px",
        card: "16px",
        modal: "20px",
        pill: "20px",
      },
      boxShadow: {
        card: "var(--shadow)",
        lg: "var(--shadow-lg)",
        ring: "0 0 0 3px var(--ring)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      maxWidth: {
        content: "1480px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        pop: {
          from: { opacity: "0", transform: "scale(.97) translateY(-5px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "fade-up": "fade-up .28s cubic-bezier(.4,0,.2,1)",
        pop: "pop .16s cubic-bezier(.4,0,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
