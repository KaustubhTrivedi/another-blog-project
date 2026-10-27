import { createFileRoute } from '@tanstack/react-router'

// Open to every crawler, AI crawlers included. To opt out of AI training,
// add a block per bot, e.g. "User-agent: GPTBot" + "Disallow: /".
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const root = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
        // Search engines accept an RSS feed as a sitemap.
        const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_serverFn/

Sitemap: ${root}/rss.xml
`
        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
