import { useCallback, useEffect, useRef, useState } from 'react'

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

export function useChat() {
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [toolCalls, setToolCalls] = useState<Array<ToolCall>>([])
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  const sendMessage = useCallback(
    async (
      text: string,
      context: string,
    ): Promise<{ response: string; tools: Array<ToolCall> }> => {
      // Add user message
      const userMsg: ChatMessage = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])
      setIsStreaming(true)
      setToolCalls([])

      // Include toolContext from previous assistant messages so the AI
      // knows what dashboard actions were taken in earlier turns
      const allMessages = [...messagesRef.current, userMsg].map((m) => ({
        role: m.role,
        content: m.toolContext ? `${m.content}\n\n${m.toolContext}` : m.content,
      }))

      const collectedTools: Array<ToolCall> = []
      let responseText = ''

      // Track streaming tool call assembly (index → partial data)
      const toolCallParts: Map<
        number,
        { id: string; name: string; args: string }
      > = new Map()

      try {
        abortRef.current = new AbortController()
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages, context }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }))
          const errMsg = (err as { error?: string }).error ?? 'Request failed'
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: `Error: ${errMsg}`,
          }
          setMessages((prev) => [...prev, assistantMsg])
          return { response: assistantMsg.content, tools: [] }
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let currentEvent = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          // Flush any remaining bytes held by the TextDecoder
          const remaining = decoder.decode()
          if (remaining) buffer += remaining

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
                } else if (currentEvent === 'tool_call_chunk') {
                  const idx = parsed.index as number
                  const part = toolCallParts.get(idx)
                  if (part) {
                    part.args += parsed.arguments ?? ''
                  }
                } else if (currentEvent === 'text') {
                  responseText += parsed.content ?? ''
                  // Update streaming assistant message
                  setMessages((prev) => {
                    const last = prev.at(-1)
                    if (last?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...last, content: responseText },
                      ]
                    }
                    return [
                      ...prev,
                      { role: 'assistant', content: responseText },
                    ]
                  })
                } else if (currentEvent === 'done') {
                  // Finalize all tool calls
                  for (const [, part] of toolCallParts) {
                    let args: Record<string, unknown> = {}
                    try {
                      args = JSON.parse(part.args || '{}')
                    } catch {
                      // Leave as empty object
                    }
                    const tc: ToolCall = {
                      id: part.id,
                      name: part.name,
                      arguments: args,
                    }
                    collectedTools.push(tc)
                  }
                  setToolCalls(collectedTools)
                } else if (currentEvent === 'error') {
                  responseText += `\n\nError: ${parsed.error ?? 'Unknown error'}`
                }
              } catch {
                // Skip malformed JSON
              }
            } else if (line === '') {
              // SSE event boundary — reset event type
              currentEvent = ''
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          responseText = `Error: ${(err as Error).message}`
        }
      } finally {
        setIsStreaming(false)
      }

      // Build tool context string for follow-up conversation history
      const toolContext = collectedTools.length > 0
        ? `[Dashboard actions taken: ${collectedTools.map((tc) => tc.name).join(', ')}]`
        : undefined

      // If the AI returned only tool calls with no text, provide a fallback
      if (!responseText && collectedTools.length > 0) {
        responseText = 'Done — I\'ve updated the dashboard.'
      }

      // If the AI returned nothing at all, show a fallback
      if (!responseText && collectedTools.length === 0) {
        responseText = 'I wasn\'t able to generate a response. Try rephrasing your question.'
      }

      // Ensure final assistant message is set (with toolContext for follow-ups)
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

      return { response: responseText, tools: collectedTools }
    },
    [],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, toolCalls, cancel }
}
