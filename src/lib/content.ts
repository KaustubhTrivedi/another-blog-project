import { createServerFn } from '@tanstack/react-start'
import {
  fetchAbout,
  fetchPost,
  fetchPosts,
  fetchPostsWithTag,
} from './strapi.server'

// Server functions: route loaders call these on the server during SSR, and
// over RPC on client-side navigation. The Strapi URL and token never reach
// the browser.

const slugInput = (slug: unknown) => {
  if (typeof slug !== 'string' || slug === '') throw new Error('Expected a slug')
  return slug
}

export const getPosts = createServerFn().handler(() => fetchPosts())

export const getPost = createServerFn()
  .validator(slugInput)
  .handler(({ data }) => fetchPost(data))

export const getPostsWithTag = createServerFn()
  .validator(slugInput)
  .handler(({ data }) => fetchPostsWithTag(data))

export const getTags = createServerFn().handler(async () => {
  const counts = new Map<string, number>()
  for (const post of await fetchPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b))
})

export const getAbout = createServerFn().handler(() => fetchAbout())

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
