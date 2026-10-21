/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#f5f6f8',
          surface: '#ffffff',
          surface2: '#f8f9fb',
          surface3: '#edf0f3',
          border: '#e0e5e9',
        },
        accent: {
          yellow: '#176753',
          orange: '#ab642a',
          blue: '#176753',
        },
        status: {
          success: '#4d7a5d',
          danger: '#a45147',
          warning: '#8f7a35',
        },
        text: {
          primary: '#242c35',
          secondary: '#536170',
          tertiary: '#667482',
        }
      },
      fontFamily: {
        bebas: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
