import { useRef, useState, type FormEvent } from 'react'
import { fetchPage, streamChat } from './api'

const SUMMARY_PROMPT = 
    'Summarize the web page below in three to five short sentences. Give only the gist, with no preamble.'

function Summarize({ model }: { model: string }) {
    const [url, setUrl] = useState('')
    const [status, setStatus] = useState<'idle' | 'fetching' | 'summarizing'>('idle')
    const [title, setTitle] = useState('')
    const [truncated, setTruncated] = useState(false)
    const [summary, setSummary] = useState('')
    const [error, setError] = useState<string | null>(null)
    const controllerRef = useRef<AbortController | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!url.trim() || !model || status !== 'idle') return
        
        setTitle('')
        setTruncated(false)
        setSummary('')
        setError(null)
        setStatus('fetching')

        const controller = new AbortController()
        controllerRef.current = controller

        try {
            const page = await fetchPage(url.trim(), controller.signal)
            setTitle(page.title)
            setTruncated(page.truncated)
            setStatus('summarizing')

            await streamChat(
                model,
                [
                    { role: 'system', content: SUMMARY_PROMPT },
                    { role: 'user', content: `${page.title}\n\n${page.text}` },
                ],
                (token) => setSummary((prev) => prev + token),
                controller.signal,
            ) 
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            setError(err instanceof Error ? err.message : 'Request failed')
        } finally {
            setStatus('idle')
            controllerRef.current = null
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <form onSubmit={handleSubmit} className="flex gap-2 pb-2">
                <input
                  type="url"
                  required
                  value={url}
                  placeholder="https://example.com/article"
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-600"
                />
                {status === 'idle' ? (
                    <button
                      key="summarize"
                      type="submit"
                      disabled={!url.trim() || !model}
                      className="rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50"
                    >
                      Summarize
                    </button>
                ) : (
                  <button
                    key="stop"
                    type="button"
                    onClick={() => controllerRef.current?.abort()}
                    className="rounded-lg bg-slate-700 px-4 text-white"
                  >
                    Stop
                  </button>
                )}
            </form>
         <div className="flex-1 overflow-y-auto py-2">
              {status === 'fetching' && <p className="text-slate-500">Fetching the page...</p>}
              {title && <h2 className="pb-2 text-lg font-semibold">{title}</h2>}
              {truncated && (
                <p className="pb-2 text-sm text-slate-500">
                  The page was long, so only the first part was summarized.
                </p>
              )}
              <p className="whitepace-pre-wrap">{summary}</p>
              {error && <p className="py-2 text-red-600 dark:text-red-400">{error}</p>}
            </div>
        </div>
    )
}

export default Summarize