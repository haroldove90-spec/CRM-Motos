import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'qromotoslogo.png', 'qromotosicono.png'],
        manifest: {
          id: '/',
          name: 'CRM Motos - Taller de Motocicletas',
          short_name: 'CRM Motos',
          description: 'Sistema Integral de Gestión y CRM para Talleres de Motocicletas',
          theme_color: '#DD040F',
          background_color: '#010101',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/qromotosicono.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/qromotosicono.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/qromotosicono.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
