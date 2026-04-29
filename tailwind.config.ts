import type { Config } from "tailwindcss";

/**
 * RGB-channel-based theme tokens.
 * Each token is defined in CSS as `R G B` (no commas) so Tailwind's
 * `<alpha-value>` interpolation works with utilities like `bg-ink-100/60`.
 */
function rgb(varName: string) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: rgb("--brand-50"),
          100: rgb("--brand-100"),
          200: rgb("--brand-200"),
          300: rgb("--brand-300"),
          400: rgb("--brand-400"),
          500: rgb("--brand-500"),
          600: rgb("--brand-600"),
          700: rgb("--brand-700"),
          800: rgb("--brand-800"),
          900: rgb("--brand-900"),
        },
        ink: {
          900: rgb("--ink-900"),
          800: rgb("--ink-800"),
          700: rgb("--ink-700"),
          600: rgb("--ink-600"),
          500: rgb("--ink-500"),
          400: rgb("--ink-400"),
          300: rgb("--ink-300"),
          200: rgb("--ink-200"),
          100: rgb("--ink-100"),
          50: rgb("--ink-50"),
        },
        surface: {
          DEFAULT: rgb("--surface-primary"),
          muted: rgb("--bg-body"),
          subtle: rgb("--surface-secondary"),
        },
        danger: {
          500: rgb("--danger-500"),
          50: rgb("--danger-50"),
        },
        warning: {
          500: rgb("--warning-500"),
          50: rgb("--warning-50"),
        },
        success: {
          500: rgb("--success-500"),
          50: rgb("--success-50"),
        },
      },
      backgroundColor: {
        white: rgb("--surface-primary"),
      },
      borderColor: {
        white: rgb("--surface-primary"),
      },
      ringColor: {
        white: rgb("--surface-primary"),
      },
      divideColor: {
        white: rgb("--surface-primary"),
      },
      fontFamily: {
        sans: ["var(--font-body)"],
        body: ["var(--font-body)"],
        heading: ["var(--font-heading)"],
        display: ["var(--font-heading)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
} satisfies Config;
