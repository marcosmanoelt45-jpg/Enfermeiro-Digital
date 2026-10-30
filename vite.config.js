import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://xwqgyvqofxdqdbhltdzf.supabase.co'),
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
