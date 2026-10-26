import { Link, createFileRoute } from '@tanstack/react-router'
import { getTags } from '../lib/content'
import { site } from '../lib/site'

export const Route = createFileRoute('/tags/')({
  loader: () => getTags(),
  head: () => ({ meta: [{ title: `tags | ${site.title}` }] }),
  component: Tags,
})

function Tags() {
  return (
    <article>
      <h2>Tags</h2>
      <ul>
        {Route.useLoaderData().map(([tag, count]) => (
          <li key={tag}>
            <Link to="/tags/$tag" params={{ tag }}>
              {tag}
            </Link>{' '}
            ({count})
          </li>
        ))}
      </ul>
    </article>
  )
}
