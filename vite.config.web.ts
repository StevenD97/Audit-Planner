import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone browser build (no Electron) — used to publish Audit Planner as
// a plain static web app (e.g. GitHub Pages), separate from
// electron.vite.config.ts which builds the desktop shell. Same renderer
// source, same knowledge base and engines; only the platform layer
// (src/renderer/src/platform) differs at runtime, picking the browser
// implementation because `window.api` doesn't exist outside Electron.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  // Relative base so the build works at any path (GitHub Pages project
  // sites are served from /<repo>/, not /) without needing to know the
  // final path at build time. Paired with HashRouter in the app so
  // client-side routes don't need server rewrite rules either.
  base: './',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html')
    }
  },
  plugins: [react()]
})
