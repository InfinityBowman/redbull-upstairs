import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  Delete02Icon,
  SentIcon,
  StopIcon,
} from '@hugeicons/core-free-icons'
import { useData, useExplorer } from './ExplorerProvider'
import { useChartBuilder } from './analytics/chart-builder/useChartBuilder'
import type { ActionResult } from '@/lib/ai/action-executor'
import { executeToolCall } from '@/lib/ai/action-executor'
import { commandBarEvents } from '@/lib/ai/command-bar-events'
import { executeDataTool } from '@/lib/ai/data-executor'
import { buildKpiSnapshot } from '@/lib/ai/kpi-snapshot'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import type { ToolCall } from '@/lib/ai/use-chat'
import { useChat } from '@/lib/ai/use-chat'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Human-friendly labels for tool names shown during streaming */
const TOOL_LABELS: Record<string, string> = {
  set_layers: 'Updating layers',
  set_filters: 'Setting filters',
  select_neighborhood: 'Selecting neighborhood',
  select_entity: 'Selecting entity',
  toggle_analytics: 'Opening analytics',
  configure_chart: 'Configuring chart',
  clear_selection: 'Clearing selection',
  get_city_summary: 'Fetching city stats',
  get_neighborhood_detail: 'Looking up neighborhood',
  get_rankings: 'Ranking neighborhoods',
  get_category_breakdown: 'Analyzing categories',
  get_arpa_data: 'Querying ARPA data',
  get_food_access: 'Checking food access',
}

const THINKING_WORDS = [
  'Pondering',
  'Crunching data',
  'Thinking hard',
  'Digging in',
  'On it',
  'Sifting through',
  'Connecting dots',
]

/** Smoothly reveals text character-by-character instead of in chunky SSE bursts */
function useSmoothedText(target: string, charsPerFrame = 2) {
  const [displayed, setDisplayed] = useState(target)
  const displayedRef = useRef(target)
  const targetRef = useRef(target)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    targetRef.current = target

    const tick = () => {
      const current = displayedRef.current
      const goal = targetRef.current

      if (current.length < goal.length) {
        const next = goal.slice(0, current.length + charsPerFrame)
        displayedRef.current = next
        setDisplayed(next)
        rafRef.current = requestAnimationFrame(tick)
      } else if (current !== goal) {
        // Target shrunk (reset/new conversation) — snap immediately
        displayedRef.current = goal
        setDisplayed(goal)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, charsPerFrame])

  // Snap to empty on reset
  useEffect(() => {
    if (target === '') {
      displayedRef.current = ''
      setDisplayed('')
    }
  }, [target])

  return displayed
}

/** Compact markdown overrides sized for the command bar */
const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-1.5 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1 text-xs font-semibold text-foreground">{children}</h3>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1 text-xs font-semibold text-foreground">{children}</h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1 text-xs font-semibold text-foreground">{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-1.5 list-disc pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-1.5 list-decimal pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="mb-0.5">{children}</li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-accent/60 px-1 py-0.5 text-[0.65rem]">{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">{children}</a>
  ),
}

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
  const { messages, isStreaming, sendMessage, toolCalls, pendingTools, cancel, reset } = useChat()
  const [thinkingWord, setThinkingWord] = useState('')

  // Pick a random thinking word each time streaming starts
  useEffect(() => {
    if (isStreaming) {
      setThinkingWord(THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)])
    }
  }, [isStreaming])

  // Smooth the last assistant message text during streaming
  const lastMsg = messages.at(-1)
  const rawStreamingText = isStreaming && lastMsg?.role === 'assistant' ? lastMsg.content : ''
  const smoothedText = useSmoothedText(rawStreamingText)

  // Refs for values needed in tool execution (avoids re-running effect on state changes)
  const stateRef = useRef(state)
  stateRef.current = state
  const dataRef = useRef(data)
  dataRef.current = data
  const executedToolIdsRef = useRef(new Set<string>())

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

  // Auto-scroll to bottom when messages, smoothed text, or tool activity change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, smoothedText, pendingTools])

  // Execute tool calls as they arrive — only run ones we haven't executed yet
  useEffect(() => {
    if (toolCalls.length === 0) return
    const newTools = toolCalls.filter((tc) => !executedToolIdsRef.current.has(tc.id))
    if (newTools.length === 0) return

    // Track toggled layers to prevent double-toggle when multiple tool calls
    // try to enable the same layer (state snapshot is stale within this batch)
    const toggledLayers = new Set<string>()
    const guardedDispatch: typeof dispatch = (action) => {
      if (action.type === 'TOGGLE_LAYER') {
        if (toggledLayers.has(action.layer)) return
        toggledLayers.add(action.layer)
      }
      dispatch(action)
    }
    const results: Array<ActionResult> = []
    for (const tc of newTools) {
      executedToolIdsRef.current.add(tc.id)
      const result = executeToolCall(tc, {
        state: stateRef.current,
        dispatch: guardedDispatch,
        chartDispatch,
        data: dataRef.current,
      })
      results.push(result)
    }
    setActionResults((prev) => [...prev, ...results])
  }, [toolCalls, dispatch, chartDispatch])

  // Resolve data tool calls against current ExplorerData
  const resolveDataTools = useCallback(
    (tools: Array<ToolCall>) =>
      tools.map((tc) => executeDataTool(tc, dataRef.current)),
    [],
  )

  const handleSubmit = useCallback(
    async (text?: string) => {
      const query = text ?? input.trim()
      if (!query || isStreaming) return

      setInput('')
      setActionResults([])
      executedToolIdsRef.current.clear()

      const kpiSnapshot = buildKpiSnapshot(data)
      const context = buildSystemPrompt(state, kpiSnapshot, data)
      await sendMessage(query, context, resolveDataTools)
    },
    [input, isStreaming, state, data, sendMessage, resolveDataTools],
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
        'fixed bottom-4 z-50 flex w-105 flex-col',
        'left-[calc(280px+(100vw-280px)/2)] -translate-x-1/2',
        'rounded-xl border-2 border-transparent bg-card/90 bg-clip-padding shadow-xl backdrop-blur-xl',
        '[background:linear-gradient(var(--card),var(--card))_padding-box,linear-gradient(135deg,var(--brand-lighter),var(--brand),var(--brand-light))_border-box]',
        'animate-in fade-in slide-in-from-bottom-3 duration-200',
        'max-md:left-1/2 max-md:w-[min(420px,calc(100%-1rem))] max-md:-translate-x-1/2',
        'max-sm:inset-x-2 max-sm:bottom-2 max-sm:w-auto max-sm:translate-x-0',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Ask AI
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    reset()
                    setActionResults([])
                  }}
                  className="rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent/40 hover:text-foreground"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">New chat</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent/40 hover:text-foreground"
              >
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Minimize{' '}
              <kbd className="ml-1 rounded bg-background/20 px-1 py-0.5 text-[0.6rem]" suppressHydrationWarning>
                {typeof navigator !== 'undefined' && /Mac|iPhone/.test(navigator.userAgent) ? '\u2318K' : 'Ctrl+K'}
              </kbd>
            </TooltipContent>
          </Tooltip>
        </div>
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
            {messages.map((msg, i) => {
              const isLastAssistant = isStreaming && msg.role === 'assistant' && i === messages.length - 1
              const text = isLastAssistant ? smoothedText : msg.content
              return (
                <div key={i} className="flex flex-col gap-1">
                  {msg.role === 'user' ? (
                    <div className="text-xs font-medium text-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      <Markdown components={mdComponents}>
                        {text}
                      </Markdown>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Live tool activity during streaming */}
            {isStreaming && pendingTools.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingTools.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[0.6rem] font-medium text-brand"
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    {TOOL_LABELS[name] ?? name}
                  </span>
                ))}
              </div>
            )}

            {/* Action badges (after streaming completes) */}
            {!isStreaming && actionResults.some((r) => r.description) && (
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
            {!isStreaming &&
              messages.length > 0 &&
              messages.at(-1)?.role === 'assistant' && (
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
                    onClick={() =>
                      handleSubmit('Which neighborhoods are most affected?')
                    }
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
          <div className="flex shrink-0 items-center gap-2">
            <span className="animate-shimmer-text text-[0.6rem] font-medium">
              {thinkingWord}...
            </span>
            <button
              onClick={cancel}
              title="Stop generating"
              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <HugeiconsIcon icon={StopIcon} size={14} strokeWidth={2} />
            </button>
          </div>
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
