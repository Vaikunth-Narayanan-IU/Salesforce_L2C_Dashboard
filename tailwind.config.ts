import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Salesforce-like blue palette (primary UI accent)
        brand: {
          50: "#E6F7FE",
          100: "#CCEEFC",
          200: "#99DDF9",
          300: "#66CBF5",
          400: "#33BAF2",
          500: "#00A1E0",
          600: "#0089C3",
          700: "#006F9E",
          800: "#00587D",
          900: "#003B55"
        },
        card: {
          DEFAULT: "rgb(255 255 255)",
          foreground: "rgb(15 23 42)"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

