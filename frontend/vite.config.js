import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy manda /api al backend en desarrollo, asi el frontend no depende de
// CORS ni de una URL absoluta. En produccion se sirve el build estatico y se
// configura VITE_API_URL si el backend vive en otro host.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Separa las librerias de gráficas en su propio chunk: cambian poco y así
    // el navegador las cachea aparte del código de la aplicación.
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          motion: ['framer-motion'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
