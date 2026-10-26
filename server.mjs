// Production server: static files from dist/client, everything else
// rendered on request by the TanStack Start handler.
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'
import app from './dist/server/server.js'

// Files under /assets/ have content hashes in their names, so they never change.
const hashedAssets = staticMiddleware({ dir: 'dist/client', maxAge: 31536000, immutable: true })
const publicFiles = staticMiddleware({ dir: 'dist/client' })

serve({
  port: Number(process.env.PORT ?? 3000),
  middleware: [
    (request, next) =>
      new URL(request.url).pathname.startsWith('/assets/')
        ? hashedAssets(request, next)
        : publicFiles(request, next),
  ],
  fetch: app.fetch,
})
