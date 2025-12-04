import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 새 버전 배포 시, 서비스워커가 자동으로 업데이트됩니다.
      registerType: 'autoUpdate',

      // favicon, 아이콘, thumbnail 등 “그냥 정적 파일”도 PWA 자산에 포함.
      includeAssets: [
        '/images/favicon.ico',
        '/images/icon-192.png',
        '/images/icon-512.png',
        '/images/thumbnail.png',
      ],

      manifest: {
        name: "Senior Software Developer's CPD",
        short_name: 'SSDCPD',
        description:
          'Continuing Professional Development page for a senior software developer, with curated hands-on GitHub repositories.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
          {
            src: '/images/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/images/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    })
  ],
})
