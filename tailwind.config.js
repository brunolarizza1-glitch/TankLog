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
        // Design System Colors
        'primary-blue': '#1e40af',
        'accent-gold': '#f59e0b',
        'success-green': '#059669',
        'warning-amber': '#d97706',
        'danger-red': '#dc2626',
        'gray-50': '#f8fafc',
        'gray-200': '#e2e8f0',
        'gray-500': '#64748b',
        'gray-700': '#334155',
        
        // Brand tokens (legacy compatibility)
        brand: {
          blue: '#1e40af', // Updated to match design system
          accent: '#f59e0b', // Updated to match design system
          dark: '#334155', // Updated to match design system
          light: '#FFFFFF',
        },
        // Legacy tokens (keep for compatibility)
        primary: '#1e40af',
        accent: '#f59e0b',
        'text-primary': '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.06)',
        'md': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
