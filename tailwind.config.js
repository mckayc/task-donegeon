
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,pages,hooks,App}.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-brown': {
          '100': '#EAE0D5',
          '300': '#C6AC8F',
          '500': '#8D6E63',
          '700': '#5D4037',
          '900': '#3E2723',
        },
        'brand-green': {
          '100': '#E8F5E9',
          '300': '#A5D6A7',
          '500': '#4CAF50',
          '700': '#2E7D32',
          '900': '#1B5E20',
        },
        'brand-gray': {
          '100': '#CFD8DC',
          '300': '#90A4AE',
          '500': '#607D8B',
          '700': '#455A64',
          '900': '#263238',
        }
      },
      fontFamily: {
        'cinzel': ['"Cinzel Decorative"', 'serif'],
        'quattrocento': ['"Quattrocento"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
