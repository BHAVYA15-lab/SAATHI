/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10202F",
        indigo: {
          DEFAULT: "#142B45",
          dark: "#1E3A5F",
        },
        saffron: {
          DEFAULT: "#E08D3C",
          light: "#F6DAB3",
        },
        teal: {
          DEFAULT: "#1F8A83",
          light: "#D3ECE9",
        },
        coral: {
          DEFAULT: "#C0392B",
          light: "#F8DAD5",
        },
        cloud: "#F3F5F6",
        mist: "#E1E6E9",
        grey: "#5B6672",
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "sans-serif"],
        serif: ["'Fraunces'", "serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      }
    },
  },
  plugins: [],
}
