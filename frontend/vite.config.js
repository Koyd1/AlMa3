import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  allowedHosts: [
      'alma3-1-psmt.onrender.com'
    ],
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // keep path as-is (/api -> /api) for FastAPI routes
      },
    },
  },
})