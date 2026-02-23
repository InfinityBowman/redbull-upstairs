import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/affected')({
  component: AffectedPage,
})

function AffectedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Affected Neighborhoods
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Coming soon — real neighborhood impact data integration in progress.
        </p>
      </div>
    </div>
  )
}
