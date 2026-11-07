export async function getModels(): Promise<string[]> {
    const res = await fetch('/api/models')
    if (!res.ok) throw new Error(`LM Studio returned ${res.status}`)
    const body = await res.json()
    return body.data.map((m: { id: string }) => m.id)
}