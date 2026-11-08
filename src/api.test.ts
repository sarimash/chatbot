import { expect, test, vi } from 'vitest'
import { getModels, streamChat } from './api'

const encoder = new TextEncoder()
const chunk = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

function streamOf(...chunks: Uint8Array[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(c)
        controller.close()
      },
    }),
  )
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

test('getModels returns the model ids', async () => {
  stubFetch(Response.json({ data: [{ id: 'a' }, { id: 'b' }] }))
  expect(await getModels()).toEqual(['a', 'b'])
})

test.each([502, 503, 504])('maps a %i to the can\'t-reach message', async (status) => {
  stubFetch(new Response('<html>bad gateway</html>', { status }))
  await expect(getModels()).rejects.toThrow("Can't reach LM studio. Is the server running?")
})

test('shows LM Studio\'s error when it is a plain string', async () => {
  stubFetch(Response.json({ error: 'Unexpected endpoint' }, { status: 404 }))
  await expect(getModels()).rejects.toThrow('Unexpected endpoint')
})

test('shows LM Studio\'s error when it is an object with a message', async () => {
  stubFetch(Response.json({ error: { message: 'Model not loaded' } }, { status: 400 }))
  await expect(getModels()).rejects.toThrow('Model not loaded')
})

test('falls back to the status when the error body is not JSON', async () => {
  stubFetch(new Response('boom', { status: 500 }))
  await expect(getModels()).rejects.toThrow('LM Studio returned 500')
})

test('streamChat sends the model, messages and stream flag', async () => {
  const fetchMock = stubFetch(streamOf(encoder.encode('data: [DONE]\n\n')))
  const messages = [{ role: 'user' as const, content: 'hi' }]
  await streamChat('qwen', messages, () => {})

  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe('/api/chat/completions')
  expect(JSON.parse(init.body as string)).toEqual({ model: 'qwen', messages, stream: true })
})

test('streamChat passes tokens on in order, even when a line is split across chunks', async () => {
  const whole = encoder.encode(chunk('Hel') + chunk('lo') + 'data: [DONE]\n\n')
  stubFetch(streamOf(whole.slice(0, 25), whole.slice(25)))

  const tokens: string[] = []
  await streamChat('qwen', [], (token) => tokens.push(token))
  expect(tokens).toEqual(['Hel', 'lo'])
})

test('streamChat does not garble a character split between two chunks', async () => {
  const bytes = encoder.encode(chunk('é'))
  const cut = bytes.indexOf(0xc3) + 1
  stubFetch(streamOf(bytes.slice(0, cut), bytes.slice(cut)))

  const tokens: string[] = []
  await streamChat('qwen', [], (token) => tokens.push(token))
  expect(tokens).toEqual(['é'])
})

test('streamChat stops reading at [DONE]', async () => {
  stubFetch(streamOf(encoder.encode(chunk('a') + 'data: [DONE]\n\n'), encoder.encode(chunk('late'))))

  const tokens: string[] = []
  await streamChat('qwen', [], (token) => tokens.push(token))
  expect(tokens).toEqual(['a'])
})

test('streamChat throws the mapped error for a failed response', async () => {
  stubFetch(new Response('', { status: 503 }))
  await expect(streamChat('qwen', [], () => {})).rejects.toThrow("Can't reach LM studio")
})
