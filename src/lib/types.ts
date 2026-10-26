export type PostSummary = {
  slug: string
  title: string
  date: string
  tags: string[]
  description?: string
}

export type Post = PostSummary & { html: string }

export type Page = { title: string; html: string }
