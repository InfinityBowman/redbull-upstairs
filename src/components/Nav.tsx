import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  Group01Icon,
  Home03Icon,
  Location01Icon,
} from '@hugeicons/core-free-icons'
import { commandBarEvents } from '@/lib/ai/command-bar-events'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="grid h-10 grid-cols-[1fr_auto_1fr] items-center px-4">
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
        <button
          onClick={() => commandBarEvents.emit()}
          className="flex w-64 items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={2} />
          <span className="max-sm:hidden">Ask AI</span>
          <kbd
            className="rounded border border-border/60 bg-muted/60 px-1 py-px text-[0.55rem] leading-none max-sm:hidden"
            suppressHydrationWarning
          >
            {typeof navigator !== 'undefined' &&
            /Mac|iPhone/.test(navigator.userAgent)
              ? '\u2318K'
              : 'Ctrl+K'}
          </kbd>
        </button>
        <nav className="flex items-center justify-end gap-1">
          <Link
            to="/explore"
            className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            Explorer
          </Link>
          <Link
            to="/housing"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            <HugeiconsIcon icon={Home03Icon} size={14} strokeWidth={2} />
            <span className="max-sm:hidden">Housing</span>
          </Link>
          <Link
            to="/affected"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            <HugeiconsIcon icon={Location01Icon} size={14} strokeWidth={2} />
            <span className="max-sm:hidden">Affected Areas</span>
          </Link>
          <Link
            to="/population"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            <HugeiconsIcon icon={Group01Icon} size={14} strokeWidth={2} />
            <span className="max-sm:hidden">Population</span>
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
