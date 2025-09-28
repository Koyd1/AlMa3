import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}   // 🔹 фиксим потенциальные ошибки при сборке
  },
  server: {
    allowedHosts: [
      'alma3-backend-v1.vercel.app' // без https://
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
