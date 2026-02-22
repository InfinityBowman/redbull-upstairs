import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Nav } from '@/components/Nav'

export const Route = createFileRoute('/_app')({ component: AppLayout })

function AppLayout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}
