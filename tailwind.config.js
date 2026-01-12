/** @type {import('tailwindcss').Config} */
module.exports = {
  // IMPORTANT : On dit à Tailwind de scanner tous les fichiers HTML et TS dans src
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // Ajout d'une animation personnalisée utilisée dans l'app
      animation: {
        'fade': 'fadeIn 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
