import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: '#fafafa',
          950: '#09090b',
        },
      },
    },
  },
  plugins: [],
}
export default config
