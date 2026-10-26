import { createFileRoute, notFound } from '@tanstack/react-router'
import { PostMeta } from '../components/PostList'
import { getPost } from '../lib/content'
import { site } from '../lib/site'

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.slug })
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | ${site.title}` },
          ...(loaderData.description
            ? [{ name: 'description', content: loaderData.description }]
            : []),
        ]
      : [],
  }),
  component: PostPage,
})

function PostPage() {
  const post = Route.useLoaderData()
  return (
    <article>
      <header className="post-header">
        <h2>{post.title}</h2>
        <PostMeta post={post} />
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  )
}
