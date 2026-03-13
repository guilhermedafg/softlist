/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#FFFFFF',
        gray: {
          50: '#F9F9F9',
          100: '#F5F5F5',
          200: '#E8E8E8',
          300: '#D0D0D0',
          500: '#666666',
          700: '#333333',
        },
        cream: '#F8F4E6',
        caramel: '#D4A574',
        success: '#4CAF50',
        error: '#F44336',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/forms'),
  ],
}
