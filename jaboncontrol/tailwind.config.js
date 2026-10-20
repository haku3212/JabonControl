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
          bg: '#f3f5f4',
          surface: '#ffffff',
          surface2: '#f7f9f8',
          surface3: '#e9eeec',
          border: '#d6dfda',
        },
        accent: {
          yellow: '#176753',
          orange: '#aa6632',
          blue: '#176753',
        },
        status: {
          success: '#4d7a5d',
          danger: '#a45147',
          warning: '#8f7a35',
        },
        text: {
          primary: '#202925',
          secondary: '#4f6058',
          tertiary: '#65766e',
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
