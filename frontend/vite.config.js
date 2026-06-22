import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import electron from 'vite-plugin-electron'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.js',
      },
      {
        entry: 'electron/preload.js',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['hero.png', 'edutrack-icon.svg'],
      manifest: {
        name: 'EduTrack',
        short_name: 'EduTrack',
        description: 'Système de gestion scolaire bilingue',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'edutrack-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'edutrack-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'edutrack-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/bulletins': 'http://localhost:5000'
    }
  }
})
