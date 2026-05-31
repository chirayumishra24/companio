/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brutal-yellow': '#F4F4F5',
        'brutal-pink': '#E11D48',
        'brutal-cyan': '#0284C7',
        'brutal-green': '#10B981',
        'brutal-purple': '#6366F1',
        'brutal-bg': '#FAFAFA',
      },
      boxShadow: {
        'brutal': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'brutal-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'brutal-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
