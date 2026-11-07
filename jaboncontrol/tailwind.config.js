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
          bg: '#f4f6f9',
          surface: '#ffffff',
          surface2: '#f8f9fb',
          surface3: '#edf0f3',
          border: '#e0e5e9',
        },
        accent: {
          yellow: '#285bc1',
          orange: '#ab642a',
          blue: '#285bc1',
        },
        status: {
          success: '#28745c',
          danger: '#ae4946',
          warning: '#94671c',
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
