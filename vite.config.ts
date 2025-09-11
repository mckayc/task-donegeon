
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-image-crop',
        'react-pdf',
        'react-reader',
        '@google/genai',
        'emoji-picker-react',
        'framer-motion',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        '@radix-ui/react-slot',
        'lucide-react',
        /^react-dom\/.*/,
        /^pdfjs-dist\/.*/,
        /^@fullcalendar\/.*/,
      ],
    },
  },
})
