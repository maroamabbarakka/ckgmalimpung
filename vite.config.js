import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo_malimpung.png', 'logo_pinrang.png', 'puskesmas_malimpung.jpg', 'pkmmalimpungicon.png'],
      manifest: {
        name: 'TERSANJUNG - Puskesmas Malimpung',
        short_name: 'TERSANJUNG',
        description: 'Sistem Informasi Layanan Kesehatan Berbasis Jaringan Terpadu Puskesmas Malimpung',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pkmmalimpungicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pkmmalimpungicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pkmmalimpungicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/vendor/opencv-4.8.0.js']
      }
    })
  ],
  test: {
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**']
  },
})
