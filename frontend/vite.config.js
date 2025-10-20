import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://comprihensive-domain-audit-x2iq-kyvbbp9eq-vichu071s-projects.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    include: ['framer-motion'],
  },
  build: {
    outDir: 'build', // <-- change from default 'dist'
    commonjsOptions: {
      include: [/node_modules/, /framer-motion/],
    },
    rollupOptions: {
      external: [], // ensure framer-motion is bundled
    }
  }
})
