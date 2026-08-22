import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--hsl-border))",
        input: "hsl(var(--hsl-input))",
        ring: "hsl(var(--hsl-ring))",
        background: "hsl(var(--hsl-background))",
        foreground: "hsl(var(--hsl-foreground))",
        primary: {
          DEFAULT: "hsl(var(--hsl-primary))",
          foreground: "hsl(var(--hsl-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--hsl-secondary))",
          foreground: "hsl(var(--hsl-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--hsl-destructive))",
          foreground: "hsl(var(--hsl-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--hsl-muted))",
          foreground: "hsl(var(--hsl-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--hsl-accent))",
          foreground: "hsl(var(--hsl-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--hsl-popover))",
          foreground: "hsl(var(--hsl-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--hsl-card))",
          foreground: "hsl(var(--hsl-card-foreground))",
        },
        pink: {
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "wikai-rise": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "wikai-rise": "wikai-rise 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
