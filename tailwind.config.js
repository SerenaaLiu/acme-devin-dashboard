/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      opacity: {
        '3': '0.03',
        '7': '0.07',
        '8': '0.08',
      }
    },
  },
  plugins: [],
}
