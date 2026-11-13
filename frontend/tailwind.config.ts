import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        // Emerald — visual direction from the user's dashboard reference.
        primary: {
          50: "#ECFAF2",
          100: "#D9F4E5",
          200: "#B3E8CC",
          300: "#83D6AC",
          400: "#35B989",
          500: "#00845E",
          600: "#007F5B",
          700: "#006B4C",
          800: "#07543F",
          900: "#0B4033",
          950: "#092B24",
          DEFAULT: "#007F5B",
          foreground: "#FFFFFF",
        },
        // Secondary — Indigo Hangat
        secondary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        // Accent — Amber Hangat
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        // Neutral — Warm Gray
        neutral: {
          0: "#ffffff",
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        // Semantic
        success: { 50: "#f0fdf4", 500: "#22c55e", 600: "#16a34a" },
        warning: { 50: "#fffbeb", 500: "#f59e0b", 600: "#d97706" },
        error: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626" },
        info: { 50: "#eff6ff", 500: "#3b82f6", 600: "#2563eb" },
        // Member colors
        member: {
          sky: "#0ea5e9",
          rose: "#f43f5e",
          violet: "#8b5cf6",
          amber: "#f59e0b",
          emerald: "#10b981",
          orange: "#f97316",
          pink: "#ec4899",
          indigo: "#6366f1",
        },
        // Shadcn/UI compatible tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.5" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["13px", { lineHeight: "1.6" }],
        lg: ["15px", { lineHeight: "1.5" }],
        xl: ["17px", { lineHeight: "1.4" }],
        "2xl": ["20px", { lineHeight: "1.3" }],
        "3xl": ["24px", { lineHeight: "1.2" }],
        "4xl": ["32px", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};
export default config;
