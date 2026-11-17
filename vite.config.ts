import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' → build działa z dowolnej ścieżki (GitHub Pages, Netlify, plik lokalny)
export default defineConfig({
  base: './',
  plugins: [react()],
})
