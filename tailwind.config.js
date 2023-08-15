/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
export default {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
    colors: {
      ...colors,
    }
  },
  plugins: [],
}

