import { createFileRoute, notFound } from '@tanstack/react-router'
import { getAbout } from '../lib/content'
import { site } from '../lib/site'

export const Route = createFileRoute('/about')({
  loader: async () => {
    const page = await getAbout()
    if (!page) throw notFound()
    return page
  },
  head: () => ({ meta: [{ title: `about | ${site.title}` }] }),
  component: About,
})

function About() {
  const page = Route.useLoaderData()
  return (
    <article>
      <h2>{page.title}</h2>
      <div className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
    </article>
  )
}
