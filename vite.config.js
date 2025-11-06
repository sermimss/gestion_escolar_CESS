// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// BASE_URL: si vas a servir la app desde una subcarpeta en Apache,
// establece la variable de entorno BASE_URL=/miapp (sin slash final) antes del build.
// Ejemplo: BASE_URL=/miapp npm run build
const base = process.env.BASE_URL || '/'

export default defineConfig({
  base, // importante para que los assets usen la ruta correcta en producción
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    // Desarrollo: si estás en Replit u otro host que cambia la URL,
    // puedes permitir todos ('all') o poner la variable de entorno REPLIT_PUBLIC_HOST
    allowedHosts: process.env.DEV_ALLOW_ALL ? ['all'] : (process.env.REPLIT_PUBLIC_HOST ? [process.env.REPLIT_PUBLIC_HOST] : []),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // optimiza si necesitas entradas especiales
    },
  },
})
