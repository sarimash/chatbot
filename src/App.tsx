import { useEffect, useState, type FormEvent } from 'react'
import { getModels, streamChat, type Message } from './api'

function App() {
  const [models, setModels] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const model = models.find((id) => !id.includes('embed')) ?? ''

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch((err) => setError(err.message))
  }, [])
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !model || loading) return

    const history: Message[] = [...messages, { role: 'user', content: text}]
    setMessages([...messages, { role: 'user', content: text }])
    setInput('')
    setError(null)
    setLoading(true)

    try{
      await streamChat(model, history, (token) => {
        setMessages((prev) => {
          const last = prev[prev.length -1]
          return [...prev.slice(0, -1), { ...last, content: last.content + token }]
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header className="pb-2">
        <h1 className="text-2xl font-semibold">Chatbot</h1>
        <p className="text-sm text-slate-500">{model}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        {messages.map((m, i) => (
          <div
             key={i}
             className={
              m.role === 'user'
                ? 'ml-auto max-w-[80%] whitespace-pre-wrap rounded-lg bg-blue-600 px-3 py-2 text-white'
                : 'max-w-[80%] whitespace-pre-wrap rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800'
             }
          >
            {m.content}
          </div>
        ))}
      </div>

      {error && <p className="py-2 text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <textarea
          rows={2}
          value={input}
          placeholder="Ask something"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          className="flex-1 resize-none rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-600"
        />
        <button
          type="submit"
          disabled={!input.trim() || !model || loading}
          className="rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default App
