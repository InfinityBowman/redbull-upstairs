import { createFileRoute } from '@tanstack/react-router'
import { HousingPricesDashboard } from '@/components/explorer/dashboard/HousingPricesDashboard'

export const Route = createFileRoute('/_app/housing')({
  component: HousingPage,
})

function HousingPage() {
  return <HousingPricesDashboard />
}
