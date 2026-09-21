export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui", "-apple-system", "Segoe UI",
          "Roboto", "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
      colors: {
        base: "#F8F9FC",
        mist: {
          blue: "#DCEAFB",
          lavender: "#E7E1FB",
          peach: "#FCE7DC",
        },
        accent: {
          DEFAULT: "#0EA5A0",
          50: "#EBFBFA",
          100: "#CFF5F2",
          200: "#A7E8E2",
          300: "#6DD6CD",
          400: "#38BFB6",
          500: "#0EA5A0",
          600: "#0C8A86",
          700: "#0A6F6C",
          800: "#08534F",
          900: "#053835",
        },
        critical: {
          DEFAULT: "#F0472B",
          50: "#FEECE9",
          100: "#FDD3CB",
          200: "#FBA994",
          300: "#F87F5D",
          400: "#F46340",
          500: "#F0472B",
          600: "#D6371D",
          700: "#AC2B17",
          800: "#821F11",
          900: "#58150B",
        },
      },
      boxShadow: {
        glass: "0 8px 32px -8px rgba(79, 70, 130, 0.18)",
        "glass-sm": "0 4px 16px -4px rgba(79, 70, 130, 0.14)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "glow-border": {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(240,71,43,0.25), 0 8px 32px -8px rgba(240,71,43,0.25)" },
          "50%": { boxShadow: "0 0 0 1px rgba(240,71,43,0.5), 0 8px 32px -4px rgba(240,71,43,0.4)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "glow-border": "glow-border 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
