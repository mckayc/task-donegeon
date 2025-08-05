/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'donegeon-brown': {
          DEFAULT: '#6B4F4B', // Muted brown for UI elements
          dark: '#5C4033', // Darker brown for backgrounds
        },
        'donegeon-gray': {
          DEFAULT: '#4A5568', // Stone gray
          dark: '#2D3748', // Darker slate
        },
        'donegeon-green': {
          DEFAULT: '#38A169', // Forest green for success/primary actions
          dark: '#2F855A', // Darker forest green
        },
        'donegeon-parchment': '#CFBFAD', // Neutral parchment for text backgrounds
        'donegeon-text': '#E2E8F0', // Light text color for dark backgrounds
        'donegeon-accent': '#4FD1C5', // Muted teal/cyan for highlights and titles
        'donegeon-red': '#E53E3E', // For error states
        'donegeon-orange': '#ED8936', // For warning states
      },
      fontFamily: {
        'medieval': ['MedievalSharp', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}