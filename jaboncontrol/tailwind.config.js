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
          bg: '#0f0f0f',
          surface: '#161616',
          surface2: '#1e1e1e',
          surface3: '#252525',
          border: '#2a2a2a',
        },
        accent: {
          yellow: '#e8b84b',
          orange: '#d4722a',
          blue: '#4b9fe8',
        },
        status: {
          success: '#4be87a',
          danger: '#e84b4b',
          warning: '#e8b84b',
        },
        text: {
          primary: '#e8e8e0',
          secondary: '#a0a098',
          tertiary: '#606060',
        }
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'cursive'],
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
