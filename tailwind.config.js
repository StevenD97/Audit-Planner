/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DATUM design system — brand carries the "Action · primary" role
        // (buttons, active nav, links, focus), anchored on #1F5FA8.
        brand: {
          50: '#EAF2FB',
          100: '#D3E4F6',
          200: '#A8C9ED',
          300: '#7CAEE3',
          400: '#4B8FD8',
          500: '#3574BE',
          600: '#1F5FA8',
          700: '#194C87',
          800: '#153E6E',
          900: '#0F2E52'
        },
        // Chrome-only cyan-teal accent — logo/wordmark touches, never body UI.
        accent: {
          400: '#3FB9C9',
          500: '#4CC4D4'
        },
        // System-generated / Audit Intelligence Engine accent.
        intelligence: {
          50: '#F3F0FA',
          100: '#E7E0F5',
          400: '#9478D0',
          500: '#7D5FB8',
          600: '#6B4FA0',
          700: '#57408A',
          900: '#332450'
        },
        // Five states, never a sixth — status colour is the only semantic axis.
        status: {
          pending: '#5C6572',
          progress: '#1F5FA8',
          conforms: '#1F8A5F',
          ofi: '#B5761A',
          minor: '#B8332A',
          major: '#8A1538'
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      borderRadius: {
        xl2: '1rem'
      }
    }
  },
  plugins: []
}
