// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(0.92 0.01 250)",
        input: "oklch(0.92 0.01 250)",
        ring: "oklch(0.45 0.15 250)",
        background: "oklch(0.98 0.005 270)",
        foreground: "oklch(0.2 0.02 250)",
        primary: {
          DEFAULT: "oklch(0.45 0.15 250)",
          foreground: "oklch(1 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.94 0.01 250)",
          foreground: "oklch(0.35 0.05 250)",
        },
        destructive: {
          DEFAULT: "oklch(0.6 0.2 25)",
          foreground: "oklch(1 0 0)",
        },
        muted: {
          DEFAULT: "oklch(0.94 0.01 250)",
          foreground: "oklch(0.5 0.02 250)",
        },
        accent: {
          DEFAULT: "oklch(0.7 0.15 45)",
          foreground: "oklch(1 0 0)",
        },
        success: {
          DEFAULT: "oklch(0.65 0.12 180)",
          foreground: "oklch(1 0 0)",
        },
        popover: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.2 0.02 250)",
        },
        card: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.2 0.02 250)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};