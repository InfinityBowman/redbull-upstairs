import { createFileRoute } from '@tanstack/react-router'
import { AffectedNeighborhoodsDashboard } from '@/components/explorer/dashboard/AffectedNeighborhoodsDashboard'

export const Route = createFileRoute('/_app/affected')({
  component: AffectedPage,
})

function AffectedPage() {
  return <AffectedNeighborhoodsDashboard />
}
