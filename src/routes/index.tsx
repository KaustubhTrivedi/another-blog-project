import { createFileRoute } from '@tanstack/react-router'
import { PostList } from '../components/PostList'
import { getPosts } from '../lib/content'

export const Route = createFileRoute('/')({
  loader: () => getPosts(),
  component: Home,
})

function Home() {
  return <PostList posts={Route.useLoaderData()} />
}
