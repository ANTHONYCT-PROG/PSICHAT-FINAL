/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        danger: '#EF4444',
        warning: '#F97316',
        emotion: {
          joy: '#10B981',
          sadness: '#3B82F6',
          anger: '#EF4444',
          fear: '#8B5CF6',
          neutral: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}

