import { useEffect, useState } from 'react'
import { getModels } from './api'

function App() {
  const [models, setModels] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Chatbot</h1>
      { error && <p className="mt-4 text-red-600 dark:text-red-400">{error}</p> }
      <ul className="mt-4 list-disc pl-5">
        {models.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </main>
  )
}

export default App
