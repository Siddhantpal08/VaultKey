/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060B17",
        surface: "rgba(30, 41, 59, 0.4)",
        primary: "#5B8DEF",
        accent: "#F59E0B"
      }
    },
  },
  plugins: [],
}
