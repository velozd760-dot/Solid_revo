/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-card': '#f1f5f9',
        border: '#e2e8f0',
        accent: {
          blue: '#3b82f6',
          sky: '#60a5fa',
          indigo: '#6366f1',
          purple: '#8b5cf6',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ["'Google Sans'", "'Plus Jakarta Sans'", "'Outfit'", 'sans-serif'],
        display: ["'Google Sans'", "'Outfit'", "'Plus Jakarta Sans'", 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      }
    },
  },
  plugins: [],
}
