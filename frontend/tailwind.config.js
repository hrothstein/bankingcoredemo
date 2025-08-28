/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banking: {
          primary: '#1e40af',
          secondary: '#059669',
          accent: '#7c3aed',
        }
      }
    },
  },
  plugins: [],
}