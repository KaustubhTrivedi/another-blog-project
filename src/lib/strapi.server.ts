import { marked } from 'marked'
import type { Page, Post, PostSummary } from './types'

// Server-only. Pages are rendered on request from Strapi data, ISR-style:
// responses are cached in memory and served stale-while-revalidate, and
// Strapi calls /api/revalidate on every content change to clear the cache.

const STRAPI_URL = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '')
const STRAPI_TOKEN = process.env.STRAPI_TOKEN
const REVALIDATE_MS = Number(process.env.REVALIDATE_SECONDS ?? 60) * 1000

type CacheEntry = { value: unknown; fetchedAt: number; refreshing: boolean }

// On globalThis so dev-server module reloads share one cache.
const store = ((globalThis as any).__strapiCache ??= {
  entries: new Map<string, CacheEntry>(),
  inFlight: new Map<string, Promise<unknown>>(),
  generation: 0,
}) as {
  entries: Map<string, CacheEntry>
  inFlight: Map<string, Promise<unknown>>
  generation: number
}

export function revalidateAll() {
  store.entries.clear()
  store.inFlight.clear()
  // Fetches that started before this call must not write old data back.
  store.generation++
}

function load(url: string) {
  const existing = store.inFlight.get(url)
  if (existing) return existing
  const generation = store.generation
  const promise = request(url)
    .then((value) => {
      if (generation === store.generation) {
        store.entries.set(url, { value, fetchedAt: Date.now(), refreshing: false })
      }
      return value
    })
    .finally(() => store.inFlight.delete(url))
  store.inFlight.set(url, promise)
  return promise
}

async function cached(url: string) {
  const entry = store.entries.get(url)
  if (!entry) return load(url)
  if (Date.now() - entry.fetchedAt > REVALIDATE_MS && !entry.refreshing) {
    // Serve the stale copy now and refresh in the background. If Strapi is
    // down, keep serving stale data rather than failing the page.
    entry.refreshing = true
    load(url).catch((error) => {
      entry.refreshing = false
      console.error(`Background refresh failed for ${url}:`, error)
    })
  }
  return entry.value
}

async function request(url: string) {
  const res = await fetch(url, {
    headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
  })
  if (res.status === 404) return NOT_FOUND
  if (!res.ok) throw new Error(`Strapi responded ${res.status} for ${url}`)
  return res.json()
}

const NOT_FOUND = Symbol('not found')

type StrapiPost = {
  title: string
  slug: string
  date: string
  description: string | null
  body?: string
  tags?: { name: string }[]
}

type StrapiList<T> = {
  data: T[]
  meta: { pagination: { page: number; pageCount: number } }
}

async function strapi<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const value = await cached(`${STRAPI_URL}/api/${path}?${new URLSearchParams(params)}`)
  if (value === NOT_FOUND) throw new StrapiNotFound(path)
  return value as T
}

class StrapiNotFound extends Error {}

const summaryFields = {
  'fields[0]': 'title',
  'fields[1]': 'slug',
  'fields[2]': 'date',
  'fields[3]': 'description',
  'populate[tags][fields][0]': 'name',
  'sort[0]': 'date:desc',
}

function toSummary(post: StrapiPost): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    description: post.description ?? undefined,
    tags: (post.tags ?? []).map((tag) => tag.name).sort(),
  }
}

const render = (markdown: string) => marked.parse(markdown, { async: false })

// Strapi caps page size at 100, so walk every page.
async function listPosts(filters: Record<string, string> = {}, withBody = false) {
  const posts: StrapiPost[] = []
  for (let page = 1; ; page++) {
    const res = await strapi<StrapiList<StrapiPost>>('posts', {
      ...summaryFields,
      ...(withBody ? { 'fields[4]': 'body' } : {}),
      ...filters,
      'pagination[page]': String(page),
      'pagination[pageSize]': '100',
    })
    posts.push(...res.data)
    if (page >= res.meta.pagination.pageCount) return posts
  }
}

export async function fetchPosts(): Promise<PostSummary[]> {
  return (await listPosts()).map(toSummary)
}

export async function fetchPostsWithTag(tag: string): Promise<PostSummary[]> {
  return (await listPosts({ 'filters[tags][name][$eq]': tag })).map(toSummary)
}

export async function fetchPostsWithBody(): Promise<Post[]> {
  return (await listPosts({}, true)).map((post) => ({
    ...toSummary(post),
    html: render(post.body ?? ''),
  }))
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const res = await strapi<StrapiList<StrapiPost>>('posts', {
    ...summaryFields,
    'fields[4]': 'body',
    'filters[slug][$eq]': slug,
  })
  const post = res.data[0]
  return post ? { ...toSummary(post), html: render(post.body ?? '') } : null
}

export async function fetchAbout(): Promise<Page | null> {
  try {
    const res = await strapi<{ data: { title: string; body: string } | null }>('about')
    return res.data ? { title: res.data.title, html: render(res.data.body) } : null
  } catch (error) {
    // Strapi answers 404 until the About single type has been saved once.
    if (error instanceof StrapiNotFound) return null
    throw error
  }
}
