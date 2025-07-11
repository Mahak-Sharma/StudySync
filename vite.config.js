import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // Automatically open browser when dev server starts
    port: 5173, // Default Vite port
    host: true  // Allow external connections
  },
})
