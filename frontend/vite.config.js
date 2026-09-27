import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets any file import from the root of `src`, so a page three folders deep
    // writes `@/components/ui/Button` instead of `../../../components/ui/Button`.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Fail loudly rather than silently sliding to 5174. The backend's CORS
    // allow-list only includes http://localhost:5173, so a quiet fallback looks
    // like a working app while every API call fails on CORS.
    strictPort: true,
  },
})
