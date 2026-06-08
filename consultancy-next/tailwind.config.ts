import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // L8EntSpace brand: electric pink (#ff1493) replaces the legacy pink scale.
        // Overriding the `pink-*` ramp shifts every existing pink utility to the new brand colour.
        pink: {
          50: '#fff0f7',
          100: '#ffe0ef',
          200: '#ffb8da',
          300: '#ff85bf',
          400: '#ff47a3',
          500: '#ff1493',
          600: '#e00d80',
          700: '#b80a69',
          800: '#920a55',
          900: '#760c48',
          950: '#4a0029',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
