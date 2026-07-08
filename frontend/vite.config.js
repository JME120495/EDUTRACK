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
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
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
    // Force re-optimization des dépendances à chaque démarrage pour éviter les caches périmés
    optimizeDeps: {
      force: true,
    },
    server: {
      host: true, // Permet d'exposer le serveur sur le réseau local (et de faire fonctionner l'HMR sur mobile)
      port: 3000,
      // Améliorer les performances HMR lors des longues sessions
      hmr: {
        overlay: true,
      },
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
