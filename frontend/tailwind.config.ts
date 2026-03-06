import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/providers/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFBFC",
        surface: {
          DEFAULT: "#FFFFFF",
          hover: "#F9FAFB",
        },
        border: {
          DEFAULT: "#E5E7EB",
          hover: "#D1D5DB",
        },
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          muted: "rgba(37, 99, 235, 0.08)",
        },
        secondary: {
          DEFAULT: "#6B7280",
          muted: "rgba(107, 114, 128, 0.08)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          muted: "rgba(245, 158, 11, 0.08)",
        },
        danger: {
          DEFAULT: "#EF4444",
          muted: "rgba(239, 68, 68, 0.08)",
        },
        success: {
          DEFAULT: "#10B981",
          muted: "rgba(16, 185, 129, 0.08)",
        },
        text: {
          DEFAULT: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        heading: ["var(--font-dm-sans)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "slide-down": "slide-down 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee var(--duration, 30s) infinite linear",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - 2rem))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
