import { createFileRoute } from '@tanstack/react-router'
import { MapExplorer } from '@/components/explorer/MapExplorer'

export const Route = createFileRoute('/')({ component: ExplorerPage })

function ExplorerPage() {
  return <MapExplorer />
}
