/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdfb',
          100: '#d3f7f1',
          400: '#2dd4c6',
          500: '#0f9c92',
          600: '#0f766e',
          700: '#0e5f59',
          900: '#0a3733'
        },
        status: {
          pending: '#94a3b8',
          progress: '#2563eb',
          conforms: '#16a34a',
          ofi: '#d97706',
          minor: '#ea580c',
          major: '#dc2626'
        }
      },
      borderRadius: {
        xl2: '1rem'
      }
    }
  },
  plugins: []
}
