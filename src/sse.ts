export function parseSse(buffer: string) {
    const lines = buffer.split('\n')
    const rest = lines.pop() ?? ''
    const tokens: string[] = []

    for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return { tokens, rest, done: true }

        const token = JSON.parse(data).choices[0]?.delta?.content
        if(token) tokens.push(token)
    }

    return { tokens, rest, done: false }
}