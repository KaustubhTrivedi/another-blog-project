import { createFileRoute } from '@tanstack/react-router'
import { site } from '../lib/site'
import { fetchPostsWithBody } from '../lib/strapi.server'

const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // SITE_URL wins when the server sits behind a proxy that rewrites the host.
        const root = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
        const posts = await fetchPostsWithBody()
        const items = posts
          .map((post) => {
            const link = `${root}/posts/${post.slug}`
            return `    <item>
      <title>${escape(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
${post.tags.map((t) => `      <category>${escape(t)}</category>`).join('\n')}
      <description>${escape(post.html)}</description>
    </item>`
          })
          .join('\n')
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(site.title)}</title>
    <link>${root}/</link>
    <description>${escape(site.description)}</description>
${items}
  </channel>
</rss>
`
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
          },
        })
      },
    },
  },
})
