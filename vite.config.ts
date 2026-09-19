import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// HRMS is a separate multi-page app entry (hrms-app.html) living in the same
// Vite project — so its bundle/CSS only ever loads for someone actually on an
// /hrms-app/* URL, never bleeding into CA-Management's own pages, without
// needing to rewrite any of HRMS's own (extensively global) CSS. In dev mode
// Vite only serves *.html files at their literal path, so this middleware
// rewrites any /hrms-app/* sub-route (e.g. /hrms-app/SuperAdmin/dashboard) to
// serve hrms-app.html, exactly like a normal SPA history-fallback.
function hrmsAppFallback(): Plugin {
  return {
    name: 'hrms-app-history-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/hrms-app') && !req.url.startsWith('/hrms-app.html')) {
          req.url = '/hrms-app.html'
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), hrmsAppFallback()],
  resolve: {
    alias: {
      // Only HRMS's own source (under src/hrms) uses this alias — CA-Management's
      // own files use plain relative imports, so there's no collision.
      '@': path.resolve(__dirname, './src/hrms'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        hrmsApp: path.resolve(__dirname, 'hrms-app.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // HRMS's uploaded files (profile pictures, documents) and 3D model assets,
      // served as static files by the backend.
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/models': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // HRMS's socket.io client connects to the current origin by default —
      // the actual server lives on CA-Backend's port.
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
