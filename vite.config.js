import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'Montra - Catat Uang',
        short_name: 'Montra',
        description: 'Catat keuangan cerdas dengan bantuan Asep AI',
        theme_color: '#0D0C12',
        background_color: '#0D0C12',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
        ]
      },
      workbox: {
        // Mencegah Service Worker memblokir request Firebase Auth (login Google)
        navigateFallbackDenylist: [/^\/__/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'google-apis',
            },
          },
          {
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'firebase-auth',
            },
          }
        ]
      }
    })
  ]
})
