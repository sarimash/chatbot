type Key = 'messages' | 'model'

export function load<T>(key: Key, fallback: T): T {
    try {
        const raw = localStorage.getItem(`chatbot:${key}`)
        return raw === null ? fallback : JSON.parse(raw)
    } catch {
        return fallback
    }
}

export function save(key: Key, value: unknown) {
    try {
        localStorage.setItem(`chatbot:${key}`, JSON.stringify(value))
    } catch {
        // storage is full or blocked, but the chat still works without storage
    }
}