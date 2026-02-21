import { Link } from '@tanstack/react-router'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="flex h-14 items-center px-5">
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-bold tracking-tight"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground shadow-sm">
            STL
          </div>
          <span className="text-foreground transition-colors group-hover:text-primary">
            Urban Analytics
          </span>
        </Link>
      </div>
    </header>
  )
}
