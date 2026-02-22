import { createFileRoute } from '@tanstack/react-router'
import { MapExplorer } from '@/components/explorer/MapExplorer'

export const Route = createFileRoute('/_app/explore')({ component: ExplorePage })

function ExplorePage() {
  return <MapExplorer />
}
