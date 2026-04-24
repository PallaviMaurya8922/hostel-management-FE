/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        sidebar: {
          DEFAULT: '#0f1729',
          light: '#162036',
        },
        status: {
          active: {
            light: '#dcfce7',
            DEFAULT: '#16a34a',
            dark: '#166534',
          },
          pending: {
            light: '#fef3c7',
            DEFAULT: '#eab308',
            dark: '#854d0e',
          },
          rejected: {
            light: '#fee2e2',
            DEFAULT: '#dc2626',
            dark: '#991b1b',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05)',
        'glass-sm': '0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.06)',
        'glass-lg': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.08)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
