// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gh-daily-data',
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: 'gh-daily',
        short_name: 'gh-daily',
        description: 'GitHub Trending archive with read tracking',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
