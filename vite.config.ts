import { existsSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

// Make .env (STRAPI_URL, REVALIDATE_SECRET, ...) visible to server code in dev.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  plugins: [tanstackStart(), react()],
})
