import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <article>
      <h2>Not found</h2>
      <p>
        There's nothing here. Try the <Link to="/">post list</Link>.
      </p>
    </article>
  )
}
