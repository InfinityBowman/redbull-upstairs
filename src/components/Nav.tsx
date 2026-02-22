import { Link } from '@tanstack/react-router'
import { commandBarEvents } from '@/lib/ai/command-bar-events'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="flex h-10 items-center justify-between px-4">
        <Link
          to="/"
          className="group flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <img
            src="/urbanslu/logo.svg"
            alt="STL Urban Analytics"
            className="h-9 w-auto"
          />
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/explore"
            className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            Explorer
          </Link>
          <Link
            to="/about"
            className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
