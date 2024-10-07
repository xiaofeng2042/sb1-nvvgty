import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const addDebugLog = (log: string) => {
    setDebugLog((prev) => [...prev, `${new Date().toISOString()}: ${log}`])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResponse('')
    setDebugLog([])
    setError(null)

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const encodedMessage = encodeURIComponent(message)
    const url = conversationId
      ? `/api/chat?message=${encodedMessage}&conversation_id=${conversationId}`
      : `/api/chat?message=${encodedMessage}`
    
    addDebugLog(`Connecting to: ${url}`)
    
    try {
      eventSourceRef.current = new EventSource(url)

      eventSourceRef.current.onopen = () => {
        addDebugLog('Connection opened')
      }

      eventSourceRef.current.addEventListener('conversation.chat.created', (event) => {
        const data = JSON.parse(event.data)
        setConversationId(data.conversation_id)
        addDebugLog(`Conversation created: ${data.conversation_id}`)
      })

      eventSourceRef.current.addEventListener('conversation.message.delta', (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'answer') {
          setResponse((prev) => prev + data.content)
        }
      })

      eventSourceRef.current.addEventListener('conversation.message.completed', (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'answer') {
          setResponse(data.content)
        }
      })

      eventSourceRef.current.addEventListener('error', (event) => {
        console.error('EventSource failed:', event)
        addDebugLog(`EventSource error: ${JSON.stringify(event)}`)
        setError('Connection error. Please try again.')
        setIsLoading(false)
        eventSourceRef.current?.close()
      })

      eventSourceRef.current.addEventListener('done', () => {
        setIsLoading(false)
        eventSourceRef.current?.close()
      })

    } catch (error) {
      console.error('Error creating EventSource:', error)
      addDebugLog(`Error creating EventSource: ${error}`)
      setError('Failed to establish connection. Please try again.')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Chat with Coze API</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
          className="w-full px-4 py-2 mb-4 border rounded"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Send'}
        </button>
      </form>
      {error && (
        <div className="mt-4 w-full max-w-md text-red-500">
          Error: {error}
        </div>
      )}
      <div className="mt-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Response:</h2>
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
          {response || 'No response yet'}
        </pre>
      </div>
      {conversationId && (
        <div className="mt-4 text-sm text-gray-500">
          Conversation ID: {conversationId}
        </div>
      )}
      <div className="mt-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Debug Log:</h2>
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-xs">
          {debugLog.join('\n')}
        </pre>
      </div>
    </main>
  )
}