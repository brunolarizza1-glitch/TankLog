/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand tokens
        brand: {
          blue: '#114FB3', // primary blue from logo
          accent: '#F6C341', // yellow outline
          dark: '#0F172A', // text (slate-like)
          light: '#FFFFFF', // white
        },
        // Legacy tokens (keep for compatibility)
        primary: '#114FB3',
        accent: '#F6C341',
        'text-primary': '#0F172A',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
