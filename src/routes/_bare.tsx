import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_bare')({ component: BareLayout })

function BareLayout() {
  return <Outlet />
}
