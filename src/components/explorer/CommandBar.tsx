import { useCallback, useEffect, useRef, useState } from 'react'
import { useData, useExplorer } from './ExplorerProvider'
import { useChartBuilder } from './analytics/chart-builder/useChartBuilder'
import type { ActionResult } from '@/lib/ai/action-executor'
import type { ToolCall } from '@/lib/ai/use-chat'
import { executeToolCall } from '@/lib/ai/action-executor'
import { commandBarEvents } from '@/lib/ai/command-bar-events'
import { buildKpiSnapshot } from '@/lib/ai/kpi-snapshot'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { useChat } from '@/lib/ai/use-chat'
import { Dialog, DialogContent } from '@/components/ui/dialog'

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

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Listen for global event emitter (from Nav button)
  useEffect(() => {
    return commandBarEvents.listen(() => setOpen(true))
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Execute tool calls when they arrive
  useEffect(() => {
    if (toolCalls.length === 0) return
    const results: Array<ActionResult> = []
    for (const tc of toolCalls) {
      const result = executeToolCall(tc, {
        state,
        dispatch,
        chartDispatch,
        data,
      })
      results.push(result)
    }
    setActionResults(results)
  }, [toolCalls, state, dispatch, chartDispatch, data])

  const handleSubmit = useCallback(
    async (text?: string) => {
      const query = text ?? input.trim()
      if (!query || isStreaming) return

      setInput('')
      setActionResults([])

      const kpiSnapshot = buildKpiSnapshot(state, data)
      const context = buildSystemPrompt(state, kpiSnapshot)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] translate-y-0 sm:max-w-xl"
      >
        {/* Input area */}
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the data..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            disabled={isStreaming}
          />
          {isStreaming && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          )}
        </div>

        {/* Messages area */}
        {messages.length > 0 && (
          <div
            ref={scrollRef}
            className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto border-t border-border/40 pt-3"
          >
            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-1">
                {msg.role === 'user' ? (
                  <div className="text-xs font-medium text-foreground">
                    {msg.content}
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {/* Action badges */}
            {actionResults.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {actionResults.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-accent/60 px-2 py-0.5 text-[0.6rem] font-medium text-accent-foreground"
                  >
                    {r.description}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggestions when empty */}
        {messages.length === 0 && (
          <div className="flex flex-col gap-1 border-t border-border/40 pt-3">
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
        )}

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-border/40 pt-2">
          <span className="text-[0.6rem] text-muted-foreground/50">
            Powered by AI — results may not be exact
          </span>
          <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[0.55rem] text-muted-foreground">
            ESC
          </kbd>
        </div>
      </DialogContent>
    </Dialog>
  )
}
