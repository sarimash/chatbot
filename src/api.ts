import { parseSse } from './sse'

export type Message = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export async function getModels(): Promise<string[]> {
    const res = await fetch('/api/models')
    if (!res.ok) throw new Error(`LM Studio returned ${res.status}`)
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
    if (!res.ok || !res.body) throw new Error(`LM Studio returned ${res.status}`)

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