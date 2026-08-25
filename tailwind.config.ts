import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "var(--sand)",
        limestone: "var(--limestone)",
        pine: "var(--pine)",
        moss: "var(--moss)",
        clay: "var(--clay)",
        ochre: "var(--ochre)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        positive: "var(--positive)"
      },
      boxShadow: { soft: "0 12px 35px rgba(38, 56, 45, .07)" },
      fontFamily: { sans: ["var(--font-manrope)", "sans-serif"] }
    }
  },
  plugins: []
};
export default config;
