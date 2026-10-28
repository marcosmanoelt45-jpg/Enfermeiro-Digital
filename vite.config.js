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
      includeAssets: ['favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        globIgnores: [
          '**/pacientes/**',
          '**/audio/**',
          '**/goti/**',
          '**/*.{webp,webm,mp4,wav,mp3}'
        ],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Enfere · Simulação & Raciocínio Clínico de Enfermagem',
        short_name: 'Enfere',
        description: 'Plataforma de raciocínio clínico, Processo de Enfermagem COFEN nº 736/2024, simulações realísticas e videoteca de habilidades de enfermagem.',
        theme_color: '#0d9488',
        background_color: '#0b1329',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
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
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@radix-ui') || id.includes('vaul') || id.includes('cmdk')) return 'vendor-ui';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('jspdf')) return 'vendor-pdf';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('react-router') || id.includes('@tanstack/react-query')) return 'vendor-router-query';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) return 'vendor-react';
        }
      }
    }
  },
  server: {
    port: 5174,
    host: true,
  },
})
