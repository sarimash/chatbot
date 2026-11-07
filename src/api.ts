import { parseSse } from './sse'

export type Message = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

async function describeError(res: Response): Promise<string> {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
        return "Can't reach LM studio. Is the server running?"
    }
    try {
        const body = await res.json()
        const message = typeof body.error === 'string' ? body.error : body.error?.message
        if (message) return message
    } catch {
        // if the body isn't JSON, fall through
    }
    return `LM Studio returned ${res.status}`
}

export async function getModels(): Promise<string[]> {
    const res = await fetch('/api/models')
    if (!res.ok) throw new Error(await describeError(res))
    const body = await res.json()
    return body.data.map((m: { id: string }) => m.id)
}

export async function streamChat(
    model: string,
    messages: Message[],
    onToken: (token: string) => void,
    signal?: AbortSignal,
) {
    const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ model, messages, stream: true }),
        signal,
    })
    if (!res.ok || !res.body) throw new Error(await describeError(res))

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while(true) {
            const { done, value } = await reader.read()
            if (done) break

            const parsed = parseSse(buffer + decoder.decode(value, { stream: true }))
            buffer = parsed.rest
            parsed.tokens.forEach(onToken)
            if (parsed.done) return
    }
}