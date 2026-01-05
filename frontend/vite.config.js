// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- Add this import

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // v-- Add this 'resolve' section --v
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})