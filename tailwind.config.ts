import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        paper: "#f7f5ef",
        brand: "#0f766e",
        accent: "#d97706"
      },
      boxShadow: {
        soft: "0 12px 36px rgba(23, 33, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
