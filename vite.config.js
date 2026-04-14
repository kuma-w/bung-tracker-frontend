import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': 'http://localhost:3000',
      '/payments': 'http://localhost:3000',
      '/payment': 'http://localhost:3000',
    }
  }
})
