import { useCallback, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Search01Icon,
  SentIcon,
} from '@hugeicons/core-free-icons'
import { useData, useExplorer } from './ExplorerProvider'
import { useChartBuilder } from './analytics/chart-builder/useChartBuilder'
import type { ActionResult } from '@/lib/ai/action-executor'
import type { ToolCall } from '@/lib/ai/use-chat'
import { executeToolCall } from '@/lib/ai/action-executor'
import { commandBarEvents } from '@/lib/ai/command-bar-events'
import { buildKpiSnapshot } from '@/lib/ai/kpi-snapshot'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { useChat } from '@/lib/ai/use-chat'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Show me crime hotspots',
  'What neighborhoods have the most complaints?',
  'Compare vacancy rates across neighborhoods',
  'Show transit coverage',
  'Which areas are food deserts?',
]

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [actionResults, setActionResults] = useState<Array<ActionResult>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { state, dispatch } = useExplorer()
  const data = useData()
  const [, chartDispatch] = useChartBuilder()
  const { messages, isStreaming, sendMessage, toolCalls } = useChat()

  // Refs for values needed in tool execution (avoids re-running effect on state changes)
  const stateRef = useRef(state)
  stateRef.current = state
  const dataRef = useRef(data)
  dataRef.current = data

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Listen for global event emitter (from Nav button)
  useEffect(() => {
    return commandBarEvents.listen(() => setOpen(true))
  }, [])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Execute tool calls when they arrive (only re-run when toolCalls changes)
  useEffect(() => {
    if (toolCalls.length === 0) return
    const results: Array<ActionResult> = []
    for (const tc of toolCalls) {
      const result = executeToolCall(tc, {
        state: stateRef.current,
        dispatch,
        chartDispatch,
        data: dataRef.current,
      })
      results.push(result)
    }
    setActionResults(results)
  }, [toolCalls, dispatch, chartDispatch])

  const handleSubmit = useCallback(
    async (text?: string) => {
      const query = text ?? input.trim()
      if (!query || isStreaming) return

      setInput('')
      setActionResults([])

      const kpiSnapshot = buildKpiSnapshot(state, data)
      const context = buildSystemPrompt(state, kpiSnapshot, data)
      await sendMessage(query, context)
    },
    [input, isStreaming, state, data, sendMessage],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 z-50 flex w-[420px] flex-col',
        'left-[calc(280px+(100vw-280px)/2)] -translate-x-1/2',
        'rounded-xl border border-border/60 bg-card/90 shadow-xl backdrop-blur-xl',
        'animate-in fade-in slide-in-from-bottom-3 duration-200',
        'max-sm:inset-x-2 max-sm:bottom-2 max-sm:w-auto max-sm:translate-x-0',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            strokeWidth={2}
            className="text-muted-foreground"
          />
          <span className="text-xs font-medium text-muted-foreground">
            Ask AI
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex max-h-[50vh] min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
        style={{ scrollbarGutter: 'stable' }}
      >
        {messages.length === 0 ? (
          /* Suggestions when empty */
          <div className="flex flex-col gap-1">
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Suggestions
            </span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSubmit(s)}
                className="rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-1">
                {msg.role === 'user' ? (
                  <div className="text-xs font-medium text-foreground">
                    {msg.content}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {/* Action badges */}
            {actionResults.some((r) => r.description) && (
              <div className="flex flex-wrap gap-1.5">
                {actionResults
                  .filter((r) => r.description)
                  .map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-accent/60 px-2 py-0.5 text-[0.6rem] font-medium text-accent-foreground"
                    >
                      {r.description}
                    </span>
                  ))}
              </div>
            )}

            {/* Follow-up quick actions */}
            {!isStreaming && messages.length > 0 && messages.at(-1)?.role === 'assistant' && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSubmit('Chart this data for me')}
                  className="rounded-md border border-border/40 px-2 py-1 text-[0.6rem] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                >
                  Chart this
                </button>
                <button
                  onClick={() => handleSubmit('Tell me more details')}
                  className="rounded-md border border-border/40 px-2 py-1 text-[0.6rem] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                >
                  Tell me more
                </button>
                <button
                  onClick={() => handleSubmit('Which neighborhoods are most affected?')}
                  className="rounded-md border border-border/40 px-2 py-1 text-[0.6rem] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                >
                  By neighborhood
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the data..."
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim()}
            className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent/40 hover:text-foreground disabled:opacity-30"
          >
            <HugeiconsIcon icon={SentIcon} size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}
