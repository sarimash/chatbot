import { useEffect, useState, type FormEvent } from 'react'
import { getModels, type Message } from './api'

function App() {
  const [models, setModels] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const model = models.find((id) => !id.includes('embed')) ?? ''

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch((err) => setError(err.message))
  }, [])
  
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !model) return

    setMessages([...messages, { role: 'user', content: text }])
    setInput('')
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header classname="pb-2">
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
          className="flex-1 resize-none rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-600"
        />
        <button
          type="submit"
          disabled={!input.trim() || !model}
          className="rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default App
