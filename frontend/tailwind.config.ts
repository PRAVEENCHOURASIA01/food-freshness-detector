import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      colors: {
        cream: {
          50:  "#FDFCF9",
          100: "#FAF8F3",
          200: "#F0EBE0",
          300: "#E2D9C9",
        },
        ink: {
          950: "#0C0E10",
          900: "#141820",
          800: "#1E2530",
          700: "#2A3342",
          500: "#4B5B6E",
          400: "#7A8BA0",
          300: "#AAB8C8",
          200: "#D0DAE4",
          100: "#EBF0F5",
        },
        leaf: {
          700: "#0D6B3A",
          600: "#15A348",
          500: "#21C55C",
          200: "#BBF7D0",
          50:  "#F0FDF4",
        },
        honey: {
          700: "#B35108",
          500: "#F59E0B",
          200: "#FDE68A",
          50:  "#FFFBEB",
        },
        ruby: {
          700: "#BC1034",
          500: "#F43F5E",
          200: "#FECDD3",
          50:  "#FFF1F2",
        },
      },
      boxShadow: {
        sm:     "0 1px 2px rgba(0,0,0,0.05)",
        card:   "0 1px 4px rgba(0,0,0,0.05), 0 6px 24px rgba(0,0,0,0.07)",
        lg:     "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        float:  "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        leaf:   "0 0 0 3px rgba(33,197,92,0.18)",
        honey:  "0 0 0 3px rgba(245,158,11,0.18)",
        ruby:   "0 0 0 3px rgba(244,63,94,0.18)",
        "inner-top": "inset 0 1px 0 rgba(255,255,255,0.9)",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn:   { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scanDown: {
          "0%":   { top: "0%",   opacity: "0.8" },
          "50%":  { opacity: "1" },
          "100%": { top: "100%", opacity: "0.4" },
        },
        pulseRing: {
          "0%":   { transform: "scale(1)",   opacity: "0.5" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        barFill: {
          "0%":   { width: "0%" },
          "100%": { width: "var(--bar-w)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        floatDot: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
      },
      animation: {
        fadeUp:    "fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
        fadeIn:    "fadeIn 0.4s ease both",
        scaleIn:   "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        scanDown:  "scanDown 2.2s ease-in-out infinite",
        pulseRing: "pulseRing 2s ease-out infinite",
        barFill:   "barFill 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s forwards",
        shimmer:   "shimmer 2s linear infinite",
        floatDot:  "floatDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
