import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ブランドカラー
        brand: {
          purple: "#7C3AED",
          cyan: "#06B6D4",
          dark: "#0F0F1A",
          card: "#16162A",
          border: "#2A2A45",
        },
        // トラストレベル
        trust: {
          l1: "#6B7280",
          l2: "#3B82F6",
          l3: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
