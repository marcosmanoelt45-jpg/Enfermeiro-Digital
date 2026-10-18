import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB para suportar os módulos clínicos interativos
      },
      manifest: {
        name: 'Enfere · Simulação & Raciocínio Clínico de Enfermagem',
        short_name: 'Enfere',
        description: 'Plataforma de raciocínio clínico, Processo de Enfermagem COFEN nº 736/2024, simulações realísticas e videoteca de habilidades de enfermagem.',
        theme_color: '#0284c7',
        background_color: '#0b1329',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
})
