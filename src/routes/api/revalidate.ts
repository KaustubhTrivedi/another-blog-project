import { timingSafeEqual } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { revalidateAll } from '../../lib/strapi.server'

// Strapi calls this on every content change (see cms/src/index.ts).
// Clears the cache so the next request renders fresh content.
export const Route = createFileRoute('/api/revalidate')({
  server: {
    handlers: {
      POST: ({ request }) => {
        const expected = process.env.REVALIDATE_SECRET
        const given = request.headers.get('x-revalidate-secret') ?? ''
        if (!expected || !safeEqual(given, expected)) {
          return new Response('Unauthorized', { status: 401 })
        }
        revalidateAll()
        return Response.json({ revalidated: true, at: new Date().toISOString() })
      },
    },
  },
})

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
