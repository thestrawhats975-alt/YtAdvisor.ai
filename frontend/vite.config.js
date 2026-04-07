import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '../',
  envPrefix: ['VITE_', 'BACKEND_'],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  }
})
