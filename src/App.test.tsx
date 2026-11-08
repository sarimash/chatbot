import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import App from './App'

const encoder = new TextEncoder()
const chunk = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

type Request = { model: string; messages: { role: string; content: string }[] }

let requests: Request[]
let push: (text: string) => void
let finish: () => void

// stands in for LM Studio: /models answers at once, the chat reply is fed by hand through push and finish
function mockLmStudio(models = ['text-embedding-x', 'qwen-4b']) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/models') return Response.json({ data: models.map((id) => ({ id })) })

      requests.push(JSON.parse(init?.body as string))
      let controller!: ReadableStreamDefaultController<Uint8Array>
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          controller = c
          init?.signal?.addEventListener('abort', () => c.error(new DOMException('Aborted', 'AbortError')))
        },
      })
      push = (text) => controller.enqueue(encoder.encode(text))
      finish = () => {
        push('data: [DONE]\n\n')
        controller.close()
      }
      return new Response(body)
    }),
  )
}

async function send(text: string) {
  const user = userEvent.setup()
  await screen.findByRole('option', { name: 'qwen-4b' })
  await user.type(screen.getByPlaceholderText('Ask something'), `${text}{Enter}`)
  return user
}

const bubbles = () => document.querySelectorAll('.whitespace-pre-wrap')

beforeEach(() => {
  requests = []
  mockLmStudio()
})

test('lists chat models and leaves out embedding models', async () => {
  render(<App />)
  await screen.findByRole('option', { name: 'qwen-4b' })
  expect(screen.queryByRole('option', { name: 'text-embedding-x' })).toBeNull()
})

test('sends the message and shows the reply as it streams in', async () => {
  render(<App />)
  await send('hi')

  await waitFor(() => expect(requests).toHaveLength(1))
  expect(requests[0]).toEqual({ model: 'qwen-4b', messages: [{ role: 'user', content: 'hi' }], stream: true })

  push(chunk('Hel'))
  await screen.findByText('Hel')
  push(chunk('lo'))
  await screen.findByText('Hello')
  finish()
  await screen.findByRole('button', { name: 'Send' })
})

test('sends earlier turns and the system prompt with the next message', async () => {
  render(<App />)
  const user = await send('one')
  await waitFor(() => expect(requests).toHaveLength(1))
  push(chunk('first reply'))
  await screen.findByText('first reply')
  finish()
  await screen.findByRole('button', { name: 'Send' })

  await user.type(screen.getByPlaceholderText(/concise assistant/), 'Be brief.')
  await user.type(screen.getByPlaceholderText('Ask something'), 'two{Enter}')
  await waitFor(() => expect(requests).toHaveLength(2))
  expect(requests[1].messages).toEqual([
    { role: 'system', content: 'Be brief.' },
    { role: 'user', content: 'one' },
    { role: 'assistant', content: 'first reply' },
    { role: 'user', content: 'two' },
  ])
})

test('does not send an empty message', async () => {
  render(<App />)
  await send('   ')
  expect(requests).toHaveLength(0)
  expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true)
})

test('Stop ends the reply, keeps the text so far and shows no error', async () => {
  render(<App />)
  const user = await send('hi')
  await waitFor(() => expect(requests).toHaveLength(1))
  push(chunk('partial'))
  await screen.findByText('partial')

  await user.click(screen.getByRole('button', { name: 'Stop' }))
  await screen.findByRole('button', { name: 'Send' })
  expect(screen.getByText('partial')).toBeTruthy()
  expect(document.querySelector('.text-red-600')).toBeNull()
})

test('Stop before the first token removes the empty reply but keeps the question', async () => {
  render(<App />)
  const user = await send('hi')
  await user.click(await screen.findByRole('button', { name: 'Stop' }))
  await screen.findByRole('button', { name: 'Send' })

  expect(screen.getByText('hi')).toBeTruthy()
  expect(bubbles()).toHaveLength(1)
})

test('a failed request shows the error and leaves no empty reply', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url === '/api/models' ? Response.json({ data: [{ id: 'qwen-4b' }] }) : new Response('', { status: 503 }),
    ),
  )
  render(<App />)
  await send('hi')

  await screen.findByText("Can't reach LM studio. Is the server running?")
  expect(bubbles()).toHaveLength(1)
})
