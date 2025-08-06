import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // This rule proxies the request for the Primus client script to the backend,
      // as it's generated and served by the Node.js server, not Vite.
      '/primus.js': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // This rule proxies the Primus WebSocket connection itself.
      // The `ws: true` flag is essential for this to work.
      '/primus': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
