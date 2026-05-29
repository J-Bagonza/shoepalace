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
        brand: {
          red: "#E8001D",
          bone: "#F5F0E8",
          black: "#0A0A0A",
          charcoal: "#1A1A1A",
        },
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "sans-serif"],
        dm: ["var(--font-dm-sans)", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(4rem, 10vw, 9rem)", { lineHeight: "0.95" }],
        "display-lg": ["clamp(3rem, 7vw, 6rem)", { lineHeight: "0.95" }],
        "display-md": ["clamp(2rem, 5vw, 4rem)", { lineHeight: "1" }],
      },
      spacing: {
        "nav-h": "72px",
      },
      transitionTimingFunction: {
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "marquee": "marquee 20s linear infinite",
        "marquee-pause": "marquee 20s linear infinite paused",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;