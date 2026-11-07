import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getModels, streamChat, type Message } from './api'

function App() {
  // Models is a list of all models, while Model is the currently selected model. 
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [modelsReady, setModelsReady] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<AbortController | null>(null)

  function loadModels() {
    getModels()
      .then((ids) => {
        const chatModels = ids.filter((id) => !id.includes('embed'))
        setModels(chatModels)
        setModel(chatModels[0] ?? '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setModelsReady(true))
  }
  
  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth'})
  }, [messages])
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !model || loading) return

    const history: Message[] = [...messages, { role: 'user', content: text}]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setError(null)
    setLoading(true)

    const controller = new AbortController()
    controllerRef.current = controller

    try{
      await streamChat(model, history, (token) => {
        setMessages((prev) => {
          const last = prev[prev.length -1]
          return [...prev.slice(0, -1), { ...last, content: last.content + token }]
        })
      }, controller.signal,
    )
    } catch (err) {
      // Stopping on purpose isn't an error, keep whatever text has arrived
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      // don't leave an empty bubble behind if request failed or was stopped early
      setMessages((prev) => (prev[prev.length-1]?.content === '' ? prev.slice(0, -1) : prev))
      setLoading(false)
      controllerRef.current = null
    }
  }

  function handleStop() {
    controllerRef.current?.abort()
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header className="pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chatbot</h1>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-transparent p-1 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          {models.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </header>

      {modelsReady && models.length === 0 && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
          <p>{error ?? 'No models found. Load one in LM studio, then try again.'}</p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setModelsReady(false)
              loadModels()
            }}
            className="rounded-lg border border-amber-700 px-3 py-1"
          >
            Try again
        </button>
      </div>
      )}

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
        <div ref={bottomRef} />
      </div>

      {error && models.length > 0 && <p className="py-2 text-red-600 dark:text-red-400">{error}</p>}

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
        {loading? (
          <button
            type="button"
            onClick={handleStop}
            className="rounded-lg bg-slate-700 px-4 text-white"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || !model}
            className="rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  )
}

export default App
