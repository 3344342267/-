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
        wood: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f1d7bc',
          300: '#e7ba8f',
          400: '#db965c',
          500: '#d17937',
          600: '#c3622d',
          700: '#a14c28',
          800: '#823f28',
          900: '#6b3625',
          950: '#3a1a11',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        paper: {
          50: '#fefdfa',
          100: '#fdfaf3',
          200: '#faf4e6',
          300: '#f5ead3',
        }
      },
      fontFamily: {
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        'warm': '0 2px 8px rgba(139, 115, 85, 0.15)',
      }
    },
  },
  plugins: [],
};
