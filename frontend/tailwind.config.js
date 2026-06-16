/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#2a4d7c',
          DEFAULT: '#1E3A5F',
          dark: '#14263f',
        },
        gold: {
          light: '#f7b84f',
          DEFAULT: '#F5A623',
          dark: '#c48114',
        }
      }
    },
  },
  plugins: [],
}
