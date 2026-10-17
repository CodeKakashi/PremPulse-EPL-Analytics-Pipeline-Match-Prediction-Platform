import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0b10",
          secondary: "#0f1119",
          card: "#151822",
          hover: "#1c2030",
        },
        border: {
          subtle: "#1e2433",
          accent: "#2a3150",
        },
        accent: {
          emerald: "#10b981",
          teal: "#14b8a6",
          blue: "#3b82f6",
          violet: "#8b5cf6",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-delay": "fade-in 0.5s ease-out 0.1s forwards",
        "fade-in-delay-2": "fade-in 0.5s ease-out 0.2s forwards",
        "fade-in-delay-3": "fade-in 0.5s ease-out 0.3s forwards",
        "pulse-slow": "pulse 2s ease-in-out infinite",
        "spin-slow": "spin-slow 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
