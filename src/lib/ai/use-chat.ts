import { useCallback, useEffect, useRef, useState } from 'react'
import { DATA_TOOL_NAMES } from './tools'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** Tool call summary — included in API context for follow-ups, not displayed in UI */
  toolContext?: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

/** Callback that resolves data tool calls against ExplorerData on the client */
export type DataToolResolver = (
  toolCalls: Array<ToolCall>,
) => Array<{ toolCallId: string; name: string; content: string }>

interface StreamOneTurnResult {
  text: string
  tools: Array<ToolCall>
}

/** Wire-format messages sent to the server */
type WireMessage =
  | { role: 'user' | 'assistant'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
  | { role: 'tool'; tool_call_id: string; content: string }

const MAX_TOOL_TURNS = 5

export function useChat() {
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [toolCalls, setToolCalls] = useState<Array<ToolCall>>([])
  /** Tool names currently being resolved (visible to UI during streaming) */
  const [pendingTools, setPendingTools] = useState<Array<string>>([])
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  /** Stream a single request and collect text + tool calls */
  const streamOneTurn = useCallback(
    async (
      wireMessages: Array<WireMessage>,
      context: string,
      signal: AbortSignal,
      onText: (fullText: string) => void,
      onToolStart?: (name: string) => void,
    ): Promise<StreamOneTurnResult> => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: wireMessages, context }),
        signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error((err as { error?: string }).error ?? 'Request failed')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''
      let responseText = ''
      const collectedTools: Array<ToolCall> = []
      const toolCallParts: Map<number, { id: string; name: string; args: string }> = new Map()

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (currentEvent === 'tool_call_start') {
                const idx = parsed.index as number
                toolCallParts.set(idx, {
                  id: parsed.id ?? `tc_${idx}`,
                  name: parsed.name,
                  args: parsed.arguments ?? '',
                })
                onToolStart?.(parsed.name)
              } else if (currentEvent === 'tool_call_chunk') {
                const idx = parsed.index as number
                const part = toolCallParts.get(idx)
                if (part) {
                  part.args += parsed.arguments ?? ''
                }
              } else if (currentEvent === 'text') {
                responseText += parsed.content ?? ''
                onText(responseText)
              } else if (currentEvent === 'done') {
                for (const [, part] of toolCallParts) {
                  let args: Record<string, unknown> = {}
                  try {
                    args = JSON.parse(part.args || '{}')
                  } catch {
                    // Leave as empty object
                  }
                  collectedTools.push({
                    id: part.id,
                    name: part.name,
                    arguments: args,
                  })
                }
              } else if (currentEvent === 'error') {
                responseText += `\n\nError: ${parsed.error ?? 'Unknown error'}`
                onText(responseText)
              }
            } catch {
              // Skip malformed JSON
            }
          } else if (line === '') {
            currentEvent = ''
          }
        }
      }

      // Flush any remaining bytes from the decoder
      const final = decoder.decode()
      if (final) buffer += final

      return { text: responseText, tools: collectedTools }
    },
    [],
  )

  const sendMessage = useCallback(
    async (
      text: string,
      context: string,
      resolveDataTools?: DataToolResolver,
    ): Promise<{ response: string; tools: Array<ToolCall> }> => {
      // Add user message
      const userMsg: ChatMessage = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])
      setIsStreaming(true)
      setToolCalls([])
      setPendingTools([])

      // Build initial wire messages from conversation history
      const wireMessages: Array<WireMessage> = [
        ...messagesRef.current.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.toolContext ? `${m.content}\n\n${m.toolContext}` : m.content,
        })),
        { role: 'user' as const, content: text },
      ]

      let responseText = ''
      const allUiTools: Array<ToolCall> = []
      const allDataToolNames: Array<string> = []

      const updateAssistantMessage = (fullText: string) => {
        setMessages((prev) => {
          const last = prev.at(-1)
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: fullText }]
          }
          return [...prev, { role: 'assistant', content: fullText }]
        })
      }

      try {
        abortRef.current = new AbortController()
        const signal = abortRef.current.signal

        // Multi-turn loop: stream, resolve data tools, continue
        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const result = await streamOneTurn(
            wireMessages,
            context,
            signal,
            updateAssistantMessage,
            (name) => setPendingTools((prev) => [...prev, name]),
          )

          responseText = result.text

          if (result.tools.length === 0) break

          // Separate data tools from UI tools
          const dataTools = result.tools.filter((tc) => DATA_TOOL_NAMES.has(tc.name))
          const uiTools = result.tools.filter((tc) => !DATA_TOOL_NAMES.has(tc.name))
          allUiTools.push(...uiTools)

          // Emit UI tools immediately so the dashboard updates while we keep looping
          if (uiTools.length > 0) {
            setToolCalls([...allUiTools])
          }

          // If no data tools, we're done looping
          if (dataTools.length === 0 || !resolveDataTools) {
            break
          }

          // Resolve data tools client-side
          allDataToolNames.push(...dataTools.map((tc) => tc.name))
          const dataResults = resolveDataTools(dataTools)

          // Build assistant message with tool_calls for the conversation
          const assistantToolCallsMsg: WireMessage = {
            role: 'assistant',
            content: responseText || null,
            tool_calls: result.tools.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.arguments),
              },
            })),
          }

          // Build tool result messages
          const toolResultMsgs: Array<WireMessage> = dataResults.map((r) => ({
            role: 'tool' as const,
            tool_call_id: r.toolCallId,
            content: r.content,
          }))

          // Add stub results for UI tools so the model sees them as resolved
          const uiStubMsgs: Array<WireMessage> = uiTools.map((tc) => ({
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: JSON.stringify({ success: true }),
          }))

          // Append to wire messages for next turn
          wireMessages.push(assistantToolCallsMsg, ...toolResultMsgs, ...uiStubMsgs)

          // Reset streaming text for next turn
          responseText = ''
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          responseText = `Error: ${(err as Error).message}`
        }
      } finally {
        setIsStreaming(false)
        setPendingTools([])
      }

      // Set UI tools for the CommandBar to execute
      setToolCalls(allUiTools)

      // Build tool context string for follow-up conversation history
      const uiToolNames = allUiTools.map((tc) => tc.name)
      const contextParts: Array<string> = []
      if (allDataToolNames.length > 0) {
        contextParts.push(`Data queried: ${allDataToolNames.join(', ')}`)
      }
      if (uiToolNames.length > 0) {
        contextParts.push(`Dashboard actions: ${uiToolNames.join(', ')}`)
      }
      const toolContext = contextParts.length > 0
        ? `[${contextParts.join('. ')}]`
        : undefined

      // Fallback messages
      if (!responseText && allUiTools.length > 0) {
        responseText = 'Done — I\'ve updated the dashboard.'
      }
      if (!responseText && allUiTools.length === 0) {
        responseText = 'I wasn\'t able to generate a response. Try rephrasing your question.'
      }

      // Ensure final assistant message is set
      setMessages((prev) => {
        const last = prev.at(-1)
        if (last?.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...last, content: responseText, toolContext },
          ]
        }
        return [
          ...prev,
          { role: 'assistant', content: responseText, toolContext },
        ]
      })

      return { response: responseText, tools: allUiTools }
    },
    [streamOneTurn],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setToolCalls([])
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, toolCalls, pendingTools, cancel, reset }
}
