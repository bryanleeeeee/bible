import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "rgb(var(--ground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        lapis: "rgb(var(--lapis) / <alpha-value>)",
        gilt: "rgb(var(--gilt) / <alpha-value>)",
        sage: "rgb(var(--sage) / <alpha-value>)",
      },
      fontFamily: {
        scripture: ["var(--font-scripture)"],
        ui: ["var(--font-ui)"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        soft: "0 1px 2px rgb(16 32 48 / 0.04), 0 8px 24px rgb(16 32 48 / 0.06)",
        lift: "0 2px 4px rgb(16 32 48 / 0.06), 0 16px 40px rgb(16 32 48 / 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
