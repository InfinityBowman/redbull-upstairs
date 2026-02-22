import { useCallback, useRef, useState } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
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
          setIsStreaming(false)
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

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          let currentEvent = ''
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
              currentEvent = ''
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          responseText = `Error: ${(err as Error).message}`
        }
      }

      // Ensure final assistant message is set
      if (responseText) {
        setMessages((prev) => {
          const last = prev.at(-1)
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: responseText }]
          }
          return [...prev, { role: 'assistant', content: responseText }]
        })
      }

      setIsStreaming(false)
      return { response: responseText, tools: collectedTools }
    },
    [messages],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, toolCalls, cancel }
}
