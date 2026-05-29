/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'minghuang': {
          50: '#fffcf0',
          100: '#fff8dc',
          200: '#fff0b3',
          300: '#ffe680',
          400: '#ffdc4d',
          500: '#F4BB2E',
          600: '#e6a525',
          700: '#c98c1e',
          800: '#a67018',
          900: '#8a5c14',
          950: '#4d340a',
        },
        'yexing': {
          50: '#fdf0ed',
          100: '#faeee8',
          200: '#f4d5cc',
          300: '#ecb5a6',
          400: '#e28f77',
          500: '#D76B58',
          600: '#c55a4a',
          700: '#a3483e',
          800: '#853d36',
          900: '#6c342f',
          950: '#3a1917',
        },
        paper: {
          50: '#fefdfa',
          100: '#fdf9f3',
          200: '#f9f0e3',
          300: '#f3e4d0',
        },
        ink: {
          50: '#f8f7f6',
          100: '#eeebe7',
          200: '#ddd7cf',
          300: '#c8beb0',
          400: '#b0a191',
          500: '#9a8a77',
          600: '#857568',
          700: '#6c6057',
          800: '#5a5049',
          900: '#4c443e',
          950: '#2a2522',
        }
      },
      fontFamily: {
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)',
        'warm': '0 2px 8px rgba(215, 107, 88, 0.12)',
      }
    },
  },
  plugins: [],
};
