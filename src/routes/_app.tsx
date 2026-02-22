import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Nav } from '@/components/Nav'

export const Route = createFileRoute('/_app')({ component: AppLayout })

function AppLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Nav />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
