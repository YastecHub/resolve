import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  const iconsMode = process.env.VITE_ICONS_MODE ?? env.VITE_ICONS_MODE ?? 'api';
  const app = path.resolve(import.meta.dirname, 'app');

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      alias: [
        ...(iconsMode === 'offline'
          ? [
              {
                find: '~/components/icon-renderer',
                replacement: path.join(app, 'components/icon-renderer.offline.tsx'),
              },
            ]
          : []),
        { find: '~', replacement: app },
      ],
    },
    server: {
      port: 5175,
      proxy: {
        '/api': { target: process.env.API_URL ?? 'http://localhost:9000', changeOrigin: true },
      },
    },
  };
});
