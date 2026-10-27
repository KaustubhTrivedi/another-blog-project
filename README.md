# kaustubh trivedi

A personal site that reads like a rendered markdown file: one narrow serif column, a post list, and no other decoration.

- **Blog:** [TanStack Start](https://tanstack.com/start) with TanStack Router, rendered on the server.
- **Content:** [Strapi](https://strapi.io) 5 in `cms/`, backed by SQLite.

Posts you publish in Strapi appear on the blog on the next page load. You don't rebuild or redeploy the blog.

## How updates reach the blog

The blog caches content the way Next.js ISR does:

1. Each page is rendered on request from Strapi data. The Strapi responses are cached in memory on the blog server.
2. Cached data is fresh for `REVALIDATE_SECONDS` (60 by default). After that, visitors still get the cached copy immediately while it is refreshed in the background. If Strapi is down, the blog keeps serving the last good copy.
3. When you create, edit, publish, unpublish, or delete a post, a tag, or the about page, Strapi calls `POST /api/revalidate` on the blog (`cms/src/index.ts`). That clears the cache, so the change shows up on the next request without waiting for it to expire.

Pages also send `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=86400`. If you put a CDN such as Cloudflare in front, it caches pages the same way. Because the CDN can hold a page for up to 60 seconds, edits can take that long to appear through it. Lower `s-maxage` in `src/routes/__root.tsx` if that matters.

## Running locally

Requires Node 22+.

```sh
npm run setup      # installs the blog and the CMS
npm run dev        # Strapi on :1337 and the blog on :3000
```

The first time, open http://localhost:1337/admin and create your admin account. On its first start, Strapi:

- creates the about page and a first post,
- lets the public role read posts, tags, and the about page.

Both `.env` and `cms/.env` were created with a matching `REVALIDATE_SECRET`. For a fresh checkout, copy each `.env.example` to `.env` and set the same secret in both.

## Writing a post

In the Strapi admin, go to **Content Manager → Post → Create new entry**:

- **title**, **date**, and **body** are required. Body is Markdown.
- **slug** is filled from the title and becomes the URL: `/posts/<slug>`.
- **description** is optional and is used as the page's meta description.
- **tags** links to Tag entries. Each tag gets a page at `/tags/<name>`.

Save keeps the post as a draft. Only published posts appear on the blog.

The about page is **Content Manager → About**.

## Where things are

```
src/lib/strapi.server.ts   Strapi client, cache, and Markdown rendering (server only)
src/lib/content.ts         Server functions that route loaders call
src/routes/                One file per page, plus rss[.]xml.ts, robots[.]txt.ts, api/revalidate.ts
src/styles/site.css        All styling, including dark mode
server.mjs                 Production server
cms/src/api/               Strapi content types: post, tag, about
cms/src/index.ts           Public read permissions and the revalidate hook
cms/src/seed.ts            Starter content
```

## Configuration

Blog (`.env`):

| Variable | Purpose |
| --- | --- |
| `STRAPI_URL` | Where the blog reaches Strapi. Default `http://localhost:1337`. |
| `STRAPI_TOKEN` | Optional read-only API token, if you turn off public read access. |
| `REVALIDATE_SECRET` | Must match `cms/.env`. |
| `REVALIDATE_SECONDS` | How long cached data counts as fresh. Default `60`. |
| `SITE_URL` | Public URL for RSS and robots.txt links. Defaults to the request's origin. |
| `PORT` | Port for `npm start`. Default `3000`. |

CMS (`cms/.env`): `BLOG_URL` is the blog URL Strapi calls to clear the cache, and `REVALIDATE_SECRET` is the same secret. The other values are Strapi's own settings.

## Deploying

You run two Node processes, each on a host with a persistent disk:

```sh
# Blog
npm ci && npm run build
npm start

# CMS
npm --prefix cms ci && npm run build:cms
NODE_ENV=production npm run start:cms
```

Things to get right:

- **Keep the SQLite file and uploads on persistent storage.** The database is `cms/.tmp/data.db` (change it with `DATABASE_FILENAME`) and uploads go to `cms/public/uploads`. A host that wipes the disk on deploy will lose your posts. A VPS, Fly.io with a volume, or Railway or Render with a disk all work.
- **The two services must reach each other.** Strapi must be able to reach `BLOG_URL`, and the blog must be able to reach `STRAPI_URL`. The same machine with `localhost` URLs is fine.
- **Generate new secrets for production.** Use fresh `APP_KEYS`, JWT secrets, and `REVALIDATE_SECRET` rather than the local ones.
- **Run one blog instance.** The cache is in memory, so with several instances only the one Strapi calls gets cleared. The others catch up after `REVALIDATE_SECONDS`.

GitHub Pages and Cloudflare Pages static hosting no longer work for this setup, because pages are rendered on request.
