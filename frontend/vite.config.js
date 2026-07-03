import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const plugins = [
    react(),
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
  ]

  // Only include electron plugin for production builds
  if (command === 'build') {
    // Dynamically import electron plugin only for builds
    // For dev, we just serve as a web app
  }

  return {
    plugins,
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          timeout: 1800000,
          proxyTimeout: 1800000
        },
        '/bulletins': {
          target: 'http://localhost:5000',
          timeout: 1800000,
          proxyTimeout: 1800000
        }
      }
    }
  }
})
