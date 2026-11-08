import { useEffect, useState } from 'react'
import { getModels } from './api'
import Chat from './Chat'
import { load, save } from './storage'
import Summarize from './Summarize'

function App() {
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [modelsReady, setModelsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'chat' | 'summarize'>('chat')

  function loadModels() {
    getModels()
      .then((ids) => {
        const chatModels = ids.filter((id) => !id.includes('embed'))
        setModels(chatModels)
        const saved = load('model', '')
        setModel(chatModels.includes(saved) ? saved : (chatModels[0] ?? ''))
      })
      .catch((err) => setError(err.message))
      .finally(() => setModelsReady(true))
  }
  
  useEffect(() => {
    loadModels()
  }, [])

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header className="pb-2 flex items-center gap-2">
        <h1 className="mr-auto text-2xl font-semibold">Chatbot</h1>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value)
            save('model', e.target.value)
          }}
          className="rounded-lg border border-slate-300 bg-transparent p-1 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          {models.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </header>

      <nav className="flex gap-4 border-b border-slate-300 pb-2 dark:border-slate-600">
        <button
          type="button"
          onClick={() => setTab('chat')}
          className={tab === 'chat' ? 'font-semibold' : 'text-slate-500'}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setTab('summarize')}
          className={tab === 'summarize' ? 'font-semibold' : 'text-slate-500'}
        >
          Summarize Page
        </button>
      </nav>

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
      
      <div className={tab === 'chat' ? 'flex min-h-0 flex-1 flex-col pt-2' : 'hidden' }>
        <Chat model = {model} />
      </div>
      <div className={tab === 'summarize' ? 'flex min-h-0 flex-1 flex-col pt-2' : 'hidden'}>
        <Summarize model={model} />
      </div>
    </div>
  )
}

export default App