import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'STL Urban Analytics' },
      {
        name: 'description',
        content:
          'Unified urban data analytics for St. Louis — 311 Complaints, Transit Equity, Vacancy Triage',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/urbanslu/icon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/urbanslu/icon_32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/urbanslu/icon_16.png' },
      { rel: 'apple-touch-icon', href: '/urbanslu/apple-touch-icon.png' },
    ],
  }),

  component: RootLayout,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Link
        to="/"
        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Back home
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <Outlet />
    </TooltipProvider>
  )
}
