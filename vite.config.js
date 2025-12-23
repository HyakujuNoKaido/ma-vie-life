import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ce fichier indique à Vercel d'utiliser le moteur React
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
})
