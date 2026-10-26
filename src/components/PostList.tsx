import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import { formatDate } from '../lib/content'
import type { PostSummary } from '../lib/types'

export function PostList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return <p>No posts yet.</p>
  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <h3>
            <Link to="/posts/$slug" params={{ slug: post.slug }}>
              {post.title}
            </Link>
          </h3>
          <PostMeta post={post} />
        </li>
      ))}
    </ul>
  )
}

export function PostMeta({ post }: { post: PostSummary }) {
  return (
    <small className="post-meta">
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      {post.tags.length > 0 && (
        <>
          {' │ '}
          {post.tags.map((tag, i) => (
            <Fragment key={tag}>
              {i > 0 && ', '}
              <Link to="/tags/$tag" params={{ tag }}>
                {tag}
              </Link>
            </Fragment>
          ))}
        </>
      )}
    </small>
  )
}
