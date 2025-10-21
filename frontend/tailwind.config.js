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
          navy: '#0D2959',      // Deep Navy - Primary
          'navy-light': '#1a3a6e',
          'navy-dark': '#081b3d',
          cyan: '#24C3EE',      // Bright Cyan - Secondary
          'cyan-light': '#50d1f3',
          'cyan-dark': '#1aa6d1',
          lavender: '#E8E5F6',  // Soft Lavender - Accent
          'lavender-light': '#f3f1fb',
          'lavender-dark': '#dad5ef',
          charcoal: '#222222',  // Text
          emerald: '#1EC87E',   // Success
          'emerald-light': '#4dd69c',
          'emerald-dark': '#18a166',
          amber: '#F7B32B',     // Warning
          'amber-light': '#f9c659',
          'amber-dark': '#d99722',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        thai: ['Prompt', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
