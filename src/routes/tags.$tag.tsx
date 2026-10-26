import { createFileRoute, notFound } from '@tanstack/react-router'
import { PostList } from '../components/PostList'
import { getPostsWithTag } from '../lib/content'
import { site } from '../lib/site'

export const Route = createFileRoute('/tags/$tag')({
  loader: async ({ params }) => {
    const posts = await getPostsWithTag({ data: params.tag })
    if (posts.length === 0) throw notFound()
    return { tag: params.tag, posts }
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.tag} | ${site.title}` }],
  }),
  component: TagPage,
})

function TagPage() {
  const { tag, posts } = Route.useLoaderData()
  return (
    <>
      <h2>Posts tagged “{tag}”</h2>
      <PostList posts={posts} />
    </>
  )
}
