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
          bg: '#0b0d10',
          surface: '#12161b',
          surface2: '#181d24',
          surface3: '#202630',
          border: '#2b3440',
        },
        accent: {
          yellow: '#d9a441',
          orange: '#d97a35',
          blue: '#5aa7f0',
        },
        status: {
          success: '#3ddc84',
          danger: '#ef5b5b',
          warning: '#d9a441',
        },
        text: {
          primary: '#edf1f5',
          secondary: '#aab3bd',
          tertiary: '#6f7a86',
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
