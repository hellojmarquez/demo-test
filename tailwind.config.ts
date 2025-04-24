import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f4ccc',
          light: '#1182c7',
          medium: '#1070c9',
          dark: '#105eca'
        },
        fondo: '#f0ecf1'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'] // Si tenés Brandmark Sans u otra fuente custom, se puede integrar aquí
      }
    }
  },
  plugins: []
}

export default config
