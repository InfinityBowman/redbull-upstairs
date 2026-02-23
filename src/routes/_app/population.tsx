import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/population')({
  component: PopulationPage,
})

function PopulationPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Population Trends
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Coming soon — real Census population data integration in progress.
        </p>
      </div>
    </div>
  )
}
