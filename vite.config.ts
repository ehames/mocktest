import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/a2-mocktest/',
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/a2-mocktest\/questions\/.+\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'question-banks',
              networkTimeoutSeconds: 4,
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /\/images\/part7\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'part7-images',
              expiration: { maxEntries: 500 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'A2 Key Mock Test',
        short_name: 'A2 Mock Test',
        description: 'Cambridge A2 Key Reading & Writing practice test',
        theme_color: '#0B2447',
        background_color: '#EEF1F5',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
