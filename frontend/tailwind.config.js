/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"IM Fell English SC"', 'serif'],
        'serif': ['"IM Fell English SC"', 'serif'],
      }
    },
  },
  plugins: [],
}
