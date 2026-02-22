import { getVoiceById } from '../layers/CommunityVoiceLayer'
import { cn } from '@/lib/utils'

const sourceIcons: Record<string, string> = {
  survey: '📋',
  social: '💬',
  forum: '💭',
  meeting: '🏛️',
}

const topicLabels: Record<string, string> = {
  safety: 'Safety',
  infrastructure: 'Infrastructure',
  transit: 'Transit',
  food: 'Food Access',
  housing: 'Housing',
  parks: 'Parks & Recreation',
}

const sentimentColors: Record<string, string> = {
  positive: 'text-emerald-500',
  neutral: 'text-gray-500',
  negative: 'text-red-500',
}

const sentimentLabels: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Concern',
}

export function CommunityVoiceDetail({ id }: { id: string }) {
  const voice = getVoiceById(id)

  if (!voice) {
    return (
      <div className="text-xs text-muted-foreground">
        Community voice not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{sourceIcons[voice.source] || '💬'}</span>
          <div>
            <div className="text-sm font-bold">{voice.neighborhood}</div>
            <div className="text-[0.6rem] text-muted-foreground">
              {topicLabels[voice.topic] || voice.topic}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-3">
        <blockquote className="border-l-2 border-primary/50 pl-3 italic text-foreground/90">
          "{voice.quote}"
        </blockquote>
        <div className="mt-2 text-[0.65rem] text-muted-foreground">
          — {voice.author}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            Sentiment:
          </span>
          <span
            className={cn(
              'text-xs font-semibold',
              sentimentColors[voice.sentiment],
            )}
          >
            {sentimentLabels[voice.sentiment]}
          </span>
        </div>
        <div className="text-[0.6rem] text-muted-foreground">
          {new Date(voice.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="text-[0.6rem] text-muted-foreground">
        Source: {voice.source.charAt(0).toUpperCase() + voice.source.slice(1)}
      </div>
    </div>
  )
}
