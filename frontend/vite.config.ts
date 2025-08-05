
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Use 'localhost' for standard local development
    host: 'localhost',
    proxy: {
      '/api': {
        // When running `npm run dev`, forward API requests to the local backend server
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
