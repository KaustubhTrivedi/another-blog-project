/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { site } from '../lib/site'
import css from '../styles/site.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: site.description },
      { title: site.title },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@700;900&display=swap',
      },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: site.title,
        href: '/rss.xml',
      },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  // ISR-style caching for any CDN in front of the server: serve a cached copy
  // for a minute, then serve stale while one request re-renders it.
  headers: () => ({
    'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="container">
          <header className="site-header">
            <h1 className="site-title">
              <Link to="/">{site.title}</Link>
            </h1>
            <nav>
              <Link to="/about">about</Link>
              {' | '}
              <Link to="/tags">tags</Link>
              {' | '}
              <a href="/rss.xml">rss</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
        <Scripts />
      </body>
    </html>
  )
}

function ErrorPage() {
  return (
    <RootDocument>
      <article>
        <h2>Something went wrong</h2>
        <p>The content couldn't be loaded. Try again in a moment.</p>
      </article>
    </RootDocument>
  )
}
