/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const target = env.VITE_API_URL || 'http://localhost:4000';

  return {
    plugins: [tailwindcss(), react()],

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },

    server: {
      port: 5173,
      proxy: {
        '/graphql': {
          target,
          changeOrigin: true,
          ws: true,
        },
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'vendor';
              if (id.includes('react-router-dom')) return 'router';
              if (id.includes('@apollo/client') || id.includes('graphql')) return 'apollo';
              if (id.includes('recharts')) return 'charts';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },

    test: {
      globals: true,
      environment: 'jsdom',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/types/generated/**'],
      },
    },
  };
});
