import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {}, // 🔹 фиксим ошибки с process.env
  },
  server: {
    allowedHosts: [
      'alma3-backend-v1.vercel.app', // без https://
    ],
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // для локальной разработки
        changeOrigin: true,
      },
    },
  },
})
